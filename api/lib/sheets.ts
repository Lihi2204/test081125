import { google } from 'googleapis';
import type { ExamSession, RosterEntry, Question } from '../../src/types';

// Initialize Google Sheets client
function getGoogleAuth() {
  const keyBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!keyBase64) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set');
  }

  let credentials;
  try {
    credentials = JSON.parse(Buffer.from(keyBase64, 'base64').toString());
  } catch (err) {
    throw new Error('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY - invalid base64 or JSON');
  }

  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

function getSheets() {
  const auth = getGoogleAuth();
  return google.sheets({ version: 'v4', auth });
}

// Sheet IDs from environment
const SESSIONS_SHEET_ID = process.env.SESSIONS_SHEET_ID || '';
const ROSTER_SHEET_ID = process.env.ROSTER_SHEET_ID || '';
const QUESTIONS_SHEET_ID = process.env.QUESTIONS_SHEET_ID || '';

// Validate required environment variables
function validateSheetConfig(sheetId: string, sheetName: string): void {
  if (!sheetId) {
    throw new Error(`${sheetName} environment variable is not set`);
  }
}

// Helper to convert row to ExamSession object
function rowToSession(row: string[], headers: string[]): ExamSession {
  const session: Record<string, unknown> = {};
  headers.forEach((header, idx) => {
    const value = row[idx] || '';

    // Parse boolean values
    if (header === 'consent' || header === 'precheck_passed' || header === 'finalized') {
      session[header] = value.toUpperCase() === 'TRUE';
    }
    // Parse number values
    else if (
      header === 'duration_minutes' ||
      header === 'q1_score' ||
      header === 'q2_score' ||
      header === 'q3_score' ||
      header === 'total_correct' ||
      header === 'total_score_0_100' ||
      header === 'q1_id' ||
      header === 'q2_id' ||
      header === 'q3_id'
    ) {
      session[header] = value ? parseFloat(value) : undefined;
    }
    // Parse JSON values
    else if (header === 'q1_json' || header === 'q2_json' || header === 'q3_json') {
      try {
        session[header] = value ? JSON.parse(value) : undefined;
      } catch {
        session[header] = undefined;
      }
    }
    // Parse hint booleans
    else if (header === 'q1_hint' || header === 'q2_hint' || header === 'q3_hint') {
      session[header] = value.toUpperCase() === 'TRUE';
    } else {
      session[header] = value || undefined;
    }
  });

  return session as unknown as ExamSession;
}

// Helper to convert ExamSession to row
function sessionToRow(session: Partial<ExamSession>, headers: string[]): string[] {
  return headers.map((header) => {
    const value = session[header as keyof ExamSession];

    if (value === undefined || value === null) return '';
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  });
}

// Session CRUD operations
export async function createSession(session: Partial<ExamSession>): Promise<boolean> {
  validateSheetConfig(SESSIONS_SHEET_ID, 'SESSIONS_SHEET_ID');
  const sheets = getSheets();

  // Get headers
  const headersResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SESSIONS_SHEET_ID,
    range: 'exam_sessions!1:1',
  });
  const headers = headersResponse.data.values?.[0] || [];

  const row = sessionToRow(session, headers as string[]);

  await sheets.spreadsheets.values.append({
    spreadsheetId: SESSIONS_SHEET_ID,
    range: 'exam_sessions!A:A',
    valueInputOption: 'RAW',
    requestBody: {
      values: [row],
    },
  });

  return true;
}

export async function getSession(sessionId: string): Promise<ExamSession | null> {
  validateSheetConfig(SESSIONS_SHEET_ID, 'SESSIONS_SHEET_ID');
  const sheets = getSheets();

  // Get all data
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SESSIONS_SHEET_ID,
    range: 'exam_sessions!A:AZ',
  });

  const rows = response.data.values || [];
  if (rows.length < 2) return null;

  const headers = rows[0] as string[];
  const sessionIdIdx = headers.indexOf('session_id');

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][sessionIdIdx] === sessionId) {
      return rowToSession(rows[i] as string[], headers);
    }
  }

  return null;
}

export async function updateSession(
  sessionId: string,
  updates: Partial<ExamSession>
): Promise<boolean> {
  const sheets = getSheets();

  // Get all data
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SESSIONS_SHEET_ID,
    range: 'exam_sessions!A:AZ',
  });

  const rows = response.data.values || [];
  if (rows.length < 2) return false;

  const headers = rows[0] as string[];
  const sessionIdIdx = headers.indexOf('session_id');

  // Find row index
  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][sessionIdIdx] === sessionId) {
      rowIndex = i;
      break;
    }
  }

  if (rowIndex === -1) return false;

  // Update specific columns
  const updateRanges: Array<{ range: string; values: string[][] }> = [];

  for (const [key, value] of Object.entries(updates)) {
    const colIdx = headers.indexOf(key);
    if (colIdx === -1) continue;

    const colLetter = String.fromCharCode(65 + colIdx);
    let cellValue: string;

    if (typeof value === 'boolean') {
      cellValue = value ? 'TRUE' : 'FALSE';
    } else if (typeof value === 'object') {
      cellValue = JSON.stringify(value);
    } else if (value === undefined || value === null) {
      cellValue = '';
    } else {
      cellValue = String(value);
    }

    updateRanges.push({
      range: `exam_sessions!${colLetter}${rowIndex + 1}`,
      values: [[cellValue]],
    });
  }

  // Batch update
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SESSIONS_SHEET_ID,
    requestBody: {
      valueInputOption: 'RAW',
      data: updateRanges,
    },
  });

  return true;
}

export async function getAllSessions(): Promise<ExamSession[]> {
  const sheets = getSheets();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SESSIONS_SHEET_ID,
    range: 'exam_sessions!A:AZ',
  });

  const rows = response.data.values || [];
  if (rows.length < 2) return [];

  const headers = rows[0] as string[];
  const sessions: ExamSession[] = [];

  for (let i = 1; i < rows.length; i++) {
    sessions.push(rowToSession(rows[i] as string[], headers));
  }

  return sessions;
}

// Roster operations
export async function getRosterEntry(studentIdHash: string): Promise<RosterEntry | null> {
  validateSheetConfig(ROSTER_SHEET_ID, 'ROSTER_SHEET_ID');
  const sheets = getSheets();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: ROSTER_SHEET_ID,
    range: 'roster!A:M',
  });

  const rows = response.data.values || [];
  if (rows.length < 2) return null;

  const headers = rows[0] as string[];
  const hashIdx = headers.indexOf('student_id_hash');

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][hashIdx] === studentIdHash) {
      const entry: Record<string, unknown> = {};
      headers.forEach((header, idx) => {
        entry[header] = rows[i][idx] || '';
      });
      return entry as unknown as RosterEntry;
    }
  }

  return null;
}

export async function updateRosterEntry(
  studentIdHash: string,
  updates: Partial<RosterEntry>
): Promise<boolean> {
  const sheets = getSheets();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: ROSTER_SHEET_ID,
    range: 'roster!A:M',
  });

  const rows = response.data.values || [];
  if (rows.length < 2) return false;

  const headers = rows[0] as string[];
  const hashIdx = headers.indexOf('student_id_hash');

  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][hashIdx] === studentIdHash) {
      rowIndex = i;
      break;
    }
  }

  if (rowIndex === -1) return false;

  const updateRanges: Array<{ range: string; values: string[][] }> = [];

  for (const [key, value] of Object.entries(updates)) {
    const colIdx = headers.indexOf(key);
    if (colIdx === -1) continue;

    const colLetter = String.fromCharCode(65 + colIdx);
    updateRanges.push({
      range: `roster!${colLetter}${rowIndex + 1}`,
      values: [[String(value)]],
    });
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: ROSTER_SHEET_ID,
    requestBody: {
      valueInputOption: 'RAW',
      data: updateRanges,
    },
  });

  return true;
}

// Question bank operations
export async function getRandomQuestions(count: number = 3): Promise<Question[]> {
  const sheets = getSheets();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: QUESTIONS_SHEET_ID,
    range: 'questions_bank!A:E',
  });

  const rows = response.data.values || [];
  if (rows.length < 2) return [];

  const headers = rows[0] as string[];
  const questions: Question[] = [];

  for (let i = 1; i < rows.length; i++) {
    const q: Record<string, unknown> = {};
    headers.forEach((header, idx) => {
      const value = rows[i][idx] || '';
      if (header === 'id' || header === 'difficulty') {
        q[header] = parseInt(value) || 0;
      } else {
        q[header] = value;
      }
    });
    questions.push(q as unknown as Question);
  }

  // Shuffle and take random questions
  const shuffled = questions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export async function getQuestion(questionId: number): Promise<Question | null> {
  const sheets = getSheets();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: QUESTIONS_SHEET_ID,
    range: 'questions_bank!A:E',
  });

  const rows = response.data.values || [];
  if (rows.length < 2) return null;

  const headers = rows[0] as string[];
  const idIdx = headers.indexOf('id');

  for (let i = 1; i < rows.length; i++) {
    if (parseInt(rows[i][idIdx] || '0') === questionId) {
      const q: Record<string, unknown> = {};
      headers.forEach((header, idx) => {
        const value = rows[i][idx] || '';
        if (header === 'id' || header === 'difficulty') {
          q[header] = parseInt(value) || 0;
        } else {
          q[header] = value;
        }
      });
      return q as unknown as Question;
    }
  }

  return null;
}
