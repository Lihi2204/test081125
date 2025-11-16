export class VoiceService {
  private utterance: SpeechSynthesisUtterance | null = null;

  async speak(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Cancel any ongoing speech
      speechSynthesis.cancel();

      this.utterance = new SpeechSynthesisUtterance(text);
      this.utterance.lang = 'he-IL';
      this.utterance.rate = 0.9;
      this.utterance.pitch = 1;
      this.utterance.volume = 1;

      this.utterance.onend = () => resolve();
      this.utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        reject(new Error('Speech synthesis failed'));
      };

      // Small delay to ensure voices are loaded
      setTimeout(() => {
        if (this.utterance) {
          speechSynthesis.speak(this.utterance);
        }
      }, 100);
    });
  }

  stopSpeaking() {
    speechSynthesis.cancel();
  }

  getHebrewVoice(): SpeechSynthesisVoice | null {
    const voices = speechSynthesis.getVoices();
    return voices.find(voice => voice.lang.includes('he')) || null;
  }

  async waitForSilence(
    stream: MediaStream,
    threshold = 3000
  ): Promise<void> {
    return new Promise((resolve) => {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let silenceStart = Date.now();

      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        const volume = dataArray.reduce((a, b) => a + b) / dataArray.length;

        if (volume < 10) {
          if (Date.now() - silenceStart > threshold) {
            audioContext.close();
            resolve();
            return;
          }
        } else {
          silenceStart = Date.now();
        }
        requestAnimationFrame(checkVolume);
      };

      checkVolume();
    });
  }
}

export const voiceService = new VoiceService();
