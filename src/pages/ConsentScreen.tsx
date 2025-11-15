import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/examStore';

export default function ConsentScreen() {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const { student, setConsent } = useExamStore();

  const handleContinue = () => {
    if (agreed) {
      setConsent(true);
      navigate('/exam/precheck');
    }
  };

  if (!student) {
    navigate('/exam');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="card">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            הסכמה להשתתפות במבחן בעל-פה
          </h1>

          <div className="bg-blue-50 border-r-4 border-primary p-4 mb-6">
            <p className="font-semibold">שלום {student.first_name} {student.last_name},</p>
            <p className="mt-2">
              אתה/את עומד/ת לבצע מבחן בעל-פה בקורס "יישומי בינה מלאכותית בעולם העסקי".
            </p>
          </div>

          <div className="space-y-4 text-gray-700 mb-6">
            <h2 className="font-semibold text-lg">תנאי המבחן:</h2>

            <div className="pr-4 space-y-3">
              <p>
                <strong>1. הקלטה:</strong> במהלך המבחן תתבצע הקלטת וידאו ואודיו של התשובות שלך.
                ההקלטה תשמש לצורך תמלול, ציון אוטומטי, ובדיקה ידנית על ידי המרצה.
              </p>

              <p>
                <strong>2. שמירת מידע:</strong> ההקלטות יישמרו באופן מאובטח ב-Google Drive
                וימחקו באופן אוטומטי תוך 14 יום ממועד המבחן.
              </p>

              <p>
                <strong>3. עיבוד אוטומטי:</strong> התשובות שלך יעובדו על ידי מערכת AI (Whisper לתמלול,
                Claude לציון). הציון הסופי ייקבע על ידי המרצה לאחר בדיקה.
              </p>

              <p>
                <strong>4. פרטיות:</strong> המידע שלך מוגן ומאובטח. מספר הזהות שלך מוצפן ורק 4 הספרות
                האחרונות נשמרות לצורך זיהוי.
              </p>

              <p>
                <strong>5. משך המבחן:</strong> המבחן כולל 3 שאלות, כ-5-10 דקות סה"כ.
                לכל שאלה יש מגבלת זמן של 90 שניות.
              </p>

              <p>
                <strong>6. רמזים:</strong> ניתן לבקש רמז פעם אחת לכל שאלה, אך זה יפחית מהציון.
              </p>
            </div>

            <h2 className="font-semibold text-lg mt-6">הנחיות חשובות:</h2>

            <div className="pr-4 space-y-2">
              <p>• וודא/י שאתה/את במקום שקט עם חיבור אינטרנט יציב</p>
              <p>• השתמש/י במחשב נייח או נייד (לא טלפון נייד)</p>
              <p>• המצלמה והמיקרופון חייבים לעבוד כראוי</p>
              <p>• אין להשתמש בחומר עזר או להיעזר באחרים</p>
            </div>
          </div>

          <div className="border-t pt-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="form-checkbox mt-1"
              />
              <span className="text-gray-700">
                קראתי והבנתי את תנאי המבחן. אני מסכים/ה להקלטה ולעיבוד התשובות שלי כמתואר לעיל.
              </span>
            </label>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={handleContinue}
              disabled={!agreed}
              className="btn-primary"
            >
              המשך לבדיקת מצלמה ומיקרופון
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            לשאלות: <a href="mailto:lihi.cyn@gmail.com" className="text-primary hover:underline">lihi.cyn@gmail.com</a>
          </div>
        </div>
      </div>
    </div>
  );
}
