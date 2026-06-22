import React, { useEffect, useState } from 'react';
import { Activity, Music, Volume2 } from 'lucide-react';
import { VocalCoachController } from '../VocalCoachController';
import { RAGA_DATABASE } from '../../music-engine/ragaScales';
import { VocalRegister } from '../../audio/timbreEngine';

export default function AssessmentView({ controller }: { controller: VocalCoachController }) {
  const ragaId = (controller as any).currentRaga as string;
  const ragaData = RAGA_DATABASE[ragaId];

  const [pitch, setPitch] = useState<number>(0);
  const [isSynthesizing, setIsSynthesizing] = useState(controller.isSynthesizing);
  const [feedback, setFeedback] = useState<string | null>(controller.liveFeedback);
  const [register, setRegister] = useState<VocalRegister>(controller.liveRegister);
  
  const [sequence, setSequence] = useState<number[]>(controller.currentNoteSequence.slice(0, controller.assessmentSequenceLength));
  const [currentIndex, setCurrentIndex] = useState<number>(controller.assessmentCurrentIndex);
  const [isCorrecting, setIsCorrecting] = useState<boolean>(controller.assessmentIsCorrecting);

  useEffect(() => {
    controller.onSynthStateUpdate = (state: boolean) => {
      setIsSynthesizing(state);
    };

    controller.onPitchUpdate = (frequency: number) => {
      setPitch(frequency);
    };
    
    controller.onFeedbackUpdate = (status: string) => {
      setFeedback(status);
    };
    
    controller.onSequenceUpdate = (seq: number[], idx: number, correcting: boolean) => {
      setSequence(seq);
      setCurrentIndex(idx);
      setIsCorrecting(correcting);
    };

    controller.onRegisterUpdate = (reg: VocalRegister) => {
      setRegister(reg);
    };

    return () => {
      controller.onPitchUpdate = undefined;
      controller.onSynthStateUpdate = undefined;
      controller.onFeedbackUpdate = undefined;
      controller.onSequenceUpdate = undefined;
      controller.onRegisterUpdate = undefined;
    };
  }, [controller]);

  return (
    <div className="glass-panel p-8 flex flex-col items-center gap-4">
      <div style={{ background: 'var(--accent-orange)', borderRadius: '50%', padding: '1.5rem', marginBottom: '1rem' }}>
        <Music size={48} color="white" />
      </div>
      
      <h2 className="text-2xl font-bold">Assessment Mode</h2>
      <p className="text-center" style={{ color: 'var(--text-secondary)' }}>
        Currently validating pitch for: <span className="text-gold font-bold">{ragaData ? ragaData.name : 'Unknown Raga'}</span>
      </p>
      
      {controller.currentState === 'RESULTS' ? (
        <div className="mt-8 flex flex-col items-center" style={{ background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: '1rem', width: '100%' }}>
          <Activity size={48} className="text-gold" style={{ marginBottom: '1rem' }} />
          <p className="text-2xl text-gold" style={{ marginBottom: '0.5rem' }}>Progression Complete!</p>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>You successfully mastered the scale sequence.</p>
          <p className="text-4xl text-orange" style={{ marginBottom: '1rem', marginTop: '1rem' }}>✓</p>
          <button 
            onClick={() => controller.transitionTo('CONVERSATIONAL')}
            className="btn-primary mt-8"
          >
            Return to Guru
          </button>
        </div>
      ) : isSynthesizing ? (
        <div className="mt-8 flex flex-col items-center" style={{ background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: '1rem', width: '100%' }}>
          <Volume2 size={48} className="text-orange animate-pulse-glow" style={{ marginBottom: '1rem' }} />
          <p className="text-2xl text-gold" style={{ marginBottom: '0.5rem' }}>Listen closely...</p>
          <p style={{ color: 'var(--text-secondary)' }}>The Guru is singing the target sequence</p>
          <div className="flex gap-2 mt-4 flex-wrap justify-center">
             {sequence.map((noteIdx, i) => (
                <div key={i} className={`px-4 py-2 rounded-lg font-bold ${i === currentIndex && isCorrecting ? 'bg-red-500 text-white' : 'bg-[rgba(255,255,255,0.1)] text-white'}`}>
                   {ragaData?.notes[noteIdx]?.name.split(' ')[0]}
                </div>
             ))}
          </div>
        </div>
      ) : (
        <div className="mt-8 flex flex-col items-center w-full max-w-2xl" style={{ background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: '1rem' }}>
          
          {isCorrecting && (
             <div className="mb-6 w-full text-center p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p className="text-red-400 font-bold uppercase tracking-wider">Mistake Detected</p>
                <p className="text-white text-sm">Please sing the isolated note below to correct your pitch.</p>
             </div>
          )}

          <p style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
             {isCorrecting ? 'Sing Isolated Note' : `Sing Sequence (Level ${sequence.length})`}
          </p>

          <div className="flex gap-3 mb-8 flex-wrap justify-center">
            {isCorrecting ? (
               <div className="px-6 py-4 rounded-xl font-bold bg-red-500/80 text-white border-2 border-red-300 transform scale-110 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                  {ragaData?.notes[sequence[currentIndex]]?.name}
               </div>
            ) : (
               sequence.map((noteIdx, i) => {
                  let statusClass = "bg-[rgba(255,255,255,0.05)] text-gray-400 border border-[var(--glass-border)]";
                  if (i < currentIndex) statusClass = "bg-green-500/20 text-green-400 border border-green-500/50"; // Passed
                  if (i === currentIndex) statusClass = "bg-[var(--accent-orange)] text-white border border-gold transform scale-110 shadow-[0_0_10px_rgba(234,88,12,0.5)]"; // Current
                  
                  return (
                    <div key={i} className={`px-4 py-3 rounded-lg font-bold transition-all duration-300 ${statusClass}`}>
                       {ragaData?.notes[noteIdx]?.name.split(' ')[0]}
                    </div>
                  );
               })
            )}
          </div>

          <div className="flex items-center gap-8 w-full justify-center">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">Live Frequency</p>
              <p className="text-3xl text-gold font-mono">{pitch.toFixed(1)} Hz</p>
            </div>

            <div className="text-center border-l border-r border-[var(--glass-border)] px-8">
              <p className="text-sm text-gray-400 mb-1">Vocal Register</p>
              <p className="text-xl font-bold" style={{ color: register === 'HEAD' ? '#60a5fa' : register === 'CHEST' ? '#f87171' : 'var(--text-secondary)' }}>
                {register === 'HEAD' ? '🗣️ Head Voice' : register === 'CHEST' ? '🫁 Chest Voice' : 'Detecting...'}
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">Target Feedback</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: feedback === 'PERFECT' ? '#22c55e' : '#ef4444' }}>
                {feedback === 'TOO_HIGH' ? '↓ Too High' : feedback === 'TOO_LOW' ? '↑ Too Low' : feedback === 'PERFECT' ? '✓ Perfect' : 'Listening...'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', width: '100%', textAlign: 'center' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Developer Simulation Tool</p>
        <button 
          onClick={() => controller.transitionTo('CONVERSATIONAL')}
          style={{ background: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-secondary)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', marginTop: '0.5rem' }}
        >
          Force Cancel Assessment
        </button>
      </div>
    </div>
  );
}
