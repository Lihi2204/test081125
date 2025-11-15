import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdminStore } from '../../store/examStore';
import type { SessionStatus } from '../../types';

interface SessionListItem {
  session_id: string;
  student_name: string;
  id_last4: string;
  date: string;
  total_score?: number;
  status: SessionStatus;
  finalized: boolean;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, userEmail, sessions, setSessions, logout } = useAdminStore();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'in_progress' | 'finalized'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // For demo purposes, check if we have a session token
    const token = localStorage.getItem('admin_token');
    if (!token && !isAuthenticated) {
      navigate('/admin');
      return;
    }

    // Fetch sessions
    fetchSessions();
  }, [isAuthenticated, navigate]);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/admin/sessions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const data = await response.json();
      setSessions(data.sessions);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      // For demo, use mock data
      setSessions([
        {
          session_id: 'demo-1',
          student_name: 'דנה כהן',
          id_last4: '1234',
          date: new Date().toISOString(),
          total_score: 75,
          status: 'completed',
          finalized: false,
        },
        {
          session_id: 'demo-2',
          student_name: 'יוסי לוי',
          id_last4: '5678',
          date: new Date().toISOString(),
          total_score: 82,
          status: 'completed',
          finalized: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    logout();
    navigate('/admin');
  };

  const getStatusBadge = (status: SessionStatus, finalized: boolean) => {
    if (finalized) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">✓ אושר</span>;
    }

    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">ממתין לבדיקה</span>;
      case 'in_progress':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">בתהליך</span>;
      case 'scoring':
        return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">מעבד</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">{status}</span>;
    }
  };

  const filteredSessions = sessions.filter((session) => {
    // Apply status filter
    if (filter === 'completed' && session.status !== 'completed') return false;
    if (filter === 'in_progress' && session.status !== 'in_progress') return false;
    if (filter === 'finalized' && !session.finalized) return false;

    // Apply search filter
    if (searchTerm && !session.student_name.includes(searchTerm) && !session.id_last4.includes(searchTerm)) {
      return false;
    }

    return true;
  });

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">דשבורד ניהול מבחנים</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{userEmail || 'lihi.cyn@gmail.com'}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-700"
            >
              התנתק
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card">
            <h3 className="text-sm text-gray-500">סה"כ מבחנים</h3>
            <p className="text-3xl font-bold">{sessions.length}</p>
          </div>
          <div className="card">
            <h3 className="text-sm text-gray-500">ממתינים לבדיקה</h3>
            <p className="text-3xl font-bold text-blue-600">
              {sessions.filter(s => s.status === 'completed' && !s.finalized).length}
            </p>
          </div>
          <div className="card">
            <h3 className="text-sm text-gray-500">אושרו</h3>
            <p className="text-3xl font-bold text-green-600">
              {sessions.filter(s => s.finalized).length}
            </p>
          </div>
          <div className="card">
            <h3 className="text-sm text-gray-500">ציון ממוצע</h3>
            <p className="text-3xl font-bold">
              {sessions.length > 0
                ? Math.round(
                    sessions.reduce((acc, s) => acc + (s.total_score || 0), 0) /
                    sessions.filter(s => s.total_score).length
                  )
                : 0}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-wrap gap-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="form-input w-auto"
            >
              <option value="all">הכל</option>
              <option value="completed">הושלמו</option>
              <option value="in_progress">בתהליך</option>
              <option value="finalized">אושרו</option>
            </select>
            <input
              type="text"
              placeholder="חפש לפי שם או ת.ז..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        {/* Sessions Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">סטודנט</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">ת.ז</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">תאריך</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">ציון</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">סטטוס</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSessions.map((session) => (
                  <tr key={session.session_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{session.student_name}</td>
                    <td className="px-4 py-3 text-sm">****{session.id_last4}</td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(session.date).toLocaleDateString('he-IL')}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {session.total_score ? `${session.total_score}/100` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getStatusBadge(session.status, session.finalized)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Link
                        to={`/admin/session/${session.session_id}`}
                        className="text-primary hover:text-blue-700 font-medium"
                      >
                        צפייה ועריכה
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredSessions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                לא נמצאו מבחנים
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
