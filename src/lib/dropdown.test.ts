import { describe, it, expect } from 'vitest';
import { centerMenuBox } from './dropdown';

describe('centerMenuBox', () => {
  it('centers menu horizontally', () => {
    const box = centerMenuBox(1280, 720, 176, 248);
    expect(box.left).toBe(Math.round((1280 - 176) / 2));
  });

  it('centers menu vertically when it fits', () => {
    const box = centerMenuBox(1280, 720, 176, 248);
    expect(box.top).toBe(Math.round((720 - 248) / 2));
  });

  it('clamps height to 70% of viewport and enables scroll for tall menus', () => {
    const box = centerMenuBox(1280, 720, 176, 600);
    expect(box.maxHeight).toBe(Math.round(720 * 0.7));
    expect(box.top).toBe(Math.round((720 - box.maxHeight) / 2));
  });

  it('does not clamp when menu fits under the 70% limit', () => {
    const box = centerMenuBox(1280, 720, 176, 200);
    expect(box.maxHeight).toBe(Math.round(720 * 0.7));
    expect(box.top).toBe(Math.round((720 - 200) / 2));
  });

  it('keeps menu fully contained on tiny viewports', () => {
    const box = centerMenuBox(200, 100, 300, 248);
    expect(box.top).toBe(8);
    expect(box.maxHeight).toBe(84);
    expect(box.top + box.maxHeight).toBeLessThanOrEqual(100);
  });

  it('limits width to viewport width minus 16px for oversized menus', () => {
    const box = centerMenuBox(100, 400, 300, 100);
    expect(box.maxWidth).toBe(84);
  });

  it('maxHeight respects edge budget even on very short viewports', () => {
    const box = centerMenuBox(1280, 100, 176, 248);
    expect(box.maxHeight).toBe(84);
    expect(box.top + box.maxHeight).toBeLessThanOrEqual(100);
  });

  it('symmetric on mobile viewport', () => {
    const box = centerMenuBox(375, 667, 176, 248);
    expect(box.left).toBe(Math.round((375 - 176) / 2));
    expect(box.top).toBe(Math.round((667 - 248) / 2));
  });

  it('menu exactly at 70% limit is not clamped', () => {
    const box = centerMenuBox(1280, 720, 176, Math.round(720 * 0.7));
    expect(box.maxHeight).toBe(Math.round(720 * 0.7));
    expect(box.top).toBe(Math.round((720 - box.maxHeight) / 2));
  });
});
