import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Student, SessionStatus } from '../types';

interface ExamStore {
  // Auth State
  token: string | null;
  student: Student | null;

  // Session State
  sessionId: string | null;
  questions: Array<{ id: number; text: string }>;
  currentQuestionIndex: number;
  status: SessionStatus;

  // Pre-exam State
  consent: boolean;
  precheckPassed: boolean;

  // Recording State
  chunks: Map<number, Blob>;
  hintUsed: Map<number, boolean>;
  isRecording: boolean;
  timeRemaining: number;

  // UI State
  error: string | null;
  loading: boolean;

  // Actions
  setToken: (token: string) => void;
  setStudent: (student: Student) => void;
  setSessionId: (sessionId: string) => void;
  setQuestions: (questions: Array<{ id: number; text: string }>) => void;
  setCurrentQuestionIndex: (index: number) => void;
  setStatus: (status: SessionStatus) => void;
  setConsent: (consent: boolean) => void;
  setPrecheckPassed: (passed: boolean) => void;
  addChunk: (questionId: number, blob: Blob) => void;
  setHintUsed: (questionId: number, used: boolean) => void;
  setIsRecording: (recording: boolean) => void;
  setTimeRemaining: (time: number) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  nextQuestion: () => void;
  reset: () => void;
}

const initialState = {
  token: null,
  student: null,
  sessionId: null,
  questions: [],
  currentQuestionIndex: 0,
  status: 'not_started' as SessionStatus,
  consent: false,
  precheckPassed: false,
  chunks: new Map<number, Blob>(),
  hintUsed: new Map<number, boolean>(),
  isRecording: false,
  timeRemaining: 90,
  error: null,
  loading: false,
};

export const useExamStore = create<ExamStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setToken: (token) => set({ token }),
      setStudent: (student) => set({ student }),
      setSessionId: (sessionId) => set({ sessionId }),
      setQuestions: (questions) => set({ questions }),
      setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),
      setStatus: (status) => set({ status }),
      setConsent: (consent) => set({ consent }),
      setPrecheckPassed: (passed) => set({ precheckPassed: passed }),

      addChunk: (questionId, blob) => {
        const chunks = new Map(get().chunks);
        chunks.set(questionId, blob);
        set({ chunks });
      },

      setHintUsed: (questionId, used) => {
        const hintUsed = new Map(get().hintUsed);
        hintUsed.set(questionId, used);
        set({ hintUsed });
      },

      setIsRecording: (recording) => set({ isRecording: recording }),
      setTimeRemaining: (time) => set({ timeRemaining: time }),
      setError: (error) => set({ error }),
      setLoading: (loading) => set({ loading }),

      nextQuestion: () => {
        const { currentQuestionIndex, questions } = get();
        if (currentQuestionIndex < questions.length - 1) {
          set({
            currentQuestionIndex: currentQuestionIndex + 1,
            timeRemaining: 90,
            isRecording: false
          });
        } else {
          set({ status: 'uploading' });
        }
      },

      reset: () => set(initialState),
    }),
    {
      name: 'exam-session',
      // Only persist essential session data, not blobs
      partialize: (state) => ({
        token: state.token,
        sessionId: state.sessionId,
        currentQuestionIndex: state.currentQuestionIndex,
        status: state.status,
        consent: state.consent,
        precheckPassed: state.precheckPassed,
        // Convert Map to array for serialization
        hintUsed: Array.from(state.hintUsed.entries()),
      }),
      // Restore Maps from serialized arrays
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (Array.isArray(state.hintUsed)) {
            state.hintUsed = new Map(state.hintUsed as [number, boolean][]);
          }
          if (!state.chunks) {
            state.chunks = new Map();
          }
        }
      },
    }
  )
);

// Admin store for instructor dashboard
interface AdminStore {
  isAuthenticated: boolean;
  userEmail: string | null;
  sessions: Array<{
    session_id: string;
    student_name: string;
    id_last4: string;
    date: string;
    total_score?: number;
    status: SessionStatus;
    finalized: boolean;
  }>;
  currentSession: string | null;

  setAuthenticated: (authenticated: boolean) => void;
  setUserEmail: (email: string | null) => void;
  setSessions: (sessions: AdminStore['sessions']) => void;
  setCurrentSession: (sessionId: string | null) => void;
  logout: () => void;
}

export const useAdminStore = create<AdminStore>((set) => ({
  isAuthenticated: false,
  userEmail: null,
  sessions: [],
  currentSession: null,

  setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
  setUserEmail: (email) => set({ userEmail: email }),
  setSessions: (sessions) => set({ sessions }),
  setCurrentSession: (sessionId) => set({ currentSession: sessionId }),
  logout: () => set({
    isAuthenticated: false,
    userEmail: null,
    sessions: [],
    currentSession: null,
  }),
}));
