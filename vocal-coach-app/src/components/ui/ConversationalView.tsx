import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles } from 'lucide-react';
import { VocalCoachController } from '../VocalCoachController';

export default function ConversationalView({ controller }: { controller: VocalCoachController }) {
  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef(false);
  const [transcript, setTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [inputText, setInputText] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition && !recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);

        if (finalTranscript) {
          controller.sendConversationalMessage(finalTranscript);
          setTimeout(() => setTranscript(''), 2000);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setErrorMsg(`Mic Error: ${event.error}`);
        if (event.error === 'not-allowed') {
          alert('Microphone access is blocked! Please click the Lock/Microphone icon in your browser URL bar and explicitly allow microphone access.');
        }
        if (event.error !== 'no-speech') {
          setIsListening(false);
          isListeningRef.current = false;
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current && recognitionRef.current) {
          try { recognitionRef.current.start(); } catch (e) {}
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [controller]);

  const toggleListening = () => {
    if (isListening) {
      isListeningRef.current = false;
      setIsListening(false);
      recognitionRef.current?.stop();
    } else {
      isListeningRef.current = true;
      setIsListening(true);
      try { recognitionRef.current?.start(); } catch (e) {}
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      controller.sendConversationalMessage(inputText);
      setInputText('');
      setErrorMsg('');
    }
  };

  // Developer simulation helper to trigger the LLM phrase without needing the real websocket
  const simulateTrigger = () => {
    if ((controller as any).geminiWebSocket?.onmessage) {
      (controller as any).geminiWebSocket.onmessage({ data: '[TRIGGER_SINGING: yaman]' });
    } else {
      controller.transitionTo('ASSESSMENT', 'yaman');
    }
  };

  return (
    <div className="glass-panel p-8 flex flex-col items-center gap-4 animate-pulse-glow">
      <div style={{ background: 'var(--accent-gold)', borderRadius: '50%', padding: '1.5rem', marginBottom: '1rem' }}>
        <Sparkles size={48} color="white" />
      </div>
      <h2 className="text-2xl font-bold">Gemini Guru is {isListening ? 'listening...' : 'sleeping'}</h2>
      <p className="text-center" style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>
        {transcript ? (
          <span style={{ color: 'var(--text-primary)', fontStyle: 'italic' }}>"{transcript}"</span>
        ) : (
          "Speak naturally with the Guru to learn about ragas, theory, and practice techniques."
        )}
      </p>
      
      <div className="mt-8 flex flex-col gap-4 items-center w-full max-w-md">
        <button 
          onClick={toggleListening}
          className="btn-primary flex items-center justify-center gap-4 w-full"
          style={{ background: isListening ? '#ef4444' : 'linear-gradient(135deg, var(--accent-gold), var(--accent-orange))' }}
        >
          {isListening ? <MicOff size={24} /> : <Mic size={24} />}
          {isListening ? 'Stop Mic' : 'Talk to Guru'}
        </button>
        
        {errorMsg && <p className="text-red-500 text-sm mt-2">{errorMsg}</p>}

        <div className="w-full flex items-center gap-2 mt-4 opacity-70">
          <hr className="flex-1 border-[var(--glass-border)]" />
          <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">or type</span>
          <hr className="flex-1 border-[var(--glass-border)]" />
        </div>

        <form onSubmit={handleTextSubmit} className="w-full flex gap-2">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message to the Guru..." 
            className="flex-1 px-4 py-2 rounded-full border border-[var(--glass-border)] bg-[rgba(0,0,0,0.3)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
          />
          <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1.5rem' }}>Send</button>
        </form>

        <button 
          onClick={() => controller.transitionTo('CALIBRATION')}
          className="text-sm mt-4 underline opacity-70 hover:opacity-100 transition-opacity"
        >
          Recalibrate Pitch
        </button>
      </div>

      <div style={{ marginTop: '3rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', width: '100%', textAlign: 'center' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Developer Simulation Tool</p>
        <button 
          onClick={simulateTrigger}
          style={{ background: 'transparent', border: '1px solid var(--accent-orange)', color: 'var(--accent-orange)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', marginTop: '0.5rem' }}
        >
          Simulate Guru Trigger: [TRIGGER_SINGING: yaman]
        </button>
      </div>
    </div>
  );
}
