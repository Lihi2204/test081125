import { useState, useRef, useCallback } from 'react';

interface UseVoiceRecordingReturn {
  isRecording: boolean;
  audioBlob: Blob | null;
  startRecording: () => Promise<MediaStream>;
  stopRecording: () => Promise<Blob>;
  error: string | null;
}

export default function useVoiceRecording(): UseVoiceRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async (): Promise<MediaStream> => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      streamRef.current = stream;

      // Use webm format with opus codec for better compression
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      mediaRecorder.current = new MediaRecorder(stream, { mimeType });
      chunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.current.push(e.data);
        }
      };

      mediaRecorder.current.start(100); // Collect data every 100ms
      setIsRecording(true);

      return stream;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access microphone';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<Blob> => {
    return new Promise((resolve) => {
      if (!mediaRecorder.current || mediaRecorder.current.state === 'inactive') {
        const emptyBlob = new Blob([], { type: 'audio/webm' });
        resolve(emptyBlob);
        return;
      }

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, {
          type: mediaRecorder.current?.mimeType || 'audio/webm'
        });
        setAudioBlob(blob);
        resolve(blob);
      };

      mediaRecorder.current.stop();

      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      setIsRecording(false);
    });
  }, []);

  return {
    isRecording,
    audioBlob,
    startRecording,
    stopRecording,
    error
  };
}
