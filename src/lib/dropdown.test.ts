import { describe, it, expect } from 'vitest';
import { shouldFlipUp } from './dropdown';

describe('shouldFlipUp', () => {
  it('returns false when menu fits below trigger', () => {
    expect(shouldFlipUp(400, 240, 720)).toBe(false);
  });

  it('returns true when menu overflows viewport bottom', () => {
    expect(shouldFlipUp(600, 240, 720)).toBe(true);
  });

  it('returns true when menu bottom touches viewport edge', () => {
    expect(shouldFlipUp(480, 240, 720)).toBe(true);
  });

  it('accounts for the 4px gap: fits with margin at 475', () => {
    expect(shouldFlipUp(475, 240, 720)).toBe(false);
  });

  it('accounts for the 4px gap: clips by 1px at 476', () => {
    expect(shouldFlipUp(476, 240, 720)).toBe(true);
  });

  it('returns false when viewport is large enough', () => {
    expect(shouldFlipUp(700, 300, 1200)).toBe(false);
  });

  it('returns true when menu is taller than the whole viewport', () => {
    expect(shouldFlipUp(100, 900, 720)).toBe(true);
  });

  it('returns false for trigger at very top of viewport', () => {
    expect(shouldFlipUp(50, 200, 720)).toBe(false);
  });
});
