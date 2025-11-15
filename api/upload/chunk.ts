import type { VercelRequest, VercelResponse } from '@vercel/node';
import { IncomingForm, Fields, Files } from 'formidable';
import fs from 'fs';
import { uploadVideo } from '../lib/drive';
import { updateSession } from '../lib/sheets';

export const config = {
  api: {
    bodyParser: false,
  },
};

interface ParsedForm {
  fields: Fields;
  files: Files;
}

const parseForm = (req: VercelRequest): Promise<ParsedForm> => {
  const form = new IncomingForm({
    maxFileSize: 500 * 1024 * 1024, // 500MB max
  });

  return new Promise((resolve, reject) => {
    form.parse(req as unknown as import('http').IncomingMessage, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fields, files } = await parseForm(req);

    const sessionId = Array.isArray(fields.session_id)
      ? fields.session_id[0]
      : fields.session_id;
    const questionId = Array.isArray(fields.question_id)
      ? fields.question_id[0]
      : fields.question_id;
    const chunkType = Array.isArray(fields.chunk_type)
      ? fields.chunk_type[0]
      : fields.chunk_type || 'answer';
    const hintUsed =
      (Array.isArray(fields.hint_used) ? fields.hint_used[0] : fields.hint_used) === 'true';

    if (!sessionId || !questionId || !files.file) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    const fileBuffer = fs.readFileSync(file.filepath);
    const fileSizeMB = fileBuffer.length / (1024 * 1024);

    // Upload to Google Drive
    const fileName = `${sessionId}_q${questionId}_${chunkType}_${Date.now()}.webm`;
    const uploadResult = await uploadVideo(fileName, fileBuffer);

    // Update session with hint usage
    const hintField = `q${questionId}_hint` as const;
    await updateSession(sessionId as string, {
      [hintField]: hintUsed,
    } as Record<string, boolean>);

    // Clean up temp file
    fs.unlinkSync(file.filepath);

    return res.status(200).json({
      success: true,
      chunk_id: `chunk-${questionId}-${chunkType}`,
      size_mb: parseFloat(fileSizeMB.toFixed(2)),
      drive_link: uploadResult.webViewLink,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Upload failed' });
  }
}
