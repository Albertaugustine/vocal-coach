import { describe, it, expect } from 'vitest';
// We are implementing TDD, so the module doesn't exist yet
import { validateNote } from '../src/music-engine/ragaEngine';

describe('validateNote()', () => {
  it('Test 1: returns true if baselineSa is 140 Hz and sungHz is 210 Hz (perfect 1.5 ratio) and 1.5 is allowed', () => {
    // 210 / 140 = 1.5
    const allowedRatios = [1.0, 1.25, 1.5, 1.8];
    const result = validateNote(210, 140, allowedRatios);
    expect(result).toBe(true);
  });

  it('Test 2: returns false if baselineSa is 140 Hz and sungHz is 147 Hz (1.05 ratio) and 1.05 is not in allowedRatios', () => {
    // 147 / 140 = 1.05
    const allowedRatios = [1.0, 1.25, 1.5, 1.8];
    const result = validateNote(147, 140, allowedRatios);
    expect(result).toBe(false);
  });

  it('Test 3: returns true for a sung frequency slightly off the exact ratio but within a +/- 1% threshold (e.g. 209.5 Hz instead of 210 Hz)', () => {
    // Exact perfect fifth (Pa) = 140 * 1.5 = 210 Hz
    // 1% tolerance range around 210 Hz is 207.9 Hz to 212.1 Hz
    // 209.5 Hz falls well within this microtonal error margin.
    const allowedRatios = [1.0, 1.25, 1.5, 1.8];
    const result = validateNote(209.5, 140, allowedRatios);
    expect(result).toBe(true);
  });
});
