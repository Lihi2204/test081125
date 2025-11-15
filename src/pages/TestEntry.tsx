import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/examStore';

// Test mode entry - bypasses authentication for local testing
export default function TestEntry() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const {
    setToken,
    setStudent,
    setSessionId,
    setQuestions,
    setStatus,
    reset,
  } = useExamStore();

  const startTestSession = () => {
    setLoading(true);

    // Reset any previous session
    reset();

    // Set mock token
    setToken('test-token-for-local-development');

    // Set mock student data
    setStudent({
      first_name: 'סטודנט',
      last_name: 'לבדיקה',
      email: 'test@student.ono.ac.il',
      id_last4: '1234',
      student_id_hash: 'test-hash-123',
    });

    // Set mock session ID
    setSessionId(`test-session-${Date.now()}`);

    // Set mock questions (Hebrew questions for oral exam)
    setQuestions([
      {
        id: 1,
        text: 'הסבר/י מהו תכנות מונחה עצמים (OOP) ומהם העקרונות המרכזיים שלו.',
      },
      {
        id: 2,
        text: 'מהו ההבדל בין מחסנית (Stack) לבין תור (Queue)? תן/י דוגמה לשימוש בכל אחד מהם.',
      },
      {
        id: 3,
        text: 'הסבר/י מהו אלגוריתם רקורסיבי ומתי כדאי להשתמש בו.',
      },
    ]);

    // Set initial status
    setStatus('not_started');

    // Navigate to consent screen after a short delay
    setTimeout(() => {
      navigate('/exam/consent');
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 text-center">
        <div className="text-6xl mb-6">🧪</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">מצב בדיקה</h1>
        <p className="text-gray-600 mb-6" dir="rtl">
          זהו מצב בדיקה למערכת הבחינה. לחיצה על הכפתור תתחיל סשן בדיקה עם נתונים
          מדומים, ללא צורך באימות או חיבור לשרת.
        </p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800" dir="rtl">
            <strong>שימו לב:</strong> במצב בדיקה, הקלטות וידאו לא יישמרו לשרת.
            מצב זה מיועד לבדיקת חוויית המשתמש בלבד.
          </p>
        </div>

        <button
          onClick={startTestSession}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors text-lg"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              מתחיל סשן בדיקה...
            </span>
          ) : (
            'התחל סשן בדיקה'
          )}
        </button>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-3">נתוני הבדיקה:</h3>
          <div className="text-sm text-gray-600 space-y-1" dir="rtl">
            <p>
              <strong>שם:</strong> סטודנט לבדיקה
            </p>
            <p>
              <strong>מספר שאלות:</strong> 3
            </p>
            <p>
              <strong>זמן לשאלה:</strong> 90 שניות
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
