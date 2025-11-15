import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/examStore';
import { v4 as uuidv4 } from 'uuid';

export default function TestLogin() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { setToken, setStudent, setSessionId, setStatus, reset } = useExamStore();

  // Simple test password - change this for production!
  const TEST_PASSWORD = 'test123';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate inputs
    if (!firstName.trim() || !lastName.trim()) {
      setError('נא למלא שם פרטי ושם משפחה');
      setLoading(false);
      return;
    }

    if (password !== TEST_PASSWORD) {
      setError('סיסמה שגויה');
      setLoading(false);
      return;
    }

    // Reset store
    reset();

    // Create mock student data for testing
    const now = new Date();
    const mockStudent = {
      student_id_hash: `test_${Date.now()}`,
      id_last4: '0000',
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@test.com`,
      slot_start: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
      slot_end: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
    };

    // Set mock token and data
    setToken('test_token_' + Date.now());
    setStudent(mockStudent);
    setSessionId(uuidv4());
    setStatus('not_started');

    // Navigate to consent screen
    setTimeout(() => {
      navigate('/exam/consent');
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">כניסה למבחן</h1>
          <p className="text-gray-600">מצב בדיקה - הזן פרטים להתחלת המבחן</p>
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
              className="form-input"
              placeholder="הכנס שם פרטי"
              required
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              שם משפחה
            </label>
            <input
              type="text"
              id="lastName"
              onChange={(e) => setLastName(e.target.value)}
              value={lastName}
              className="form-input"
              placeholder="הכנס שם משפחה"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              סיסמה
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="הכנס סיסמה"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'מתחבר...' : 'התחל מבחן'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>מצב בדיקה:</strong> הסיסמה היא <code className="bg-yellow-100 px-1 rounded">test123</code>
          </p>
        </div>
      </div>
    </div>
  );
}
