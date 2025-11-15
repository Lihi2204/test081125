import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/examStore';

export default function PrecheckScreen() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const [cameraStatus, setCameraStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [micStatus, setMicStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [audioLevel, setAudioLevel] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { student, consent, setPrecheckPassed, setStatus } = useExamStore();

  useEffect(() => {
    if (!student || !consent) {
      navigate('/exam');
      return;
    }

    // Request camera and microphone permissions
    const initMediaDevices = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 25 }
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true
          }
        });

        setStream(mediaStream);

        // Set up video preview
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
        setCameraStatus('ok');

        // Set up audio level monitoring
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(mediaStream);
        microphone.connect(analyser);

        analyser.fftSize = 256;
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        setMicStatus('ok');

        // Start monitoring audio levels
        const checkAudioLevel = () => {
          if (analyserRef.current) {
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setAudioLevel(Math.min(100, average * 2));
          }
          animationRef.current = requestAnimationFrame(checkAudioLevel);
        };
        checkAudioLevel();

      } catch (err) {
        console.error('Media device error:', err);
        if (err instanceof Error) {
          if (err.name === 'NotAllowedError') {
            setError('נדרשת הרשאה לגישה למצלמה ומיקרופון. נא לאפשר גישה ולרענן את הדף.');
          } else if (err.name === 'NotFoundError') {
            setError('לא נמצאו מצלמה או מיקרופון. נא לוודא שהם מחוברים.');
          } else {
            setError(`שגיאה בגישה למצלמה/מיקרופון: ${err.message}`);
          }
        }
        setCameraStatus('error');
        setMicStatus('error');
      }
    };

    initMediaDevices();

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [student, consent, navigate]);

  const handleContinue = () => {
    if (cameraStatus === 'ok' && micStatus === 'ok') {
      setPrecheckPassed(true);
      setStatus('precheck');

      // Stop the stream before navigating
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      navigate('/exam/buffer');
    }
  };

  if (!student) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="card">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            בדיקת מצלמה ומיקרופון
          </h1>

          {error && (
            <div className="bg-red-50 border-r-4 border-danger p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Camera Preview */}
            <div className="space-y-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <span className={`inline-block w-3 h-3 rounded-full ${
                  cameraStatus === 'ok' ? 'bg-green-500' :
                  cameraStatus === 'error' ? 'bg-red-500' :
                  'bg-yellow-500 animate-pulse'
                }`}></span>
                מצלמה
              </h2>
              <div className="bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
              </div>
              <p className={`text-sm ${cameraStatus === 'ok' ? 'text-green-600' : 'text-gray-500'}`}>
                {cameraStatus === 'ok' && '✓ המצלמה עובדת כראוי'}
                {cameraStatus === 'checking' && '⏳ בודק מצלמה...'}
                {cameraStatus === 'error' && '✗ בעיה במצלמה'}
              </p>
            </div>

            {/* Microphone Level */}
            <div className="space-y-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <span className={`inline-block w-3 h-3 rounded-full ${
                  micStatus === 'ok' ? 'bg-green-500' :
                  micStatus === 'error' ? 'bg-red-500' :
                  'bg-yellow-500 animate-pulse'
                }`}></span>
                מיקרופון
              </h2>
              <div className="bg-gray-100 rounded-lg p-6 aspect-video flex flex-col items-center justify-center">
                <div className="text-6xl mb-4">🎤</div>
                <div className="w-full bg-gray-300 rounded-full h-4">
                  <div
                    className="bg-green-500 h-4 rounded-full transition-all duration-100"
                    style={{ width: `${audioLevel}%` }}
                  ></div>
                </div>
                <p className="mt-4 text-sm text-gray-600">דבר/י כדי לבדוק את המיקרופון</p>
              </div>
              <p className={`text-sm ${micStatus === 'ok' ? 'text-green-600' : 'text-gray-500'}`}>
                {micStatus === 'ok' && '✓ המיקרופון עובד כראוי'}
                {micStatus === 'checking' && '⏳ בודק מיקרופון...'}
                {micStatus === 'error' && '✗ בעיה במיקרופון'}
              </p>
            </div>
          </div>

          <div className="mt-8 bg-yellow-50 border-r-4 border-warning p-4">
            <h3 className="font-semibold mb-2">לפני שתמשיך/י:</h3>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• וודא/י שאתה/את נראה/ית היטב במצלמה</li>
              <li>• וודא/י שיש תאורה מספקת</li>
              <li>• וודא/י שהמיקרופון קולט את הקול שלך (פס ירוק נע)</li>
              <li>• הסר/י רעשי רקע אם יש</li>
            </ul>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={handleContinue}
              disabled={cameraStatus !== 'ok' || micStatus !== 'ok'}
              className="btn-primary"
            >
              הכל עובד, המשך לחדר המתנה
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
