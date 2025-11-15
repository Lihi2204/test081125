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

  // Get session
  const session = await getSession(session_id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const endedAt = new Date().toISOString();
  const startedAt = session.started_at ? new Date(session.started_at) : new Date();
  const durationMinutes = (new Date(endedAt).getTime() - startedAt.getTime()) / (1000 * 60);

  // Update session
  await updateSession(session_id, {
    ended_at: endedAt,
    duration_minutes: parseFloat(durationMinutes.toFixed(2)),
    status: 'uploading',
    video_link: `https://drive.google.com/drive/folders/${process.env.DRIVE_FOLDER_ID}`,
  });

  // In production, this would trigger transcription and scoring pipelines
  // For now, we'll just mark as complete

  // Trigger background processing (in production)
  // await triggerTranscriptionPipeline(session_id);

  return res.status(200).json({
    success: true,
    video_link: `https://drive.google.com/drive/folders/${process.env.DRIVE_FOLDER_ID}`,
    status: 'uploading',
  });
}
