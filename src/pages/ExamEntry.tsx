import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/examStore';

export default function ExamEntry() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { setToken, setStudent, setSessionId, setStatus, reset } = useExamStore();

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setError('קישור לא תקין. נא לבדוק את הקישור שקיבלת במייל.');
      setLoading(false);
      return;
    }

    // Reset store before new session
    reset();

    // Verify token with backend
    const verifyToken = async () => {
      try {
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!data.valid) {
          switch (data.error) {
            case 'TOKEN_EXPIRED':
              setError('הקישור פג תוקף. נא לפנות למרצה לקבלת קישור חדש.');
              break;
            case 'TOKEN_INVALID':
              setError('קישור לא תקין. נא לבדוק את הקישור שקיבלת במייל.');
              break;
            case 'ALREADY_COMPLETED':
              setError('כבר ביצעת את המבחן. לא ניתן לבצע שוב.');
              break;
            case 'NOT_IN_ROSTER':
              setError('לא נמצאת ברשימת הסטודנטים. נא לפנות למרצה.');
              break;
            default:
              setError('שגיאה לא צפויה. נא לפנות למרצה.');
          }
          setLoading(false);
          return;
        }

        // Valid token - store data and proceed
        setToken(token);
        setStudent(data.student);
        setSessionId(data.session_id);
        setStatus(data.status);

        // Navigate to consent screen
        navigate('/exam/consent');
      } catch (err) {
        console.error('Token verification error:', err);
        setError('שגיאת תקשורת. נא לנסות שוב מאוחר יותר.');
        setLoading(false);
      }
    };

    verifyToken();
  }, [searchParams, navigate, setToken, setStudent, setSessionId, setStatus, reset]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-600">מאמת קישור...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="card max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">שגיאה בכניסה למבחן</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="bg-gray-100 rounded-lg p-4">
            <p className="text-sm text-gray-500">
              לתמיכה: <a href="mailto:lihi.cyn@gmail.com" className="text-primary hover:underline">lihi.cyn@gmail.com</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
