import { describe, it, expect } from 'vitest';
import { getCondition, getConditionColorHex, getConditionPalette } from '@/app/lib/conditions';

describe('getCondition', () => {
  it('returns Slippery for values <= 300', () => {
    expect(getCondition(200).name).toBe('Slippery');
    expect(getCondition(300).name).toBe('Slippery');
  });

  it('returns Wet / Damp for 301-330', () => {
    expect(getCondition(301).name).toBe('Wet / Damp');
    expect(getCondition(330).name).toBe('Wet / Damp');
  });

  it('returns Hero Dirt for 331-350', () => {
    expect(getCondition(331).name).toBe('Hero Dirt');
    expect(getCondition(350).name).toBe('Hero Dirt');
  });

  it('returns Dry for 351-400', () => {
    expect(getCondition(351).name).toBe('Dry');
    expect(getCondition(400).name).toBe('Dry');
  });

  it('returns Dusty for values > 400', () => {
    expect(getCondition(401).name).toBe('Dusty');
    expect(getCondition(999).name).toBe('Dusty');
  });

  it('includes a warning for Wet / Damp', () => {
    expect(getCondition(315).warning).toBeDefined();
  });

  it('has no warning for Slippery', () => {
    expect(getCondition(250).warning).toBeUndefined();
  });
});

describe('getConditionColorHex', () => {
  it('returns a hex color string', () => {
    const hex = getConditionColorHex(350);
    expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('matches the condition hex', () => {
    expect(getConditionColorHex(250)).toBe('#f43f5e');
    expect(getConditionColorHex(450)).toBe('#fb923c');
  });
});

describe('getConditionPalette', () => {
  it('returns all 5 condition levels', () => {
    expect(getConditionPalette()).toHaveLength(5);
  });

  it('each entry has required fields', () => {
    for (const c of getConditionPalette()) {
      expect(c.name).toBeDefined();
      expect(c.hexColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(c.tailwindColor).toBeDefined();
      expect(c.rangeLabel).toBeDefined();
    }
  });
});
