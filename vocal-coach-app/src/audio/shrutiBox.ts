export class ShrutiBox {
  private audioContext: AudioContext | null = null;
  private saOscillators: OscillatorNode[] = [];
  private paOscillators: OscillatorNode[] = [];
  private masterGain: GainNode | null = null;
  public isPlaying: boolean = false;
  public baselineSa: number = 220;

  constructor() {}

  public init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0; // Start muted
      this.masterGain.connect(this.audioContext.destination);
    }
  }

  public setSa(frequency: number) {
    this.baselineSa = frequency;
    if (this.isPlaying) {
      this.stop();
      this.start();
    }
  }

  public start() {
    if (this.isPlaying) return;
    if (!this.audioContext) this.init();
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }

    this.isPlaying = true;
    
    // Create rich drone using multiple harmonics for Sa (Root)
    [1, 2, 4].forEach(multiplier => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();
      
      osc.type = multiplier === 1 ? 'sine' : 'sawtooth';
      osc.frequency.value = this.baselineSa * multiplier;
      
      // Lower volume for higher harmonics to create a warm drone
      gain.gain.value = 0.1 / multiplier; 
      
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start();
      this.saOscillators.push(osc);
    });

    // Create drone for Pa (Perfect Fifth - 1.5x ratio)
    [1, 2].forEach(multiplier => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = (this.baselineSa * 1.5) * multiplier;
      
      gain.gain.value = 0.05 / multiplier; 
      
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start();
      this.paOscillators.push(osc);
    });

    // Fade in smoothly
    this.masterGain!.gain.setTargetAtTime(0.5, this.audioContext!.currentTime, 1.0);
  }

  public stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;

    // Fade out smoothly
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.5);
      
      setTimeout(() => {
        this.saOscillators.forEach(osc => osc.stop());
        this.paOscillators.forEach(osc => osc.stop());
        this.saOscillators = [];
        this.paOscillators = [];
      }, 1000);
    }
  }
}
