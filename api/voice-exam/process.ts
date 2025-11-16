import { VercelRequest, VercelResponse } from '@vercel/node';
import { IncomingForm, Fields, Files } from 'formidable';
import { readFileSync, unlinkSync } from 'fs';
import { google } from 'googleapis';
import CryptoJS from 'crypto-js';

// Parse multipart form data
async function parseFormData(req: VercelRequest): Promise<{ fields: Fields; files: Files }> {
  const form = new IncomingForm({
    multiples: true,
    maxFileSize: 50 * 1024 * 1024, // 50MB max
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

// Transcribe audio using Whisper API
async function transcribeAudio(audioBuffer: Buffer, filename: string): Promise<string> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY not set - using mock transcription');
    return '[Mock transcription - OpenAI API key not configured]';
  }

  const formData = new FormData();
  const blob = new Blob([audioBuffer], { type: 'audio/webm' });
  formData.append('file', blob, filename);
  formData.append('model', 'whisper-1');
  formData.append('language', 'he');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Whisper API error: ${error}`);
  }

  const result = await response.json();
  return result.text;
}

// Score answer using Claude API
async function scoreAnswer(question: string, answer: string): Promise<{ score: number; feedback: string }> {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY not set - using mock scoring');
    return {
      score: Math.floor(Math.random() * 40) + 60, // Random score 60-100
      feedback: 'Mock feedback - Anthropic API key not configured',
    };
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `אתה בוחן בקורס AI בעסקים. נקד את התשובה הבאה.

שאלה: ${question}

תשובת הסטודנט: ${answer}

נקד את התשובה מ-0 עד 100 בהתאם לקריטריונים:
- הבנת הנושא (40 נקודות)
- דוגמאות רלוונטיות (30 נקודות)
- בהירות ההסבר (30 נקודות)

החזר JSON בלבד בפורמט:
{
  "score": <ציון 0-100>,
  "feedback": "<משוב קצר בעברית, עד 2 משפטים>"
}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${error}`);
  }

  const result = await response.json();
  const content = result.content[0].text;

  try {
    return JSON.parse(content);
  } catch {
    // Try to extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Failed to parse Claude response');
  }
}

// Save to Google Sheets
async function saveToSheets(data: Record<string, string | number>): Promise<void> {
  const VOICE_EXAM_SHEET_ID = process.env.VOICE_EXAM_SHEET_ID;

  if (!VOICE_EXAM_SHEET_ID) {
    console.warn('VOICE_EXAM_SHEET_ID not set - skipping save');
    return;
  }

  const keyBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyBase64) {
    console.warn('GOOGLE_SERVICE_ACCOUNT_KEY not set - skipping save');
    return;
  }

  const credentials = JSON.parse(Buffer.from(keyBase64, 'base64').toString());
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  // Get headers
  const headersResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: VOICE_EXAM_SHEET_ID,
    range: 'voice_exams!1:1',
  });

  const headers = (headersResponse.data.values?.[0] as string[]) || [];

  // Create row based on headers
  const row = headers.map((header) => {
    const value = data[header];
    if (value === undefined || value === null) return '';
    return String(value);
  });

  await sheets.spreadsheets.values.append({
    spreadsheetId: VOICE_EXAM_SHEET_ID,
    range: 'voice_exams!A:A',
    valueInputOption: 'RAW',
    requestBody: {
      values: [row],
    },
  });
}

// Hash student ID for privacy
function hashStudentId(idNumber: string): string {
  return CryptoJS.SHA256(idNumber).toString().substring(0, 16);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fields, files } = await parseFormData(req);

    // Parse student info
    const studentInfoRaw = Array.isArray(fields.studentInfo)
      ? fields.studentInfo[0]
      : fields.studentInfo;
    const studentInfo = JSON.parse(studentInfoRaw as string);

    // Parse questions
    const questionsRaw = Array.isArray(fields.questions) ? fields.questions[0] : fields.questions;
    const questions = JSON.parse(questionsRaw as string);

    const results: Array<{
      question: string;
      transcript: string;
      score: number;
      feedback: string;
    }> = [];

    // Process each audio file
    for (let i = 0; i < questions.length; i++) {
      const audioKey = `audio_${i}`;
      const audioFile = Array.isArray(files[audioKey]) ? files[audioKey][0] : files[audioKey];

      let transcript = '';
      let score = 0;
      let feedback = '';

      if (audioFile && audioFile.filepath) {
        // Read audio file
        const audioBuffer = readFileSync(audioFile.filepath);

        // Transcribe
        transcript = await transcribeAudio(audioBuffer, `answer_${i}.webm`);

        // Score
        const scoring = await scoreAnswer(questions[i], transcript);
        score = scoring.score;
        feedback = scoring.feedback;

        // Clean up temp file
        try {
          unlinkSync(audioFile.filepath);
        } catch {
          // Ignore cleanup errors
        }
      } else {
        transcript = 'לא התקבלה תשובה';
        score = 0;
        feedback = 'הסטודנט לא הקליט תשובה לשאלה זו';
      }

      results.push({
        question: questions[i],
        transcript,
        score,
        feedback,
      });
    }

    // Calculate total score
    const totalScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);

    // Save to Google Sheets
    const sheetData: Record<string, string | number> = {
      timestamp: new Date().toISOString(),
      student_id_hash: hashStudentId(studentInfo.idNumber),
      id_last4: studentInfo.idNumber.slice(-4),
      first_name: studentInfo.firstName,
      last_name: studentInfo.lastName,
      q1_text: questions[0] || '',
      q1_answer: results[0]?.transcript || '',
      q1_score: results[0]?.score || 0,
      q1_feedback: results[0]?.feedback || '',
      q2_text: questions[1] || '',
      q2_answer: results[1]?.transcript || '',
      q2_score: results[1]?.score || 0,
      q2_feedback: results[1]?.feedback || '',
      q3_text: questions[2] || '',
      q3_answer: results[2]?.transcript || '',
      q3_score: results[2]?.score || 0,
      q3_feedback: results[2]?.feedback || '',
      total_score: totalScore,
    };

    await saveToSheets(sheetData);

    return res.status(200).json({
      success: true,
      results,
      totalScore,
    });
  } catch (error) {
    console.error('Voice exam processing error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      results: [],
      totalScore: 0,
    });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
