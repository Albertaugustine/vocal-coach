import React, { useEffect, useState } from 'react';
import { Settings, Mic } from 'lucide-react';
import { VocalCoachController } from '../VocalCoachController';

export default function CalibrationView({ controller }: { controller: VocalCoachController }) {
  const [pitch, setPitch] = useState<number>(0);

  useEffect(() => {
    controller.onPitchUpdate = (frequency: number) => {
      setPitch(frequency);
    };

    return () => {
      controller.onPitchUpdate = null;
    };
  }, [controller]);

  return (
    <div className="glass-panel p-8 flex flex-col items-center gap-4">
      <div style={{ background: 'var(--accent-gold)', borderRadius: '50%', padding: '1.5rem', marginBottom: '1rem' }}>
        <Settings size={48} color="white" />
      </div>
      
      <h2 className="text-2xl font-bold">Baseline Calibration</h2>
      <p className="text-center" style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>
        Sing your most comfortable base note ("Sa") continuously into the microphone. We will capture and average your pitch.
      </p>
      
      <div className="mt-8 flex flex-col items-center" style={{ background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: '1rem', width: '100%' }}>
        <Mic size={32} className="text-gold animate-pulse-glow" style={{ marginBottom: '1rem' }} />
        <p style={{ fontSize: '1.25rem' }}>Live Frequency</p>
        <p className="text-4xl text-gold">{pitch.toFixed(1)} Hz</p>
      </div>

      <div className="mt-8 w-full flex justify-center">
        <button 
          onClick={() => controller.finishCalibration()}
          className="btn-primary"
        >
          Lock Base Pitch
        </button>
      </div>
    </div>
  );
}
