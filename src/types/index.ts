// Session Status Enum
export type SessionStatus =
  | 'not_started'
  | 'precheck'
  | 'setup'
  | 'in_progress'
  | 'uploading'
  | 'transcribing'
  | 'scoring'
  | 'completed'
  | 'aborted'
  | 'expired';

// Verdict Enum
export type Verdict = 'correct' | 'partial' | 'wrong';

// Student Data (from JWT token)
export interface Student {
  student_id_hash: string;
  id_last4: string;
  first_name: string;
  last_name: string;
  email: string;
  slot_start: string; // ISO DateTime
  slot_end: string; // ISO DateTime
}

// Question from question bank
export interface Question {
  id: number;
  question_text: string;
  sample_answer: string;
  difficulty: number; // 1=easy, 2=medium, 3=hard
  topic?: string;
}

// Scoring result from Claude API
export interface ScoringResult {
  accuracy: number; // 0-1
  structure: number; // 0-1
  terminology: number; // 0-1
  logic: number; // 0-1
  alignment: number; // 0-1
  per_question_score_0_100: number;
  verdict: Verdict;
  short_explanation_he: string;
}

// Question Answer (stored in session)
export interface QuestionAnswer {
  id: number;
  text: string;
  transcript: string;
  hint_used: boolean;
  verdict: Verdict;
  score: number; // 0-100
  json: ScoringResult;
}

// Full Exam Session
export interface ExamSession {
  session_id: string;
  student_id_hash: string;
  id_last4: string;
  first_name: string;
  last_name: string;
  email: string;
  slot_start: string;
  slot_end: string;
  started_at?: string;
  ended_at?: string;
  duration_minutes?: number;
  status: SessionStatus;
  consent: boolean;
  precheck_passed: boolean;
  precheck_at?: string;
  video_link?: string;
  q1_id?: number;
  q1_text?: string;
  q1_transcript?: string;
  q1_verdict?: Verdict;
  q1_score?: number;
  q1_hint?: boolean;
  q1_json?: ScoringResult;
  q2_id?: number;
  q2_text?: string;
  q2_transcript?: string;
  q2_verdict?: Verdict;
  q2_score?: number;
  q2_hint?: boolean;
  q2_json?: ScoringResult;
  q3_id?: number;
  q3_text?: string;
  q3_transcript?: string;
  q3_verdict?: Verdict;
  q3_score?: number;
  q3_hint?: boolean;
  q3_json?: ScoringResult;
  total_correct?: number;
  total_score_0_100?: number;
  finalized: boolean;
  reviewed_by?: string;
  notes?: string;
  email_sent_at?: string;
  cleaned_at?: string;
}

// Roster Entry
export interface RosterEntry {
  student_id_hash: string;
  id_last4: string;
  first_name: string;
  last_name: string;
  email: string;
  slot_start: string;
  slot_end: string;
  slot_prep_buffer_sec: number;
  allowed_window_id?: string;
  token?: string;
  token_issued_at?: string;
  attempt_status: SessionStatus;
}

// JWT Token Payload
export interface TokenPayload {
  student_id_hash: string;
  id_last4: string;
  first_name: string;
  last_name: string;
  email: string;
  slot_start: string;
  slot_end: string;
  exp: number;
  iat: number;
}

// API Response Types
export interface AuthVerifyResponse {
  valid: boolean;
  student?: Student;
  session_id?: string;
  status?: SessionStatus;
  can_start?: boolean;
  error?: 'TOKEN_EXPIRED' | 'TOKEN_INVALID' | 'ALREADY_COMPLETED' | 'NOT_IN_ROSTER';
}

export interface SessionCreateResponse {
  session_id: string;
  questions: Array<{ id: number; text: string }>;
  status: SessionStatus;
}

export interface SessionStartResponse {
  success: boolean;
  started_at: string;
  status: SessionStatus;
}

export interface UploadChunkResponse {
  success: boolean;
  chunk_id: string;
  size_mb: number;
}

export interface UploadFinalizeResponse {
  success: boolean;
  video_link: string;
  status: SessionStatus;
}

export interface TranscribeResponse {
  success: boolean;
  transcripts: {
    q1: string;
    q2: string;
    q3: string;
  };
  status: SessionStatus;
}

export interface ScoreResponse {
  success: boolean;
  scores: {
    q1: ScoringResult;
    q2: ScoringResult;
    q3: ScoringResult;
  };
  total_correct: number;
  total_score_0_100: number;
  status: SessionStatus;
}

export interface NotifyResponse {
  success: boolean;
  email_sent_to: string;
  email_sent_at: string;
}

// Admin Dashboard Types
export interface SessionListItem {
  session_id: string;
  student_name: string;
  id_last4: string;
  date: string;
  total_score?: number;
  status: SessionStatus;
  finalized: boolean;
}

export interface SessionDetailResponse {
  session_id: string;
  student: {
    first_name: string;
    last_name: string;
    id_last4: string;
    email: string;
  };
  started_at: string;
  ended_at: string;
  duration_minutes: number;
  video_link: string;
  questions: Array<{
    id: number;
    text: string;
    transcript: string;
    hint_used: boolean;
    score: number;
    verdict: Verdict;
    json: ScoringResult;
  }>;
  totals: {
    correct: number;
    score_0_100: number;
  };
  finalized: boolean;
  notes: string;
}

// Frontend State Types
export interface ExamState {
  token: string | null;
  student: Student | null;
  sessionId: string | null;
  questions: Array<{ id: number; text: string }>;
  currentQuestionIndex: number;
  status: SessionStatus;
  consent: boolean;
  precheckPassed: boolean;
  chunks: Map<number, Blob>; // question id -> video blob
  hintUsed: Map<number, boolean>;
  isRecording: boolean;
  timeRemaining: number; // seconds
  error: string | null;
}

// Recording chunk metadata
export interface ChunkMetadata {
  session_id: string;
  question_id: number;
  chunk_type: 'answer' | 'followup';
  hint_used: boolean;
  timestamp: string;
}

// Email Template Variables
export interface InstructorEmailVars {
  first_name: string;
  last_name: string;
  id_last4: string;
  date_hebrew: string;
  duration_minutes: number;
  video_link: string;
  dashboard_link: string;
  q1_id: number;
  q1_text: string;
  q1_transcript: string;
  q1_score: number;
  q1_verdict: Verdict;
  q1_verdict_he: string;
  q1_verdict_emoji: string;
  q1_accuracy: string;
  q1_structure: string;
  q1_terminology: string;
  q1_logic: string;
  q1_alignment: string;
  q1_hint_text: string;
  q1_explanation: string;
  q2_id: number;
  q2_text: string;
  q2_transcript: string;
  q2_score: number;
  q2_verdict: Verdict;
  q2_verdict_he: string;
  q2_verdict_emoji: string;
  q2_accuracy: string;
  q2_structure: string;
  q2_terminology: string;
  q2_logic: string;
  q2_alignment: string;
  q2_hint_text: string;
  q2_explanation: string;
  q3_id: number;
  q3_text: string;
  q3_transcript: string;
  q3_score: number;
  q3_verdict: Verdict;
  q3_verdict_he: string;
  q3_verdict_emoji: string;
  q3_accuracy: string;
  q3_structure: string;
  q3_terminology: string;
  q3_logic: string;
  q3_alignment: string;
  q3_hint_text: string;
  q3_explanation: string;
  total_correct: number;
  total_score_0_100: number;
}

export interface StudentEmailVars {
  first_name: string;
  date_hebrew: string;
  time: string;
}
