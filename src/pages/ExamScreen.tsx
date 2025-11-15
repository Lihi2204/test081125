import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/examStore';

export default function ExamScreen() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintText, setHintText] = useState('');

  const {
    questions,
    currentQuestionIndex,
    timeRemaining,
    setTimeRemaining,
    addChunk,
    setHintUsed,
    hintUsed,
    nextQuestion,
    setIsRecording: setStoreRecording,
  } = useExamStore();

  const currentQuestion = questions[currentQuestionIndex];

  // Initialize camera and microphone
  useEffect(() => {
    const initMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, frameRate: 25 },
          audio: { echoCancellation: true, noiseSuppression: true }
        });
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

        // Start recording immediately
        startRecording(mediaStream);
      } catch (err) {
        console.error('Failed to get media devices:', err);
        alert('שגיאה בגישה למצלמה/מיקרופון. נא לרענן ולנסות שוב.');
      }
    };

    if (questions.length === 0) {
      navigate('/exam');
      return;
    }

    initMedia();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Start recording
  const startRecording = useCallback((mediaStream: MediaStream) => {
    try {
      const recorder = new MediaRecorder(mediaStream, {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 1500000
      });

      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        addChunk(currentQuestion.id, blob);
        chunksRef.current = [];
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setStoreRecording(true);

      // Start countdown timer
      let timeLeft = 90;
      setTimeRemaining(timeLeft);
      timerRef.current = window.setInterval(() => {
        timeLeft -= 1;
        if (timeLeft <= 0) {
          setTimeRemaining(0);
          handleNextQuestion();
        } else {
          setTimeRemaining(timeLeft);
        }
      }, 1000);

    } catch (err) {
      console.error('Failed to start recording:', err);
      // Fallback to default codec
      const recorder = new MediaRecorder(mediaStream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        addChunk(currentQuestion.id, blob);
        chunksRef.current = [];
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    }
  }, [currentQuestion, addChunk, setTimeRemaining, setStoreRecording]);

  // Handle next question
  const handleNextQuestion = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
    setStoreRecording(false);
    setShowHint(false);

    // Check if this was the last question
    if (currentQuestionIndex >= questions.length - 1) {
      // Stop stream and navigate to upload
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      navigate('/exam/upload');
    } else {
      // Move to next question
      nextQuestion();

      // Start recording for next question after a short delay
      setTimeout(() => {
        if (stream) {
          startRecording(stream);
        }
      }, 500);
    }
  }, [currentQuestionIndex, questions.length, stream, navigate, nextQuestion, startRecording, setStoreRecording]);

  // Handle hint request
  const handleHintRequest = () => {
    if (!hintUsed.get(currentQuestion.id)) {
      setHintUsed(currentQuestion.id, true);
      // In real implementation, fetch hint from backend
      setHintText('רמז: נסה/י לחשוב על הנושא מזווית אחרת...');
      setShowHint(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with progress */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <span className="text-lg font-semibold">
              שאלה {currentQuestionIndex + 1} מתוך {questions.length}
            </span>
            <div className="flex gap-2">
              {questions.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full ${
                    idx < currentQuestionIndex
                      ? 'bg-green-500'
                      : idx === currentQuestionIndex
                      ? 'bg-primary'
                      : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isRecording && (
              <div className="flex items-center gap-2 recording-indicator">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                <span className="text-red-400">REC</span>
              </div>
            )}
            <div className={`text-3xl font-mono font-bold ${timeRemaining <= 10 ? 'text-red-400' : ''}`}>
              {formatTime(timeRemaining)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question Display */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">השאלה:</h2>
              <p className="text-lg leading-relaxed">{currentQuestion.text}</p>
            </div>

            {showHint && (
              <div className="bg-yellow-900 bg-opacity-50 rounded-lg p-4 border-r-4 border-yellow-500">
                <p className="text-yellow-200">{hintText}</p>
              </div>
            )}

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">הנחיות:</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• ענה/י על השאלה בקול ברור</li>
                <li>• יש לך {formatTime(timeRemaining)} נותרו</li>
                <li>• המצלמה והמיקרופון מקליטים</li>
                <li>• ניתן להמשיך לשאלה הבאה בכל עת</li>
              </ul>
            </div>
          </div>

          {/* Video Preview & Controls */}
          <div className="space-y-4">
            <div className="bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full aspect-video object-cover transform scale-x-[-1]"
              />
            </div>

            <div className="space-y-3">
              <button
                onClick={handleHintRequest}
                disabled={hintUsed.get(currentQuestion.id)}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  hintUsed.get(currentQuestion.id)
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                {hintUsed.get(currentQuestion.id) ? 'רמז כבר נוצל' : '💡 בקש רמז (יפחית מהציון)'}
              </button>

              <button
                onClick={handleNextQuestion}
                className="w-full py-3 bg-primary hover:bg-blue-600 rounded-lg font-medium transition-colors"
              >
                {currentQuestionIndex >= questions.length - 1
                  ? 'סיים מבחן'
                  : 'המשך לשאלה הבאה'}
              </button>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-400">
              <p>
                <strong>שים לב:</strong> לחיצה על "המשך" תשמור את התשובה הנוכחית ותעבור לשאלה הבאה.
                לא ניתן לחזור לשאלות קודמות.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
