export function validateNote(sungHz: number, baselineSa: number, allowedRatios: number[]): boolean {
  const calculatedRatio = sungHz / baselineSa;
  
  // Check if calculated ratio is within +/- 1% of any allowed ratio
  for (const ratio of allowedRatios) {
    const minThreshold = ratio * 0.99;
    const maxThreshold = ratio * 1.01;
    
    if (calculatedRatio >= minThreshold && calculatedRatio <= maxThreshold) {
      return true;
    }
  }
  
  return false;
}
