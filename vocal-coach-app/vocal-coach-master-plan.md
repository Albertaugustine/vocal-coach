# Comprehensive Master Plan: AI-Powered Indian Classical Vocal Coach Web App

This document serves as the absolute source of truth and comprehensive blueprint for building the hands-free Indian Classical (Hindustani and Carnatic) Vocal Training Web Application. 

---

## 1. Core Architectural Strategy & Principles

### Core Differentiator vs. Traditional Apps
Unlike existing apps like 'Carnatic Singer' that rely on static, hardcoded song lists and rigid grading, our application is a **Hybrid Intelligence System**. We use deterministic browser-native math ratios for strict, zero-latency pitch validation, while our UI layer is driven by a conversational Agentic AI. This allows us to deliver human-like, adaptive qualitative feedback, contextual music theory explanations, and infinitely customizable raga syllabi tailored to the user's real-time performance.

To maintain high performance, low latency, and cost efficiency, the application strictly separates conversational AI capabilities from musical evaluation logic. **LLMs cannot natively compute mathematical audio pitch.**

### The Finite State Machine (FSM)
The application operates as a two-state engine controlled programmatically:

1. **`CONVERSATIONAL` Mode (The Guru Loop)**
   * **Behavior:** The user and the Gemini Guru converse naturally.
   * **Tech:** Continuous audio streaming via WebRTC/Web Audio API to Gemini's multimodal audio endpoints (or Speech-to-Text translation).
   * **Pitch Status:** **Completely Disabled.** No pitch calculation occurs to conserve bandwidth and CPU.

2. **`ASSESSMENT` Mode (The Singing Test)**
   * **Behavior:** Triggered hands-free when the Guru prompts the user to sing. 
   * **Tech:** The conversational audio stream is paused. The microphone routing shifts to a local browser-side deterministic math engine.
   * **Pitch Status:** **Active.** Processes pitch frequencies relative to a fixed base drone, logs accuracy data, and passes a tiny text summary back to the Gemini Guru.

---

## 2. Target Workspace Directory Structure

Maintain this strict separation of concerns within the Antigravity workspace to prevent sub-agents from cross-contaminating logic:

/vocal-coach-app├── /src│    ├── /components│    │    └── VocalCoachController.ts  <-- Manages FSM states│    ├── /audio│    │    └── pitchTracker.ts          <-- Web Audio API capture logic│    └── /music-engine│         ├── ragaEngine.ts            <-- Relative pitch validation math│         └── ragaScales.ts            <-- Swara interval ratios database└── /tests└── ragaEngine.test.ts            <-- Guardrail unit tests
---

## 3. Mathematical Foundations: The Shruti Paradigm

Unlike Western music theory (fixed equal temperament where A4 = 440 Hz), Indian Classical music is entirely relative to a moving reference baseline drone called the **Shruti (Tonic / Sa)**. 

### Core Mathematical Logic
1. **Calibration:** The user calibrates their absolute baseline frequency $Sa$ (e.g., $140\text{ Hz}$).
2. **Relative Ratio Extraction:** Every incoming frequency ($SungHz$) is divided by the baseline $Sa$.
$$\text{Relative Ratio} = \frac{\text{SungHz}}{\text{BaselineSa}}$$
3. **Interval Matching:** The extracted ratio is compared against structural mathematical arrays defined for specific Hindustani or Carnatic ragas.

---

## 4. Implemented Source Code Modules

### A. Music Database Configuration (`/src/music-engine/ragaScales.ts`)
Stores the exact mathematical structural frequency ratios for initial ragas.

```typescript
export interface RagaProfile {
  name: string;
  system: 'Hindustani' | 'Carnatic';
  allowedRatios: number[];
  swaraNames: string[];
}

export const RAGA_DATABASE: Record<string, RagaProfile> = {
  yaman: {
    name: "Raga Yaman",
    system: "Hindustani",
    allowedRatios: [1.0, 1.125, 1.25, 1.4238, 1.5, 1.6875, 1.875],
    swaraNames: ["Sa", "Re", "Ga", "Ma(Teevra)", "Pa", "Dha", "Ni"]
  },
  mayamalavagowla: {
    name: "Raga Mayamalavagowla",
    system: "Carnatic",
    allowedRatios: [1.0, 1.0667, 1.25, 1.3333, 1.5, 1.6, 1.875],
    swaraNames: ["Sa", "Ri(Shuddha)", "Ga(Antara)", "Ma(Shuddha)", "Pa", "Dha(Shuddha)", "Ni(Kakali)"]
  }
};
B. Validation Math Engine (/src/music-engine/ragaEngine.ts)Processes human performance data and incorporates a $\pm1\%$ microtonal tolerance threshold to comfortably account for vocal variance and natural vocal delivery (gamakas).TypeScriptexport function validateNote(sungHz: number, baselineSa: number, allowedRatios: number[]): boolean {
  if (baselineSa <= 0 || sungHz <= 0) return false;
  
  const currentRatio = sungHz / baselineSa;
  const tolerance = 0.01; // 1% microtonal tolerance safety margin

  return allowedRatios.some(allowedRatio => {
    return Math.abs(currentRatio - allowedRatio) <= tolerance;
  });
}
C. The Guardrail Test Suite (/tests/ragaEngine.test.ts)Acts as the automated safety mesh. Ensure any modifications or additions pass these rules continuously to avoid regression bugs.TypeScriptimport { describe, test, expect } from 'vitest';
import { validateNote } from '../src/music-engine/ragaEngine';
import { RAGA_DATABASE } from '../src/music-engine/ragaScales';

describe('Indian Classical Music Pitch Engine Tests', () => {
  const maleSa = 140; // 140Hz reference baseline

  test('Should pass for perfect Panchamam (Pa) pitch ratio (1.5)', () => {
    const perfectPa = 210; // 140 * 1.5 = 210Hz
    const result = validateNote(perfectPa, maleSa, RAGA_DATABASE.yaman.allowedRatios);
    expect(result).toBe(true);
  });

  test('Should reject a forbidden note scale interval', () => {
    const forbiddenHz = 147; // 147 / 140 = 1.05 (Not in Yaman or Mayamalavagowla)
    const result = validateNote(forbiddenHz, maleSa, RAGA_DATABASE.yaman.allowedRatios);
    expect(result).toBe(false);
  });

  test('Should accept note within 1% microtonal tolerance threshold', () => {
    const slightlySharpPa = 211.3; // 211.3 / 140 = 1.509 (Within 1% of 1.5)
    const result = validateNote(slightlySharpPa, maleSa, RAGA_DATABASE.yaman.allowedRatios);
    expect(result).toBe(true);
  });
});
D. State Controller Boilerplate (/src/components/VocalCoachController.ts)Controls the application state context transitions.TypeScriptexport type AppState = 'CONVERSATIONAL' | 'ASSESSMENT';

export class VocalCoachController {
  private currentState: AppState = 'CONVERSATIONAL';
  private currentRaga: string | null = null;

  public transitionTo(newState: AppState, raga: string | null = null) {
    this.currentState = newState;
    this.currentRaga = raga;
    console.log(`[State Transition]: Shifted to ${newState} ${raga ? `for ${raga}` : ''}`);
    
    if (newState === 'CONVERSATIONAL') {
      this.startVoiceInteraction();
    } else {
      this.triggerPitchAssessment();
    }
  }

  private startVoiceInteraction() {
    console.log("Streaming voice interaction loop with Gemini Guru active.");
  }

  private triggerPitchAssessment() {
    console.log(`Pitch matching algorithm listening against database intervals for: ${this.currentRaga}`);
  }
}

---

## 5. Future Roadmap & Expansions

As the core FSM and Agentic Curriculum Engine are now stable, future development should focus on deep immersion and personalization:

1. **Realistic Voice Synthesis (TTS):** 
   Replace the text-based conversational UI with a low-latency, emotive Text-to-Speech (TTS) engine (e.g., ElevenLabs or open-source CosyVoice). The Guru should actually *speak* the theory and conversational elements, creating a true hands-free vocal lesson.
2. **Generative Visual Avatar:**
   Integrate a dynamic visual avatar of the Guru. Using AI generation, the user could define the "imagination" of their teacher (e.g., "A wise old classical master from Varanasi" or "A modern Carnatic singer"). This avatar could be animated using WebGL/Three.js or a lip-syncing API to match the TTS audio, completely gamifying and personalizing the educational experience.