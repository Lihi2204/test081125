import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/examStore';

export default function UploadScreen() {
  const navigate = useNavigate();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<'uploading' | 'processing' | 'done'>('uploading');
  const [error, setError] = useState<string | null>(null);

  const { sessionId, chunks, hintUsed, questions, setStatus } = useExamStore();

  useEffect(() => {
    if (!sessionId || chunks.size === 0) {
      navigate('/exam');
      return;
    }

    uploadChunks();
  }, [sessionId]);

  const uploadChunks = async () => {
    try {
      // Upload each chunk
      const totalChunks = questions.length;
      let uploadedChunks = 0;

      for (const question of questions) {
        const blob = chunks.get(question.id);
        if (!blob) continue;

        const formData = new FormData();
        formData.append('session_id', sessionId!);
        formData.append('question_id', question.id.toString());
        formData.append('chunk_type', 'answer');
        formData.append('hint_used', (hintUsed.get(question.id) || false).toString());
        formData.append('file', blob, `q${question.id}.webm`);

        const response = await fetch('/api/upload/chunk', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed for question ${question.id}`);
        }

        uploadedChunks++;
        setUploadProgress(Math.round((uploadedChunks / totalChunks) * 50));
      }

      // Finalize upload
      setUploadProgress(60);
      const finalizeResponse = await fetch('/api/upload/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (!finalizeResponse.ok) {
        throw new Error('Failed to finalize upload');
      }

      setUploadProgress(80);
      setCurrentStep('processing');
      setStatus('uploading');

      // Simulate processing completion (in real app, this would be webhooks/polling)
      setTimeout(() => {
        setUploadProgress(100);
        setCurrentStep('done');
        setStatus('completed');

        // Navigate to completion screen
        setTimeout(() => {
          navigate('/exam/complete');
        }, 2000);
      }, 3000);

    } catch (err) {
      console.error('Upload error:', err);
      setError('שגיאה בהעלאת הקלטה. המערכת תנסה שוב...');

      // Retry logic
      setTimeout(() => {
        setError(null);
        uploadChunks();
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="card max-w-xl w-full text-center">
        <div className="text-6xl mb-6">
          {currentStep === 'uploading' && '📤'}
          {currentStep === 'processing' && '⚙️'}
          {currentStep === 'done' && '✅'}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {currentStep === 'uploading' && 'מעלה את ההקלטה...'}
          {currentStep === 'processing' && 'מעבד את התשובות...'}
          {currentStep === 'done' && 'המבחן הסתיים בהצלחה!'}
        </h1>

        <p className="text-gray-600 mb-8">
          {currentStep === 'uploading' && 'נא לא לסגור את הדפדפן'}
          {currentStep === 'processing' && 'זה עלול לקחת כמה דקות'}
          {currentStep === 'done' && 'מעביר לדף הסיום...'}
        </p>

        <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
          <div
            className="bg-primary h-4 rounded-full transition-all duration-500"
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>

        <p className="text-sm text-gray-500">{uploadProgress}%</p>

        {error && (
          <div className="mt-6 bg-red-50 border-r-4 border-danger p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {currentStep !== 'done' && (
          <div className="mt-8 bg-yellow-50 border-r-4 border-warning p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ אנא אל תסגור את הדפדפן עד לסיום ההעלאה
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
