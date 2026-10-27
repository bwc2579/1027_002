/**
 * tts-service.js - Web Speech API Voice Narration Engine
 * Provides calm, gentle Korean voice reading for affirmations and meditation scripts.
 */

class TTSService {
  constructor() {
    this.synth = window.speechSynthesis || null;
    this.isPlaying = false;
    this.currentUtterance = null;
    this.rate = 0.85; // Slightly slower, relaxing meditation pace
    this.pitch = 0.95;
  }

  isSupported() {
    return 'speechSynthesis' in window;
  }

  getKoreanVoice() {
    if (!this.synth) return null;
    const voices = this.synth.getVoices();
    // Prefer Korean voice
    return voices.find(v => v.lang.startsWith('ko') || v.lang.includes('KR')) || null;
  }

  speak(text, onStart, onEnd, onError) {
    if (!this.isSupported() || !text) {
      if (onError) onError('Web Speech API를 지원하지 않는 브라우저입니다.');
      return;
    }

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = this.getKoreanVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = 'ko-KR';
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;

    utterance.onstart = () => {
      this.isPlaying = true;
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.isPlaying = false;
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      this.isPlaying = false;
      this.currentUtterance = null;
      if (onError) onError(e.error || '음성 낭독 중 오류가 발생했습니다.');
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth && (this.isPlaying || this.synth.speaking)) {
      this.synth.cancel();
      this.isPlaying = false;
      this.currentUtterance = null;
    }
  }

  toggle(text, onStart, onEnd, onError) {
    if (this.isPlaying) {
      this.stop();
      if (onEnd) onEnd();
    } else {
      this.speak(text, onStart, onEnd, onError);
    }
  }
}

// Global instance
window.ttsService = new TTSService();
