import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface TranscriptionResult {
  text: string;
  language: string;
  duration: number;
}

// Transcribe audio buffer using OpenAI Whisper
export async function transcribeAudio(
  audioBuffer: Buffer,
  fileName: string = 'audio.webm'
): Promise<TranscriptionResult> {
  // Convert Buffer to File object for OpenAI API
  const file = new File([audioBuffer], fileName, { type: 'audio/webm' });

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'he', // Hebrew
    response_format: 'verbose_json',
  });

  return {
    text: transcription.text,
    language: transcription.language || 'he',
    duration: transcription.duration || 0,
  };
}

// Transcribe multiple audio files
export async function transcribeMultiple(
  audioBuffers: Array<{ buffer: Buffer; questionId: number }>
): Promise<Map<number, string>> {
  const results = new Map<number, string>();

  for (const { buffer, questionId } of audioBuffers) {
    try {
      const result = await transcribeAudio(buffer, `q${questionId}.webm`);
      results.set(questionId, result.text);
    } catch (error) {
      console.error(`Failed to transcribe question ${questionId}:`, error);
      results.set(questionId, '[שגיאה בתמלול]');
    }
  }

  return results;
}
