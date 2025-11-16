import { useState } from 'react';

interface StudentInfo {
  firstName: string;
  lastName: string;
  idNumber: string;
}

interface Props {
  onStart: (info: StudentInfo) => void;
}

export default function WelcomeScreen({ onStart }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'נא להזין שם פרטי';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'נא להזין שם משפחה';
    }

    if (!idNumber.trim()) {
      newErrors.idNumber = 'נא להזין מספר תעודת זהות';
    } else if (!/^\d{9}$/.test(idNumber.trim())) {
      newErrors.idNumber = 'מספר תעודת זהות חייב להכיל 9 ספרות';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onStart({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        idNumber: idNumber.trim()
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            מבחן בעל פה
          </h1>
          <p className="text-gray-600">
            מערכת בחינה קולית אוטומטית
          </p>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
          <h3 className="font-semibold text-blue-800 mb-2">הוראות:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• המערכת תשאל אותך 3 שאלות בעברית</li>
            <li>• ענה בקול רם וברור</li>
            <li>• ודא שהמיקרופון שלך פעיל</li>
            <li>• המבחן יימשך כ-5-10 דקות</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              שם פרטי
            </label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.firstName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="הזן את שמך הפרטי"
            />
            {errors.firstName && (
              <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              שם משפחה
            </label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.lastName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="הזן את שם משפחתך"
            />
            {errors.lastName && (
              <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
            )}
          </div>

          <div>
            <label htmlFor="idNumber" className="block text-sm font-medium text-gray-700 mb-1">
              מספר תעודת זהות
            </label>
            <input
              type="text"
              id="idNumber"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, '').slice(0, 9))}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.idNumber ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="123456789"
              maxLength={9}
            />
            {errors.idNumber && (
              <p className="text-red-500 text-xs mt-1">{errors.idNumber}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 mt-6"
          >
            התחל מבחן
          </button>
        </form>
      </div>
    </div>
  );
}
