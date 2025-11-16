import { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceService } from '../../services/voiceService';
import useVoiceRecording from '../../hooks/useVoiceRecording';

interface StudentInfo {
  firstName: string;
  lastName: string;
  idNumber: string;
}

interface Props {
  studentInfo: StudentInfo;
  onComplete: (results: ExamResults) => void;
}

interface QuestionResult {
  question: string;
  transcript: string;
  score: number;
  feedback: string;
}

export interface ExamResults {
  success: boolean;
  results: QuestionResult[];
  totalScore: number;
  error?: string;
}

const QUESTIONS = [
  "מהו Machine Learning ואיך משתמשים בו בעולם העסקי?",
  "מהם האתגרים האתיים בשימוש בבינה מלאכותית?",
  "תן דוגמה לשימוש ב-AI לשיפור שירות לקוחות"
];

const MAX_ANSWER_TIME = 60000; // 60 seconds per answer

export default function VoiceExam({ studentInfo, onComplete }: Props) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(MAX_ANSWER_TIME / 1000);
  const [answers, setAnswers] = useState<Blob[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [examStarted, setExamStarted] = useState(false);

  const voiceServiceRef = useRef(new VoiceService());
  const { startRecording, stopRecording, isRecording, error: recordingError } = useVoiceRecording();
  const timerRef = useRef<number | null>(null);
  const recordingTimeoutRef = useRef<number | null>(null);

  const askQuestion = useCallback(async (index: number) => {
    if (index >= QUESTIONS.length) {
      await submitExam();
      return;
    }

    setCurrentQuestion(index);
    setIsSpeaking(true);
    setStatusMessage(`שאלה ${index + 1} מתוך ${QUESTIONS.length}`);

    try {
      // Announce question number
      await voiceServiceRef.current.speak(`שאלה מספר ${index + 1}`);
      // Small pause
      await new Promise(resolve => setTimeout(resolve, 500));
      // Ask the question
      await voiceServiceRef.current.speak(QUESTIONS[index]);
      // Notify student to answer
      await new Promise(resolve => setTimeout(resolve, 500));
      await voiceServiceRef.current.speak('אנא ענה עכשיו');
    } catch (err) {
      console.error('Speech error:', err);
    }

    setIsSpeaking(false);

    // Start listening for answer
    setIsListening(true);
    setTimeLeft(MAX_ANSWER_TIME / 1000);
    setStatusMessage('מקשיב לתשובתך...');

    try {
      await startRecording();

      // Start countdown timer
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Auto-stop after max time
      recordingTimeoutRef.current = window.setTimeout(async () => {
        await finishRecording(index);
      }, MAX_ANSWER_TIME);
    } catch (err) {
      console.error('Recording error:', err);
      setStatusMessage('שגיאה בהקלטה. אנא נסה שוב.');
    }
  }, [startRecording]);

  const finishRecording = async (questionIndex: number) => {
    if (!isRecording) return;

    // Clear timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }

    setIsListening(false);
    setStatusMessage('מעבד תשובה...');

    const blob = await stopRecording();
    const newAnswers = [...answers, blob];
    setAnswers(newAnswers);

    // Move to next question
    await new Promise(resolve => setTimeout(resolve, 1000));
    await askQuestion(questionIndex + 1);
  };

  const submitExam = async () => {
    setIsProcessing(true);
    setStatusMessage('מעבד את המבחן... אנא המתן');

    try {
      const formData = new FormData();
      formData.append('studentInfo', JSON.stringify(studentInfo));
      formData.append('questions', JSON.stringify(QUESTIONS));

      answers.forEach((blob, i) => {
        formData.append(`audio_${i}`, blob, `answer_${i}.webm`);
      });

      const response = await fetch('/api/voice-exam/process', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const results = await response.json();
      onComplete(results);
    } catch (err) {
      console.error('Submit error:', err);
      onComplete({
        success: false,
        results: [],
        totalScore: 0,
        error: err instanceof Error ? err.message : 'שגיאה בשליחת המבחן'
      });
    }
  };

  const startExam = async () => {
    setExamStarted(true);
    setIsSpeaking(true);
    setStatusMessage('מתחיל את המבחן...');

    try {
      await voiceServiceRef.current.speak(
        `שלום ${studentInfo.firstName}, ברוך הבא לבחינה בעל פה. אשאל אותך 3 שאלות. ענה בקול רם וברור. בואו נתחיל.`
      );
    } catch (err) {
      console.error('Speech error:', err);
    }

    setIsSpeaking(false);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await askQuestion(0);
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
      voiceServiceRef.current.stopSpeaking();
    };
  }, []);

  const handleStopRecording = () => {
    if (isListening) {
      finishRecording(currentQuestion);
    }
  };

  const handleRepeatQuestion = async () => {
    if (!isSpeaking && !isListening) {
      setIsSpeaking(true);
      await voiceServiceRef.current.speak(QUESTIONS[currentQuestion]);
      setIsSpeaking(false);
    }
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg text-center">
          <div className="mb-6">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">מעבד את המבחן</h2>
          <p className="text-gray-600">{statusMessage}</p>
          <div className="mt-4 text-sm text-gray-500">
            זה עשוי לקחת דקה או שתיים...
          </div>
        </div>
      </div>
    );
  }

  if (!examStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            שלום {studentInfo.firstName}!
          </h2>
          <p className="text-gray-600 mb-6">
            המבחן מוכן להתחיל. ודא שהמיקרופון שלך פעיל והרמקולים דלוקים.
          </p>
          <button
            onClick={startExam}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 text-lg"
          >
            התחל מבחן
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            שאלה {currentQuestion + 1} מתוך {QUESTIONS.length}
          </h2>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / QUESTIONS.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <p className="text-lg font-medium text-gray-800 leading-relaxed">
            {QUESTIONS[currentQuestion]}
          </p>
        </div>

        <div className="text-center mb-6">
          {isSpeaking && (
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="text-4xl mb-3">🔊</div>
              <p className="text-blue-800 font-medium">הבוט מדבר...</p>
              <div className="flex justify-center gap-1 mt-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 bg-blue-500 rounded-full animate-pulse"
                    style={{
                      height: `${20 + Math.random() * 20}px`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  ></div>
                ))}
              </div>
            </div>
          )}

          {isListening && (
            <div className="bg-red-50 rounded-lg p-6">
              <div className="text-4xl mb-3">🎤</div>
              <p className="text-red-800 font-medium">מקשיב לתשובתך...</p>
              <div className="text-2xl font-mono mt-2">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
              <div className="flex justify-center gap-1 mt-3">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 bg-red-500 rounded-full animate-bounce"
                    style={{
                      height: `${15 + Math.random() * 25}px`,
                      animationDelay: `${i * 0.15}s`
                    }}
                  ></div>
                ))}
              </div>
            </div>
          )}

          {!isSpeaking && !isListening && (
            <div className="text-gray-600">
              <p>{statusMessage}</p>
            </div>
          )}
        </div>

        {recordingError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{recordingError}</p>
          </div>
        )}

        <div className="flex gap-4 justify-center">
          {isListening && (
            <button
              onClick={handleStopRecording}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
            >
              סיימתי לענות
            </button>
          )}

          {!isSpeaking && !isListening && !isProcessing && (
            <button
              onClick={handleRepeatQuestion}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
            >
              חזור על השאלה
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
