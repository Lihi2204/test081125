import type { VercelRequest, VercelResponse } from '@vercel/node';
import { updateSession, getSession } from '../lib/sheets';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id } = req.body;

  if (!session_id) {
    return res.status(400).json({ error: 'Missing session_id' });
  }

  // Get session to verify it exists
  const session = await getSession(session_id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (session.status !== 'setup') {
    return res.status(400).json({ error: 'Session cannot be started' });
  }

  const startedAt = new Date().toISOString();

  // Update session status
  await updateSession(session_id, {
    started_at: startedAt,
    status: 'in_progress',
  });

  return res.status(200).json({
    success: true,
    started_at: startedAt,
    status: 'in_progress',
  });
}
