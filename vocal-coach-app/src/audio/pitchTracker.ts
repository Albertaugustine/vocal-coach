import { analyzeVocalRegister, VocalRegister } from './timbreEngine';

export class PitchTracker {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private buffer: Float32Array;
  private isTracking = false;
  private onPitchDetected: (frequency: number) => void;
  public onTimbreDetected: ((register: VocalRegister) => void) | null = null;

  constructor(onPitchDetected: (frequency: number) => void) {
    this.onPitchDetected = onPitchDetected;
    // 2048 is a good buffer size for general pitch detection 
    this.buffer = new Float32Array(2048);
  }

  public async start() {
    if (this.isTracking) return;
    
    try {
      // Initialize AudioContext
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      
      // Request microphone access with AGC disabled to prevent db boosting background noise
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false 
        } 
      });
      
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);
      
      this.isTracking = true;
      this.trackPitch();
    } catch (err) {
      console.error('Error accessing microphone for pitch tracking:', err);
    }
  }

  public stop() {
    this.isTracking = false;
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  private trackPitch = () => {
    if (!this.isTracking || !this.analyser || !this.audioContext) return;

    this.analyser.getFloatTimeDomainData(this.buffer as any);
    const pitch = this.autoCorrelate(this.buffer, this.audioContext.sampleRate);
    
    this.onPitchDetected(pitch);
    
    if (pitch !== -1 && this.onTimbreDetected) {
      const register = analyzeVocalRegister(this.analyser, pitch, this.audioContext.sampleRate);
      this.onTimbreDetected(register);
    }

    requestAnimationFrame(this.trackPitch);
  }

  /**
   * Basic Autocorrelation Pitch Detection algorithm
   * Extracts fundamental frequency (f0) from the time domain data
   */
  private autoCorrelate(buffer: Float32Array, sampleRate: number): number {
    let size = buffer.length;
    let rms = 0;

    // Calculate Root Mean Square to detect if there is enough signal (volume)
    for (let i = 0; i < size; i++) {
      const val = buffer[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / size);

    // If volume is too low, don't attempt to calculate pitch (increased threshold to filter noise)
    if (rms < 0.03) return -1;

    // Trim the buffer
    let r1 = 0, r2 = size - 1, thres = 0.2;
    for (let i = 0; i < size / 2; i++) {
      if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
    }
    for (let i = 1; i < size / 2; i++) {
      if (Math.abs(buffer[size - i]) < thres) { r2 = size - i; break; }
    }

    buffer = buffer.slice(r1, r2);
    size = buffer.length;

    // Autocorrelation calculation
    const c = new Array(size).fill(0);
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size - i; j++) {
        c[i] = c[i] + buffer[j] * buffer[j + i];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < size; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }
    let T0 = maxpos;

    // Parabolic Interpolation for finer pitch estimation
    const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);

    return sampleRate / T0;
  }
}
