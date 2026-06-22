export type VocalRegister = 'CHEST' | 'HEAD' | 'UNKNOWN';

/**
 * Analyzes the FFT frequency data to determine if the user is singing
 * in Chest Voice (modal register) or Head Voice (falsetto).
 * 
 * Uses Harmonic Energy Ratio:
 * - Head Voice: Fundamental frequency (F0) dominates heavily.
 * - Chest Voice: Upper harmonics (H2, H3) have significant acoustic energy.
 */
export function analyzeVocalRegister(
  analyser: AnalyserNode, 
  fundamentalFreq: number, 
  sampleRate: number
): VocalRegister {
  const buffer = new Float32Array(analyser.frequencyBinCount);
  analyser.getFloatFrequencyData(buffer); // dB values
  
  const nyquist = sampleRate / 2;
  const binWidth = nyquist / buffer.length;

  // Helper: Get linear power at a specific frequency (summing surrounding bins slightly)
  const getPowerAtFreqWindow = (freq: number) => {
    const centerBin = Math.round(freq / binWidth);
    let power = 0;
    
    // Look at center bin and adjacent bins to capture the peak accurately
    const startBin = Math.max(0, centerBin - 1);
    const endBin = Math.min(buffer.length - 1, centerBin + 1);
    
    for (let i = startBin; i <= endBin; i++) {
       const db = buffer[i];
       // Filter out absolute silence/noise floor
       if (db > -100) {
         // Convert dB to linear amplitude
         const linear = Math.pow(10, db / 20);
         power += linear;
       }
    }
    return power;
  };

  const h1Power = getPowerAtFreqWindow(fundamentalFreq);
  const h2Power = getPowerAtFreqWindow(fundamentalFreq * 2);
  const h3Power = getPowerAtFreqWindow(fundamentalFreq * 3);

  // If signal is too weak, we can't reliably determine register
  if (h1Power < 0.0001) return 'UNKNOWN';

  const harmonicsPower = h2Power + h3Power;
  
  // Ratio of Fundamental energy vs Upper Harmonic energy
  const ratio = h1Power / (harmonicsPower + 0.00001); // Prevent div by zero

  // The ratio threshold. Head voice is heavily dominated by H1.
  // A ratio > 3.0 means H1 is 3x louder than H2+H3 combined -> Head Voice.
  if (ratio > 3.0) {
    return 'HEAD';
  } else {
    return 'CHEST';
  }
}
