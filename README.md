# Indian Classical Vocal Coach (Agentic AI)

An open-source, conservatory-level Indian Classical Music vocal coach. This application uses a **Hybrid Intelligence System** that combines zero-latency deterministic digital signal processing (DSP) for pitch accuracy with a conversational Generative AI (Google Gemini) acting as a personalized "Guru" to dictate curriculums and evaluate vocal timbre.

## 🌟 The "Hybrid Intelligence" Architecture
Unlike existing applications that use rigid, hard-coded game logic, this application splits the brain from the engine:
1. **The Math Engine (Frontend):** A lightning-fast, zero-dependency Web Audio API system that handles pitch tracking, continuous drone generation (Shruti Box), and strict mathematical evaluation of microtonal intervals (Swaras).
2. **The Agentic Brain (Backend):** A Node.js WebSocket server running Google's Gemini. The AI has persistent memory of your skill level and acts as a Finite State Machine (FSM) controller—autonomously issuing commands to the frontend to trigger assessments, change tempos, and advance your curriculum.

## ✨ Core Features
*   **Zero-Latency Pitch Tracking:** Uses a highly optimized browser-native Autocorrelation algorithm.
*   **Timbre & Vocal Register Detection:** A custom FFT (Fast Fourier Transform) engine analyzes the ratio between your fundamental frequency ($F_0$) and your higher harmonics to determine if you are singing in a **Chest Voice** (thick/heavy) or **Head Voice** (breathy/light), providing qualitative feedback beyond just pitch.
*   **The Native Shruti Box:** A continuously running background synthesizer that generates a rich harmonic drone (Sa + Pa) for unbreakable pitch anchoring.
*   **Dynamic Agentic Tempo:** The Gemini Guru dynamically controls the speed of your lessons. It will mathematically force you to learn a sequence at a slow 2.0x tempo before allowing you to attempt the standard 1.0x tempo.
*   **Articulation Gating:** An advanced FSM rule that detects repeated notes (e.g., *Jantai Varisais*) and forces the user to physically articulate/break the note rather than allowing them to cheat by holding a continuous pitch.

## 📚 The Curriculum Engine
The application enforces strict traditional pedagogical laws for both Hindustani and Carnatic music across 9 granular difficulty sub-levels (`BEGINNER_1` to `ADVANCED_3`):
*   **Foundation First:** Users are forced to pass *Hold Sa* (Shruti stability) and *Thalam* (Rhythm) tests before learning any melodies.
*   **Authentic Carnatic Path:** Carnatic students are locked out of Ragas until they master the *Sarali Varisais* (basic scales) and *Jantai Varisais* (double notes) mapped to the microtones of *Mayamalavagowla*.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   A Google Gemini API Key

### 1. Setup the Agentic Backend
The backend serves as the WebSocket proxy and memory layer for the Gemini Agent.
```bash
cd server
npm install
# Create a .env file and add your API key:
# GEMINI_API_KEY=your_key_here
node server.js
```
*The WebSocket server will start on `ws://localhost:8080`.*

### 2. Setup the Frontend Engine
The frontend is a lightweight Vite/React application that handles all DSP and Audio generation.
```bash
# In the root project directory
npm install
npm run dev
```

### 3. Permissions
Ensure you are running the application on `localhost` or a secure `https://` domain, otherwise modern browsers will block access to the microphone required for the pitch tracker.

---

## 🛠️ Tech Stack
*   **Frontend:** React, Vite, TailwindCSS, Vanilla Web Audio API
*   **Backend:** Node.js, Express, `ws` (WebSockets)
*   **AI:** `@google/genai` (Gemini 2.5)
