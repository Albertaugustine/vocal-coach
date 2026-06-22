import React, { useEffect, useState } from 'react';
import { VocalCoachController, AppState } from './components/VocalCoachController';
import { Music, VolumeX } from 'lucide-react';
import ConversationalView from './components/ui/ConversationalView';
import AssessmentView from './components/ui/AssessmentView';
import CalibrationView from './components/ui/CalibrationView';

const controller = new VocalCoachController();

export default function App() {
  const [appState, setAppState] = useState<AppState>('CONVERSATIONAL');
  const [shrutiPlaying, setShrutiPlaying] = useState(false);

  useEffect(() => {
    // For this prototype, we'll patch the transitionTo method to trigger a React state re-render
    const originalTransitionTo = controller.transitionTo.bind(controller);
    controller.transitionTo = (newState: AppState, raga: string | null = null) => {
      originalTransitionTo(newState, raga);
      setAppState(newState);
    };

    // Connect to the local Node.js proxy server
    controller.connectToGemini('ws://localhost:8080');
  }, []);

  return (
    <div className="container flex flex-col items-center justify-center" style={{ minHeight: '100vh' }}>
      <header className="text-center relative w-full flex items-center justify-center" style={{ maxWidth: '800px', marginBottom: '3rem', paddingTop: '1rem' }}>
        <div>
          <h1 className="text-4xl text-gold" style={{ marginBottom: '0.5rem' }}>Indian Classical Vocal Coach</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem' }}>AI-Powered Hands-Free Training</p>
        </div>
        
        {/* Shruti Box Toggle Widget */}
        <button 
          onClick={() => {
            controller.toggleShrutiBox();
            setShrutiPlaying(controller.isShrutiBoxPlaying());
          }}
          className={`absolute right-0 flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
            shrutiPlaying ? 'bg-orange bg-opacity-20 text-orange border border-orange' : 'bg-surface text-gray-400 border border-transparent'
          }`}
          title="Toggle Background Shruti Box"
        >
          {shrutiPlaying ? <Music size={18} className="animate-pulse-glow" /> : <VolumeX size={18} />}
          <span className="text-sm font-medium">{shrutiPlaying ? 'Shruti ON' : 'Shruti OFF'}</span>
        </button>
      </header>

      <main className="w-full" style={{ maxWidth: '800px' }}>
        {appState === 'CONVERSATIONAL' && <ConversationalView controller={controller} />}
        {(appState === 'ASSESSMENT' || appState === 'RESULTS') && <AssessmentView controller={controller} />}
        {appState === 'CALIBRATION' && <CalibrationView controller={controller} />}
      </main>
    </div>
  );
}
