import type { ExamResults } from './VoiceExam';

interface Props {
  results: ExamResults | null;
}

export default function ResultScreen({ results }: Props) {
  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg text-center">
          <h2 className="text-2xl font-bold text-gray-800">טוען תוצאות...</h2>
        </div>
      </div>
    );
  }

  if (!results.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg text-center">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-red-800 mb-4">שגיאה בעיבוד המבחן</h2>
          <p className="text-gray-600 mb-6">{results.error || 'אירעה שגיאה לא צפויה'}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            תודה! המבחן שלך התקבל
          </h2>
          <p className="text-gray-600">
            התוצאות יישלחו למרצה לבדיקה
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">סיכום:</h3>

          <div className="space-y-4">
            {results.results.map((result, index) => (
              <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-700">שאלה {index + 1}</h4>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                    {result.score}/100
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{result.question}</p>
                <div className="bg-gray-50 rounded p-2 mb-2">
                  <p className="text-xs text-gray-500 mb-1">התשובה שלך:</p>
                  <p className="text-sm text-gray-700">{result.transcript}</p>
                </div>
                <p className="text-sm text-green-700 italic">{result.feedback}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <div className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl px-8 py-4">
            <p className="text-sm opacity-90 mb-1">ציון סופי</p>
            <p className="text-4xl font-bold">{results.totalScore}</p>
            <p className="text-sm opacity-90">מתוך 100</p>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>המבחן הועבר לבדיקה אצל המרצה.</p>
          <p>אם יש לך שאלות, פנה למרצה ישירות.</p>
        </div>
      </div>
    </div>
  );
}
