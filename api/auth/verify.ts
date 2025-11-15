import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from '../lib/jwt';
import { getRosterEntry, getSession, createSession } from '../lib/sheets';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ valid: false, error: 'TOKEN_INVALID' });
  }

  // Verify JWT token
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ valid: false, error: 'TOKEN_INVALID' });
  }

  // Check if token is expired
  if (payload.exp * 1000 < Date.now()) {
    return res.status(401).json({ valid: false, error: 'TOKEN_EXPIRED' });
  }

  // Check if student is in roster
  const rosterEntry = await getRosterEntry(payload.student_id_hash);

  if (!rosterEntry) {
    return res.status(404).json({ valid: false, error: 'NOT_IN_ROSTER' });
  }

  // Check if already completed
  if (rosterEntry.attempt_status === 'completed') {
    return res.status(403).json({ valid: false, error: 'ALREADY_COMPLETED' });
  }

  // Check if within allowed time window (15 min before to slot end)
  const now = new Date();
  const slotStart = new Date(payload.slot_start);
  const slotEnd = new Date(payload.slot_end);
  const prepStart = new Date(slotStart.getTime() - 15 * 60 * 1000); // 15 min before

  if (now < prepStart || now > slotEnd) {
    return res.status(403).json({
      valid: false,
      error: 'TOKEN_EXPIRED',
      message: 'Outside allowed time window',
    });
  }

  // Create or retrieve session
  let sessionId = uuidv4();
  let status = 'not_started';

  // Check if there's an existing session
  const existingSession = await getSession(rosterEntry.student_id_hash);
  if (existingSession && existingSession.status !== 'completed') {
    sessionId = existingSession.session_id;
    status = existingSession.status;
  } else if (!existingSession) {
    // Create new session entry
    await createSession({
      session_id: sessionId,
      student_id_hash: payload.student_id_hash,
      id_last4: payload.id_last4,
      first_name: payload.first_name,
      last_name: payload.last_name,
      email: payload.email,
      slot_start: payload.slot_start,
      slot_end: payload.slot_end,
      status: 'not_started',
      consent: false,
      precheck_passed: false,
      finalized: false,
    });
  }

  // Return valid response
  return res.status(200).json({
    valid: true,
    student: {
      student_id_hash: payload.student_id_hash,
      id_last4: payload.id_last4,
      first_name: payload.first_name,
      last_name: payload.last_name,
      email: payload.email,
      slot_start: payload.slot_start,
      slot_end: payload.slot_end,
    },
    session_id: sessionId,
    status,
    can_start: now >= prepStart,
  });
}
