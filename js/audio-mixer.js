/**
 * audio-mixer.js - Web Audio API Synthetic Ambient Sound Mixer
 * Generates Rain, Ocean Waves, Meditation Bell, and Ambient Drone synthetically.
 * 100% Offline, zero external audio files, pure browser Web Audio API.
 */

class AmbientAudioMixer {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sounds = {
      rain: { active: false, gain: null, node: null, volume: 0.4 },
      ocean: { active: false, gain: null, node: null, volume: 0.4 },
      bell: { active: false, gain: null, node: null, volume: 0.6 },
      binaural: { active: false, gain: null, node: null, volume: 0.3 }
    };
    this.isMuted = false;
  }

  // Lazy initialize AudioContext on user interaction
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Toggle or start sound
  toggleSound(type) {
    this.init();
    if (!this.sounds[type]) return false;

    if (this.sounds[type].active) {
      this.stopSound(type);
      return false;
    } else {
      this.startSound(type);
      return true;
    }
  }

  setVolume(type, val) {
    this.init();
    const sound = this.sounds[type];
    if (sound) {
      sound.volume = Math.max(0, Math.min(1, val));
      if (sound.gain && this.ctx) {
        sound.gain.gain.setValueAtTime(sound.volume, this.ctx.currentTime);
      }
    }
  }

  setMasterVolume(val) {
    this.init();
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, val)), this.ctx.currentTime);
    }
  }

  startSound(type) {
    this.init();
    const sound = this.sounds[type];
    if (!sound || sound.active) return;

    sound.gain = this.ctx.createGain();
    sound.gain.gain.setValueAtTime(sound.volume, this.ctx.currentTime);
    sound.gain.connect(this.masterGain);

    if (type === 'rain') {
      sound.node = this._createRainGenerator(sound.gain);
    } else if (type === 'ocean') {
      sound.node = this._createOceanGenerator(sound.gain);
    } else if (type === 'binaural') {
      sound.node = this._createBinauralGenerator(sound.gain);
    } else if (type === 'bell') {
      this.playMeditationBell();
      return;
    }

    sound.active = true;
  }

  stopSound(type) {
    const sound = this.sounds[type];
    if (!sound || !sound.active) return;

    if (sound.node) {
      try {
        if (sound.node.stop) sound.node.stop();
        if (sound.node.disconnect) sound.node.disconnect();
      } catch (e) {}
    }
    sound.active = false;
  }

  stopAll() {
    Object.keys(this.sounds).forEach(key => this.stopSound(key));
  }

  // Synthetic Pink Noise for Rain
  _createRainGenerator(targetGain) {
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Filter to sound like soft rainfall
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(targetGain);
    noise.start();
    return noise;
  }

  // Ocean Waves Generator (Filtered noise with LFO volume modulation)
  _createOceanGenerator(targetGain) {
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);

    // LFO (Low Frequency Oscillator) to mimic swelling ocean waves
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // 8-second wave cycle

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    const waveGain = this.ctx.createGain();
    waveGain.gain.setValueAtTime(0.4, this.ctx.currentTime);

    lfo.connect(waveGain.gain);
    noise.connect(filter);
    filter.connect(waveGain);
    waveGain.connect(targetGain);

    noise.start();
    lfo.start();

    return {
      stop: () => {
        try {
          noise.stop();
          lfo.stop();
        } catch (e) {}
      }
    };
  }

  // 432Hz Healing Frequency & Binaural Alpha Wave Drone
  _createBinauralGenerator(targetGain) {
    const oscLeft = this.ctx.createOscillator();
    const oscRight = this.ctx.createOscillator();
    const merger = this.ctx.createChannelMerger(2);

    // 432 Hz base, 442 Hz in other ear -> 10 Hz Alpha wave
    oscLeft.frequency.setValueAtTime(432, this.ctx.currentTime);
    oscRight.frequency.setValueAtTime(442, this.ctx.currentTime);

    oscLeft.connect(merger, 0, 0);
    oscRight.connect(merger, 0, 1);

    merger.connect(targetGain);

    oscLeft.start();
    oscRight.start();

    return {
      stop: () => {
        try {
          oscLeft.stop();
          oscRight.stop();
        } catch (e) {}
      }
    };
  }

  // Tibetan Singing Bowl / Chime Bell with rich overtone harmonics & long decay
  playMeditationBell() {
    this.init();
    const fundamental = 396; // 396Hz Solfeggio frequency
    const harmonics = [1, 2.76, 5.4, 8.93];
    const gains = [0.6, 0.3, 0.15, 0.05];
    const duration = 6.0;

    const bellMaster = this.ctx.createGain();
    bellMaster.gain.setValueAtTime(this.sounds.bell.volume, this.ctx.currentTime);
    bellMaster.connect(this.masterGain);

    harmonics.forEach((h, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(fundamental * h, this.ctx.currentTime);

      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(gains[idx], now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration / (idx + 1));

      osc.connect(gain);
      gain.connect(bellMaster);

      osc.start(now);
      osc.stop(now + duration);
    });
  }
}

// Global instance
window.ambientMixer = new AmbientAudioMixer();
