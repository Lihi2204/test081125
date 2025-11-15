import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Verdict, ScoringResult } from '../../types';

interface SessionDetail {
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

export default function AdminSessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [editedScores, setEditedScores] = useState<{ [key: string]: { score: number; verdict: Verdict } }>({});

  useEffect(() => {
    fetchSessionDetail();
  }, [id]);

  const fetchSessionDetail = async () => {
    try {
      const response = await fetch(`/api/admin/session/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch session');
      }

      const data = await response.json();
      setSession(data);
      setNotes(data.notes || '');

      // Initialize edited scores
      const scores: { [key: string]: { score: number; verdict: Verdict } } = {};
      data.questions.forEach((q: SessionDetail['questions'][0], idx: number) => {
        scores[`q${idx + 1}`] = { score: q.score, verdict: q.verdict };
      });
      setEditedScores(scores);
    } catch (err) {
      console.error('Failed to fetch session:', err);
      // Mock data for demo
      const mockSession: SessionDetail = {
        session_id: id || 'demo',
        student: {
          first_name: 'דנה',
          last_name: 'כהן',
          id_last4: '1234',
          email: 'dana@student.ono.ac.il',
        },
        started_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
        duration_minutes: 8.5,
        video_link: 'https://drive.google.com/file/d/demo/view',
        questions: [
          {
            id: 101,
            text: 'מהו Machine Learning ומה ההבדל בינו לבין Deep Learning?',
            transcript: 'אממ Machine Learning זה כאילו שהמחשב לומד דברים בעצמו מתוך דאטה, בלי שמתכנתים אותו ספציפית. ו-Deep Learning זה סוג של Machine Learning שמשתמש ברשתות נוירונים עמוקות...',
            hint_used: false,
            score: 85,
            verdict: 'correct',
            json: {
              accuracy: 0.88,
              structure: 0.82,
              terminology: 0.87,
              logic: 0.85,
              alignment: 0.90,
              per_question_score_0_100: 85,
              verdict: 'correct',
              short_explanation_he: 'הסטודנטית הבינה את המושגים והציגה הסבר ברור ומדויק',
            },
          },
          {
            id: 105,
            text: 'מהן הדרישות האתיות העיקריות בפיתוח מערכות AI?',
            transcript: 'אז הדרישות האתיות... אה... צריך שהמערכת תהיה שקופה, שנבין למה היא מחליטה מה שהיא מחליטה. גם צריך הוגנות, שלא תהיה הטיה...',
            hint_used: true,
            score: 62,
            verdict: 'partial',
            json: {
              accuracy: 0.65,
              structure: 0.58,
              terminology: 0.60,
              logic: 0.70,
              alignment: 0.55,
              per_question_score_0_100: 62,
              verdict: 'partial',
              short_explanation_he: 'התשובה חלקית - הסטודנטית הזכירה שקיפות והוגנות אך לא פירטה דרישות נוספות כמו פרטיות ואחריותיות',
            },
          },
          {
            id: 108,
            text: 'הסבר את מושג ה-Bias במערכות AI ותן דוגמה מהעולם העסקי',
            transcript: 'Bias זה הטיה במערכת AI. דוגמה מהעולם העסקי זה כמו מערכת גיוס שלמדה מעובדים קודמים ואז היא מפלה...',
            hint_used: false,
            score: 78,
            verdict: 'correct',
            json: {
              accuracy: 0.80,
              structure: 0.75,
              terminology: 0.82,
              logic: 0.78,
              alignment: 0.75,
              per_question_score_0_100: 78,
              verdict: 'correct',
              short_explanation_he: 'הסבר טוב עם דוגמה רלוונטית מגיוס עובדים',
            },
          },
        ],
        totals: {
          correct: 2,
          score_0_100: 75,
        },
        finalized: false,
        notes: '',
      };
      setSession(mockSession);
      setNotes(mockSession.notes);

      const scores: { [key: string]: { score: number; verdict: Verdict } } = {};
      mockSession.questions.forEach((q, idx) => {
        scores[`q${idx + 1}`] = { score: q.score, verdict: q.verdict };
      });
      setEditedScores(scores);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData: Record<string, unknown> = { notes };
      Object.entries(editedScores).forEach(([key, value]) => {
        updateData[`${key}_score`] = value.score;
        updateData[`${key}_verdict`] = value.verdict;
      });

      await fetch(`/api/admin/session/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify(updateData),
      });

      alert('השינויים נשמרו בהצלחה');
    } catch (err) {
      console.error('Failed to save:', err);
      alert('שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!confirm('האם אתה בטוח שברצונך לאשר את הציון? לא ניתן יהיה לשנות לאחר מכן.')) {
      return;
    }

    setSaving(true);
    try {
      await fetch(`/api/admin/session/${id}/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({ reviewer: 'Lihi Ard' }),
      });

      alert('הציון אושר בהצלחה');
      navigate('/admin/dashboard');
    } catch (err) {
      console.error('Failed to finalize:', err);
      alert('שגיאה באישור הציון');
    } finally {
      setSaving(false);
    }
  };

  const getVerdictEmoji = (verdict: Verdict) => {
    switch (verdict) {
      case 'correct':
        return '✅';
      case 'partial':
        return '⚠️';
      case 'wrong':
        return '❌';
    }
  };

  const getVerdictHe = (verdict: Verdict) => {
    switch (verdict) {
      case 'correct':
        return 'נכון';
      case 'partial':
        return 'חלקי';
      case 'wrong':
        return 'שגוי';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-600">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">לא נמצא מבחן</p>
          <Link to="/admin/dashboard" className="text-primary hover:underline">
            חזרה לדשבורד
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <Link to="/admin/dashboard" className="text-sm text-primary hover:underline mb-2 block">
                ← חזרה לדשבורד
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                פרטי מבחן - {session.student.first_name} {session.student.last_name}
              </h1>
            </div>
            {session.finalized && (
              <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
                ✓ אושר סופית
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Student Info */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">פרטי סטודנט</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">שם</p>
              <p className="font-medium">{session.student.first_name} {session.student.last_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ת.ז</p>
              <p className="font-medium">****{session.student.id_last4}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">תאריך</p>
              <p className="font-medium">{new Date(session.started_at).toLocaleDateString('he-IL')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">משך מבחן</p>
              <p className="font-medium">{session.duration_minutes.toFixed(1)} דקות</p>
            </div>
          </div>
        </div>

        {/* Video Player */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">🎥 הקלטת המבחן</h2>
          <a
            href={session.video_link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-block"
          >
            צפייה בהקלטה ב-Google Drive
          </a>
        </div>

        {/* Questions */}
        {session.questions.map((question, idx) => (
          <div key={question.id} className="card mb-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold">
                שאלה {idx + 1} (מזהה: {question.id})
              </h2>
              <span className={`text-lg ${
                editedScores[`q${idx + 1}`]?.verdict === 'correct'
                  ? 'verdict-correct'
                  : editedScores[`q${idx + 1}`]?.verdict === 'partial'
                  ? 'verdict-partial'
                  : 'verdict-wrong'
              }`}>
                {getVerdictEmoji(editedScores[`q${idx + 1}`]?.verdict || question.verdict)}{' '}
                {getVerdictHe(editedScores[`q${idx + 1}`]?.verdict || question.verdict)}
              </span>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="font-medium">השאלה:</p>
              <p>{question.text}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="font-medium mb-2">תמלול תשובת הסטודנט:</p>
              <p className="text-gray-700 whitespace-pre-wrap">{question.transcript}</p>
            </div>

            {question.hint_used && (
              <div className="bg-yellow-50 border-r-4 border-warning p-3 mb-4">
                <p className="text-sm text-yellow-800">⚠️ הסטודנט השתמש ברמז בשאלה זו</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Auto Scoring Details */}
              <div>
                <h3 className="font-medium mb-2">ציון אוטומטי:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>דיוק:</span>
                    <span>{(question.json.accuracy * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>מבנה:</span>
                    <span>{(question.json.structure * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>מינוח:</span>
                    <span>{(question.json.terminology * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>לוגיקה:</span>
                    <span>{(question.json.logic * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>התאמה:</span>
                    <span>{(question.json.alignment * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-gray-100 rounded">
                  <p className="text-sm font-medium">הסבר:</p>
                  <p className="text-sm">{question.json.short_explanation_he}</p>
                </div>
              </div>

              {/* Manual Edit */}
              <div>
                <h3 className="font-medium mb-2">עריכה ידנית:</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-1">ציון (0-100):</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editedScores[`q${idx + 1}`]?.score || question.score}
                      onChange={(e) => setEditedScores({
                        ...editedScores,
                        [`q${idx + 1}`]: {
                          ...editedScores[`q${idx + 1}`],
                          score: parseInt(e.target.value) || 0,
                        },
                      })}
                      disabled={session.finalized}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">הערכה:</label>
                    <select
                      value={editedScores[`q${idx + 1}`]?.verdict || question.verdict}
                      onChange={(e) => setEditedScores({
                        ...editedScores,
                        [`q${idx + 1}`]: {
                          ...editedScores[`q${idx + 1}`],
                          verdict: e.target.value as Verdict,
                        },
                      })}
                      disabled={session.finalized}
                      className="form-input"
                    >
                      <option value="correct">נכון</option>
                      <option value="partial">חלקי</option>
                      <option value="wrong">שגוי</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Totals */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">סיכום</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500">שאלות נכונות</p>
              <p className="text-3xl font-bold">
                {Object.values(editedScores).filter(s => s.verdict === 'correct').length}/3
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ציון כולל</p>
              <p className="text-3xl font-bold">
                {Math.round(
                  Object.values(editedScores).reduce((acc, s) => acc + s.score, 0) / 3
                )}/100
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">הערות</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={session.finalized}
            placeholder="הוסף הערות..."
            className="form-input h-32 resize-none"
          />
        </div>

        {/* Actions */}
        {!session.finalized && (
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? 'שומר...' : 'שמור שינויים'}
            </button>
            <button
              onClick={handleFinalize}
              disabled={saving}
              className="btn-secondary"
            >
              אשר ונעל ציון
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
