import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/examStore';

export default function BufferScreen() {
  const navigate = useNavigate();
  const [timeRemaining, setTimeRemaining] = useState(180); // 3 minutes buffer
  const [canStart, setCanStart] = useState(false);
  const [loading, setLoading] = useState(false);

  const { student, consent, precheckPassed, token, setQuestions, setSessionId, setStatus } = useExamStore();

  useEffect(() => {
    if (!student || !consent || !precheckPassed) {
      navigate('/exam');
      return;
    }

    // Start countdown timer
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleStartExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Allow immediate start after 30 seconds
    const canStartTimer = setTimeout(() => {
      setCanStart(true);
    }, 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(canStartTimer);
    };
  }, [student, consent, precheckPassed, navigate]);

  const handleStartExam = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // Create session
      const createResponse = await fetch('/api/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          consent: true,
          precheck_passed: true,
        }),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create session');
      }

      const sessionData = await createResponse.json();
      setSessionId(sessionData.session_id);
      setQuestions(sessionData.questions);

      // Start session
      const startResponse = await fetch('/api/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionData.session_id }),
      });

      if (!startResponse.ok) {
        throw new Error('Failed to start session');
      }

      setStatus('in_progress');
      navigate('/exam/start');
    } catch (error) {
      console.error('Failed to start exam:', error);
      alert('שגיאה בהתחלת המבחן. נא לרענן ולנסות שוב.');
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!student) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <div className="text-6xl mb-6">⏰</div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            חדר המתנה לפני המבחן
          </h1>

          <p className="text-gray-600 mb-8">
            יש לך {formatTime(timeRemaining)} להכנה אחרונה לפני תחילת המבחן.
            <br />
            המבחן יתחיל אוטומטית בסוף הספירה לאחור.
          </p>

          <div className="text-7xl font-mono font-bold text-primary mb-8">
            {formatTime(timeRemaining)}
          </div>

          <div className="bg-blue-50 rounded-lg p-6 mb-8 text-right">
            <h2 className="font-semibold text-lg mb-4">תזכורת לפני המבחן:</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>✓ המבחן כולל 3 שאלות</li>
              <li>✓ לכל שאלה יש 90 שניות לתשובה</li>
              <li>✓ ניתן לבקש רמז פעם אחת לכל שאלה (יפחית מהציון)</li>
              <li>✓ המצלמה והמיקרופון מקליטים</li>
              <li>✓ ענה/י בקול ברור</li>
              <li>✓ אין צורך לכתוב - רק לדבר</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border-r-4 border-warning p-4 mb-8">
            <p className="font-semibold text-warning">
              ⚠️ חשוב: לאחר תחילת המבחן לא ניתן לעצור או לחזור אחורה!
            </p>
          </div>

          <button
            onClick={handleStartExam}
            disabled={!canStart || loading}
            className="btn-secondary text-lg px-10 py-4"
          >
            {loading ? 'מתחיל...' : canStart ? 'אני מוכן/ה, התחל מבחן' : 'המתן...'}
          </button>

          {!canStart && (
            <p className="mt-4 text-sm text-gray-500">
              ניתן להתחיל באופן ידני בעוד {Math.max(0, 30 - (180 - timeRemaining))} שניות
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
