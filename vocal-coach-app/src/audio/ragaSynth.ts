import { RAGA_DATABASE } from '../music-engine/ragaScales';

export type VoiceModel = 'TRIANGLE_HARMONIUM' | 'SYNTHETIC_VOICE';

export class RagaSynthesizer {
  private audioContext: AudioContext;

  constructor() {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContextClass();
  }

  /**
   * Synthesize and play the Raga scale mathematically relative to the baseline Sa
   */
  public async playScale(
    ragaId: string, 
    baselineSa: number, 
    voiceModel: VoiceModel = 'TRIANGLE_HARMONIUM'
  ): Promise<void> {
    const ragaData = RAGA_DATABASE[ragaId];
    if (!ragaData) return Promise.resolve();

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const noteDuration = 1.0; // Slower, 1 full second per note
    const ratios = ragaData.notes.map(n => n.ratio);
    
    // Play ascending (Arohana) and then descending (Avarohana)
    const ascending = [...ratios];
    const descending = [...ratios].reverse().slice(1); // skip repeating top note
    const sequence = [...ascending, ...descending];

    return new Promise((resolve) => {
      let startTime = this.audioContext.currentTime + 0.1;

      for (let i = 0; i < sequence.length; i++) {
        const ratio = sequence[i];
        const frequency = baselineSa * ratio;

        this.scheduleNote(frequency, startTime, noteDuration, voiceModel);
        startTime += noteDuration;
      }

      // Resolve the promise when playback sequence finishes
      setTimeout(() => {
        resolve();
      }, (startTime - this.audioContext.currentTime) * 1000);
    });
  }

  /**
   * Synthesize and play a specific sequence of note indices.
   */
  public async playSequence(
    ragaId: string, 
    baselineSa: number, 
    noteIndices: number[],
    voiceModel: VoiceModel = 'TRIANGLE_HARMONIUM',
    tempoMultiplier: number = 1.0
  ): Promise<void> {
    const ragaData = RAGA_DATABASE[ragaId];
    if (!ragaData) return Promise.resolve();

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const baseNoteDuration = 1.0; 
    const noteDuration = baseNoteDuration * tempoMultiplier;
    
    return new Promise((resolve) => {
      let startTime = this.audioContext.currentTime + 0.1;

      for (let i = 0; i < noteIndices.length; i++) {
        const idx = noteIndices[i];
        if (idx >= 0 && idx < ragaData.notes.length) {
          const ratio = ragaData.notes[idx].ratio;
          const frequency = baselineSa * ratio;
          this.scheduleNote(frequency, startTime, noteDuration, voiceModel);
        }
        startTime += noteDuration;
      }

      setTimeout(() => {
        resolve();
      }, (startTime - this.audioContext.currentTime) * 1000);
    });
  }

  private scheduleNote(frequency: number, startTime: number, duration: number, voiceModel: VoiceModel) {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    // Amplitude Envelope to avoid hard clicking
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05); // Attack
    gainNode.gain.linearRampToValueAtTime(0.2, startTime + duration - 0.05); // Sustain
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration); // Release

    if (voiceModel === 'TRIANGLE_HARMONIUM') {
      // Basic smooth tone
      oscillator.type = 'triangle';
      oscillator.frequency.value = frequency;
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

    } else if (voiceModel === 'SYNTHETIC_VOICE') {
      // Advanced Web Audio API Formant filtering to simulate an "Ah" human vocal vowel
      oscillator.type = 'sawtooth';
      oscillator.frequency.value = frequency;

      // Vocal Tract Formant 1: ~730 Hz
      const f1 = this.audioContext.createBiquadFilter();
      f1.type = 'bandpass';
      f1.frequency.value = 730;
      f1.Q.value = 4;

      // Vocal Tract Formant 2: ~1090 Hz
      const f2 = this.audioContext.createBiquadFilter();
      f2.type = 'bandpass';
      f2.frequency.value = 1090;
      f2.Q.value = 5;

      // Vocal Tract Formant 3: ~2440 Hz
      const f3 = this.audioContext.createBiquadFilter();
      f3.type = 'bandpass';
      f3.frequency.value = 2440;
      f3.Q.value = 6;

      // Connect oscillator through formant filters in parallel
      oscillator.connect(f1);
      oscillator.connect(f2);
      oscillator.connect(f3);

      f1.connect(gainNode);
      f2.connect(gainNode);
      f3.connect(gainNode);

      gainNode.connect(this.audioContext.destination);
    }

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }
}
