import { RAGA_DATABASE } from '../music-engine/ragaScales';
import { PitchTracker } from '../audio/pitchTracker';
import { RagaSynthesizer, VoiceModel } from '../audio/ragaSynth';
import { VocalRegister } from '../audio/timbreEngine';
import { ShrutiBox } from '../audio/shrutiBox';

export type AppState = 'CONVERSATIONAL' | 'ASSESSMENT' | 'CALIBRATION' | 'RESULTS';

export class VocalCoachController {
  public currentState: AppState = 'CONVERSATIONAL';
  public currentRaga: string | null = null;
  public baselineSa: number = 220; 
  public liveFeedback: 'TOO_HIGH' | 'TOO_LOW' | 'PERFECT' | 'LISTENING' = 'LISTENING';
  public liveRegister: VocalRegister = 'UNKNOWN';

  public assessmentSequenceLength: number = 1; 
  public assessmentCurrentIndex: number = 0; 
  public assessmentIsCorrecting: boolean = false; 
  public currentNoteSequence: number[] = []; 
  
  private noteStableFrames: number = 0;
  private mistakeFrames: number = 0;
  private waitingForArticulation: boolean = false;

  // Real-time tracking properties (legacy stats kept for compatibility if needed)
  public validFrames: number = 0;
  public totalFrames: number = 0;

  // Callbacks
  public onStateChange?: (state: AppState, payload?: any) => void;
  public onPitchUpdate?: (frequency: number) => void;
  public onFeedbackUpdate?: (feedback: string) => void;
  public onSynthStateUpdate?: (isSynthesizing: boolean) => void;
  public onSequenceUpdate?: (sequence: number[], currentIndex: number, isCorrecting: boolean) => void;
  public onRegisterUpdate?: (register: VocalRegister) => void;
  
  private pitchTracker: PitchTracker;
  private ragaSynthesizer: RagaSynthesizer;
  private shrutiBox: ShrutiBox;
  private geminiWebSocket: WebSocket | null = null;
  
  public isSynthesizing = false;
  public synthVoiceModel: VoiceModel = 'SYNTHETIC_VOICE';
  public currentTempoMultiplier: number = 1.0;

  // Calibration aggregation
  private calibrationSamples: number[] = [];

  // Assessment aggregation
  private lastPitchTime = 0;
  private silenceTimeout: number | null = null;
  
  public lastAccuracyScore: number = 0;

  constructor() {
    this.pitchTracker = new PitchTracker(this.handlePitchDetected.bind(this));
    this.ragaSynthesizer = new RagaSynthesizer();
    this.shrutiBox = new ShrutiBox();
    console.log(`[State Transition]: Shifted to ${this.currentState}`);
  }

  public transitionTo(newState: AppState, raga: string | null = null) {
    this.currentState = newState;
    this.currentRaga = raga;
    console.log(`[State Transition]: Shifted to ${newState} ${raga ? `for ${raga}` : ''}`);
    
    if (newState === 'CONVERSATIONAL') {
      this.startVoiceInteraction();
    } else if (newState === 'ASSESSMENT') {
      this.triggerPitchAssessment();
    } else if (newState === 'CALIBRATION') {
      this.startCalibration();
    }
  }

  public getBaselineSa(): number {
    return this.baselineSa;
  }

  public setBaselineSa(hz: number) {
    this.baselineSa = hz;
    console.log(`[VocalCoachController] Baseline Sa updated to ${hz.toFixed(2)} Hz`);
    this.shrutiBox.setSa(hz);
    this.shrutiBox.start();
  }

  public toggleShrutiBox() {
    if (this.shrutiBox.isPlaying) {
      this.shrutiBox.stop();
    } else {
      this.shrutiBox.start();
    }
  }

  public isShrutiBoxPlaying(): boolean {
    return this.shrutiBox.isPlaying;
  }

  private startCalibration() {
    console.log("[VocalCoachController] Starting Calibration Mode...");
    this.calibrationSamples = [];
    this.pitchTracker.start();
  }

  public finishCalibration() {
    this.pitchTracker.stop();
    if (this.calibrationSamples.length > 0) {
      const sum = this.calibrationSamples.reduce((a, b) => a + b, 0);
      const avg = sum / this.calibrationSamples.length;
      this.setBaselineSa(avg);
    } else {
      console.log("[VocalCoachController] Calibration finished but no samples were collected.");
    }
    this.transitionTo('CONVERSATIONAL');
  }

  public connectToGemini(url: string) {
    this.geminiWebSocket = new WebSocket(url);

    this.geminiWebSocket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const text = payload.serverContent?.modelTurn?.parts?.[0]?.text;
        if (text) {
          // Check for Agentic Assessment Commands
          // Format: [TRIGGER_SINGING: ragaName] or [TRIGGER_SINGING: ragaName:tempoMultiplier]
          const singingMatch = text.match(/\[TRIGGER_SINGING:\s*([a-zA-Z0-9_-]+)(?::([0-9.]+))?\]/);
          const diagnosticMatch = text.match(/\[TRIGGER_DIAGNOSTIC:\s*([^\]]+)\]/);
          
          if (singingMatch) {
            const ragaId = singingMatch[1].trim();
            const tempo = singingMatch[2] ? parseFloat(singingMatch[2]) : 1.0;
            this.currentRaga = ragaId;
            this.currentTempoMultiplier = tempo;
            this.transitionTo('ASSESSMENT', ragaId);
          } else if (diagnosticMatch) {
            const diagId = diagnosticMatch[1].trim();
            this.currentRaga = diagId; // Map diagnostic tests just like ragas
            this.transitionTo('ASSESSMENT', diagId);
          }
        }
      } catch (e) {
        console.error("Failed to parse Gemini message", e);
      }
    };
    this.geminiWebSocket.onerror = (error) => {
      console.error('[Gemini API] WebSocket Error:', error);
    };
  }

  private startVoiceInteraction() {
    console.log("Streaming voice interaction loop with Gemini Guru active.");
    // Ensure pitch tracker is off during conversation to save resources
    this.pitchTracker.stop();
  }

  private async triggerPitchAssessment() {
    if (!this.currentRaga || !RAGA_DATABASE[this.currentRaga]) {
      console.error(`Unknown raga: ${this.currentRaga}`);
      this.transitionTo('CONVERSATIONAL');
      return;
    }

    console.log(`Starting Sequential Assessment for: ${RAGA_DATABASE[this.currentRaga].name}`);
    
    const raga = RAGA_DATABASE[this.currentRaga];
    const numNotes = raga.notes.length;
    
    // We build the sequence: indices 0 to length - 1 (ascending)
    this.currentNoteSequence = Array.from({length: numNotes}, (_, i) => i);
    this.assessmentSequenceLength = 1;
    this.assessmentCurrentIndex = 0;
    this.assessmentIsCorrecting = false;

    if (this.onSequenceUpdate) {
      this.onSequenceUpdate(this.currentNoteSequence.slice(0, this.assessmentSequenceLength), this.assessmentCurrentIndex, false);
    }
    
    this.isSynthesizing = true;
    if (this.onSynthStateUpdate) this.onSynthStateUpdate(this.isSynthesizing);

    // Play the first note to kick off at the specified tempo
    await this.ragaSynthesizer.playSequence(
      this.currentRaga, 
      this.baselineSa, 
      [0], 
      this.synthVoiceModel, 
      this.currentTempoMultiplier
    );
    
    this.isSynthesizing = false;
    if (this.onSynthStateUpdate) this.onSynthStateUpdate(this.isSynthesizing);

    this.noteStableFrames = 0;
    this.mistakeFrames = 0;
    this.lastPitchTime = Date.now();
    
    this.pitchTracker.start();
    this.startSilenceDetection();
  }

  private handlePitchDetected(frequency: number) {
    if (this.currentState === 'CALIBRATION') {
      if (frequency !== -1) {
        this.calibrationSamples.push(frequency);
        if (this.onPitchUpdate) this.onPitchUpdate(frequency);
      }
      return;
    }

    if (frequency === -1) {
      // Silence detected, user took a breath or broke the note
      this.waitingForArticulation = false;
      return;
    }

    if (this.onPitchUpdate) {
      this.onPitchUpdate(frequency);
    }

    if (this.currentState !== 'ASSESSMENT' || !this.currentRaga) return;
    if (this.isSynthesizing) return; // Wait until Guru finishes singing

    this.lastPitchTime = Date.now();

    const ragaId = this.currentRaga as keyof typeof RAGA_DATABASE;
    const ragaNotes = RAGA_DATABASE[ragaId].notes;
    
    let targetNoteIndex = this.assessmentIsCorrecting 
      ? this.assessmentCurrentIndex 
      : this.currentNoteSequence[this.assessmentCurrentIndex];
      
    const targetRatio = ragaNotes[targetNoteIndex].ratio;
    const targetFreq = targetRatio * this.baselineSa;
    
    const difference = frequency - targetFreq;
    // Allow ±5% tolerance (~85 cents) to account for natural human pitch fluctuation and vibrato
    const isTargetHit = Math.abs(difference / targetFreq) <= 0.05; 
    
    // Check if user is still lingering on the previous note (giving them time to transition/breathe)
    let isLingering = false;
    if (!this.assessmentIsCorrecting && this.assessmentCurrentIndex > 0) {
      const prevNoteIndex = this.currentNoteSequence[this.assessmentCurrentIndex - 1];
      const prevRatio = ragaNotes[prevNoteIndex].ratio;
      const prevFreq = prevRatio * this.baselineSa;
      if (Math.abs((frequency - prevFreq) / prevFreq) <= 0.05) {
        isLingering = true;
      }
    }
    
    if (this.waitingForArticulation) {
      if (!isTargetHit) {
        // User's pitch strayed away from the target, counts as an articulation break!
        this.waitingForArticulation = false;
      } else {
        // Still singing the exact same pitch continuously, force them to break it!
        return;
      }
    }

    if (isTargetHit) {
      this.noteStableFrames++;
      this.mistakeFrames = 0;
      this.liveFeedback = 'PERFECT';
      
      // Hit target consistently for ~80ms (5 frames). Faster snap for fluid singing.
      if (this.noteStableFrames >= 5) {
        this.noteStableFrames = 0;

        // Check if the NEXT note in the sequence is identical to the one we just hit
        const nextTargetIndex = this.assessmentIsCorrecting 
          ? this.assessmentCurrentIndex 
          : this.currentNoteSequence[this.assessmentCurrentIndex + 1];
        
        if (nextTargetIndex !== undefined) {
          const nextRatio = ragaNotes[nextTargetIndex].ratio;
          if (nextRatio === targetRatio) {
            // It's a repeated note (e.g. Sa Sa). Require them to break/articulate before hitting the next one!
            this.waitingForArticulation = true;
          }
        }

        this.advanceSequence();
      }
    } else {
      if (isLingering) {
        // Just holding the previous note, don't count as a mistake yet
        return;
      }

      this.noteStableFrames = 0;
      this.mistakeFrames++;
      
      if (difference > 0) this.liveFeedback = 'TOO_HIGH';
      else this.liveFeedback = 'TOO_LOW';

      // Missed target consistently for ~600ms (35 frames). More forgiving for glides and pauses.
      if (this.mistakeFrames >= 35) {
        this.mistakeFrames = 0;
        this.triggerCorrection();
      }
    }
    
    if (this.onFeedbackUpdate) this.onFeedbackUpdate(this.liveFeedback);
  }

  private handleTimbreDetected(register: VocalRegister) {
    if (this.currentState !== 'ASSESSMENT') return;
    this.liveRegister = register;
    if (this.onRegisterUpdate) {
      this.onRegisterUpdate(register);
    }
  }

  private async triggerCorrection() {
    this.pitchTracker.stop(); 
    this.assessmentIsCorrecting = true;
    
    if (this.onSequenceUpdate) {
       this.onSequenceUpdate(this.currentNoteSequence.slice(0, this.assessmentSequenceLength), this.assessmentCurrentIndex, true);
    }
    
    this.isSynthesizing = true;
    if (this.onSynthStateUpdate) this.onSynthStateUpdate(this.isSynthesizing);

    const targetNoteIndex = this.currentNoteSequence[this.assessmentCurrentIndex];
    await this.ragaSynthesizer.playSequence(
      this.currentRaga!, 
      this.baselineSa, 
      [targetNoteIndex], 
      this.synthVoiceModel,
      this.currentTempoMultiplier
    );
    
    this.isSynthesizing = false;
    if (this.onSynthStateUpdate) this.onSynthStateUpdate(this.isSynthesizing);

    this.lastPitchTime = Date.now();
    this.pitchTracker.start();
  }

  private async advanceSequence() {
    this.pitchTracker.stop();
    
    if (this.assessmentIsCorrecting) {
      this.assessmentIsCorrecting = false;
      this.assessmentCurrentIndex = 0; 
    } else {
      this.assessmentCurrentIndex++;
      
      if (this.assessmentCurrentIndex >= this.assessmentSequenceLength) {
        this.assessmentSequenceLength++;
        this.assessmentCurrentIndex = 0; 
        
        if (this.assessmentSequenceLength > this.currentNoteSequence.length) {
          this.finishAssessment();
          return;
        }
      }
    }
    
    if (this.onSequenceUpdate) {
      this.onSequenceUpdate(this.currentNoteSequence.slice(0, this.assessmentSequenceLength), this.assessmentCurrentIndex, false);
    }
    
    this.isSynthesizing = true;
    if (this.onSynthStateUpdate) this.onSynthStateUpdate(this.isSynthesizing);

    if (this.assessmentCurrentIndex === 0) {
      await this.ragaSynthesizer.playSequence(
        this.currentRaga!, 
        this.baselineSa, 
        this.currentNoteSequence.slice(0, this.assessmentSequenceLength), 
        this.synthVoiceModel,
        this.currentTempoMultiplier
      );
    }
    
    this.isSynthesizing = false;
    if (this.onSynthStateUpdate) this.onSynthStateUpdate(this.isSynthesizing);
    
    this.lastPitchTime = Date.now();
    this.pitchTracker.start();
  }

  private startSilenceDetection() {
    if (this.silenceTimeout !== null) window.clearInterval(this.silenceTimeout);
    
    // Check periodically if it's been over 2 seconds since the last pitch was detected
    this.silenceTimeout = window.setInterval(() => {
      if (this.currentState !== 'ASSESSMENT') {
        if (this.silenceTimeout !== null) window.clearInterval(this.silenceTimeout);
        return;
      }
      
      const now = Date.now();
      // If we've gathered some frames but now it's been silent for 2s
      if (now - this.lastPitchTime > 2000 && this.totalFrames > 0) {
        this.finishAssessment();
      }
    }, 500);
  }

  private finishAssessment() {
    if (this.silenceTimeout !== null) window.clearInterval(this.silenceTimeout);
    this.pitchTracker.stop();

    const accuracy = 100;
    this.lastAccuracyScore = accuracy;
    console.log(`[Music Engine] Assessment Finished. Progression Complete!`);

    this.transitionTo('RESULTS');

    // Send payload summary back to Gemini Guru with Agentic System tag
    if (this.geminiWebSocket && this.geminiWebSocket.readyState === WebSocket.OPEN) {
      // Pass both Accuracy and Timbre profile
      const systemReport = `[SYSTEM_REPORT: Assessment Complete. Pitch Accuracy: ${accuracy}%. Last Timbre Profile: ${this.liveRegister}] 
Based on this system report, autonomously decide the user's skill level using [UPDATE_SKILL_LEVEL: level] and give brief verbal feedback/next steps to the user.`;
      
      const msg = {
        clientContent: {
          turns: [{
            role: 'user',
            parts: [{ text: systemReport }]
          }],
          turnComplete: true
        }
      };
      this.geminiWebSocket.send(JSON.stringify(msg));
    }
  }

  public sendConversationalMessage(text: string) {
    if (this.geminiWebSocket && this.geminiWebSocket.readyState === WebSocket.OPEN) {
      console.log(`[VocalCoachController] Sending user speech to Guru: ${text}`);
      const msg = {
        clientContent: {
          turns: [{
            role: 'user',
            parts: [{ text }]
          }],
          turnComplete: true
        }
      };
      this.geminiWebSocket.send(JSON.stringify(msg));
    } else {
      console.warn("[VocalCoachController] Cannot send message: WebSocket not open.");
    }
  }
}
