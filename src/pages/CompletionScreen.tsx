import { useEffect } from 'react';
import { useExamStore } from '../store/examStore';

export default function CompletionScreen() {
  const { student, reset } = useExamStore();

  useEffect(() => {
    // Clear local storage after showing completion
    const timer = setTimeout(() => {
      localStorage.removeItem('exam-session');
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="card max-w-lg w-full text-center">
        <div className="text-8xl mb-6">✅</div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          תודה רבה!
        </h1>

        <div className="bg-green-50 border-r-4 border-secondary p-6 mb-6 text-right">
          <p className="text-lg text-green-800 mb-2">
            {student ? `${student.first_name}, ` : ''}המבחן שלך התקבל בהצלחה!
          </p>
          <p className="text-green-700">
            ההקלטה הועלתה ונשמרה במערכת.
          </p>
        </div>

        <div className="space-y-4 text-gray-600 mb-8">
          <p>
            📧 התוצאות יעובדו ויישלחו אליך במייל תוך 48 שעות.
          </p>
          <p>
            📝 המרצה תבדוק את התשובות ותאשר את הציון הסופי.
          </p>
          <p>
            🔒 ההקלטה תישמר באופן מאובטח ותימחק אוטומטית תוך 14 יום.
          </p>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 mb-8">
          <h3 className="font-semibold text-blue-900 mb-2">מה הלאה?</h3>
          <p className="text-blue-800 text-sm">
            ניתן לסגור את הדף. אין צורך לעשות דבר נוסף.
            <br />
            במידה ולא קיבלת אישור במייל תוך שעה, פנה/י למרצה.
          </p>
        </div>

        <div className="pt-6 border-t">
          <p className="text-sm text-gray-500">
            לשאלות ובירורים:
            <br />
            <a href="mailto:lihi.cyn@gmail.com" className="text-primary hover:underline">
              lihi.cyn@gmail.com
            </a>
          </p>
        </div>

        <div className="mt-8">
          <p className="text-xs text-gray-400">
            מערכת מבחנים בעל-פה | אונו אקדמית
          </p>
        </div>
      </div>
    </div>
  );
}
