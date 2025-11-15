import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAllSessions } from '../lib/sheets';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify admin authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // In production, verify JWT token for admin
  // const token = authHeader.split(' ')[1];
  // const adminUser = verifyAdminToken(token);

  try {
    const sessions = await getAllSessions();

    // Transform to list format
    const sessionList = sessions.map((session) => ({
      session_id: session.session_id,
      student_name: `${session.first_name} ${session.last_name}`,
      id_last4: session.id_last4,
      date: session.started_at || session.slot_start,
      total_score: session.total_score_0_100,
      status: session.status,
      finalized: session.finalized,
    }));

    return res.status(200).json({
      sessions: sessionList,
      count: sessionList.length,
    });
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    return res.status(500).json({ error: 'Failed to fetch sessions' });
  }
}
