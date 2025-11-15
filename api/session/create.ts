import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from '../lib/jwt';
import { updateSession, getRandomQuestions } from '../lib/sheets';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, consent, precheck_passed } = req.body;

  if (!token || !consent || !precheck_passed) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Verify token
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Get random questions for this session
  const questions = await getRandomQuestions(3);

  if (questions.length < 3) {
    return res.status(500).json({ error: 'Not enough questions in bank' });
  }

  // Generate session ID
  const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Update session with consent and questions
  await updateSession(payload.student_id_hash, {
    session_id: sessionId,
    consent: true,
    precheck_passed: true,
    precheck_at: new Date().toISOString(),
    status: 'setup',
    q1_id: questions[0].id,
    q1_text: questions[0].question_text,
    q2_id: questions[1].id,
    q2_text: questions[1].question_text,
    q3_id: questions[2].id,
    q3_text: questions[2].question_text,
  });

  return res.status(200).json({
    session_id: sessionId,
    questions: questions.map((q) => ({
      id: q.id,
      text: q.question_text,
    })),
    status: 'setup',
  });
}
