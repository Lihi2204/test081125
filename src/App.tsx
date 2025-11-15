import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';

// Lazy load pages for better performance
const ExamEntry = lazy(() => import('./pages/ExamEntry'));
const ConsentScreen = lazy(() => import('./pages/ConsentScreen'));
const PrecheckScreen = lazy(() => import('./pages/PrecheckScreen'));
const BufferScreen = lazy(() => import('./pages/BufferScreen'));
const ExamScreen = lazy(() => import('./pages/ExamScreen'));
const UploadScreen = lazy(() => import('./pages/UploadScreen'));
const CompletionScreen = lazy(() => import('./pages/CompletionScreen'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminSessionDetail = lazy(() => import('./pages/admin/AdminSessionDetail'));

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      <p className="mt-4 text-gray-600">טוען...</p>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Student Exam Flow */}
          <Route path="/exam" element={<ExamEntry />} />
          <Route path="/exam/consent" element={<ConsentScreen />} />
          <Route path="/exam/precheck" element={<PrecheckScreen />} />
          <Route path="/exam/buffer" element={<BufferScreen />} />
          <Route path="/exam/start" element={<ExamScreen />} />
          <Route path="/exam/upload" element={<UploadScreen />} />
          <Route path="/exam/complete" element={<CompletionScreen />} />

          {/* Admin Dashboard */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/session/:id" element={<AdminSessionDetail />} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/exam" replace />} />
          <Route path="*" element={<Navigate to="/exam" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
