import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSession, updateSession } from '../lib/sheets';
import { listSessionFiles, downloadFile } from '../lib/drive';
import { transcribeAudio } from '../lib/whisper';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id } = req.body;

  if (!session_id) {
    return res.status(400).json({ error: 'Missing session_id' });
  }

  try {
    // Get session to verify it exists
    const session = await getSession(session_id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status !== 'uploading') {
      return res.status(400).json({
        error: 'Session must be in uploading status',
        current_status: session.status
      });
    }

    // Update status to transcribing
    await updateSession(session_id, {
      status: 'transcribing',
    });

    // Get all video files for this session from Google Drive
    const files = await listSessionFiles(session_id);

    if (files.length === 0) {
      return res.status(400).json({ error: 'No video files found for session' });
    }

    // Group files by question ID (take the first one for each question)
    const questionFiles = new Map<number, { id: string; name: string }>();
    for (const file of files) {
      if (!questionFiles.has(file.questionId)) {
        questionFiles.set(file.questionId, { id: file.id, name: file.name });
      }
    }

    // Transcribe each question's audio
    const transcripts: Record<string, string> = {};
    const updates: Record<string, string> = {};

    for (const [questionId, fileInfo] of questionFiles) {
      try {
        // Download video file from Google Drive
        const videoBuffer = await downloadFile(fileInfo.id);

        // Transcribe audio (Whisper handles webm format)
        const transcription = await transcribeAudio(videoBuffer, fileInfo.name);

        const key = `q${questionId}` as 'q1' | 'q2' | 'q3';
        transcripts[key] = transcription.text;

        // Prepare updates for Google Sheets
        updates[`q${questionId}_transcript`] = transcription.text;
      } catch (error) {
        console.error(`Failed to transcribe question ${questionId}:`, error);
        const key = `q${questionId}` as 'q1' | 'q2' | 'q3';
        transcripts[key] = '[שגיאה בתמלול - נדרשת סקירה ידנית]';
        updates[`q${questionId}_transcript`] = '[שגיאה בתמלול - נדרשת סקירה ידנית]';
      }
    }

    // Update session with transcripts
    await updateSession(session_id, updates as unknown as Record<string, unknown>);

    return res.status(200).json({
      success: true,
      transcripts: {
        q1: transcripts.q1 || '',
        q2: transcripts.q2 || '',
        q3: transcripts.q3 || '',
      },
      status: 'transcribing',
    });
  } catch (error) {
    console.error('Transcription error:', error);
    // Revert status on error
    await updateSession(session_id, { status: 'uploading' });
    return res.status(500).json({
      error: 'Transcription failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
