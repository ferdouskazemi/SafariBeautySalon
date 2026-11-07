import { SERVICE_COLOR_COUNT } from '@safari/shared';
import { describe, expect, it } from 'vitest';
import { leastUsedColor } from './catalog.service.js';

describe('leastUsedColor', () => {
  it('starts at the first color', () => {
    expect(leastUsedColor([])).toBe(0);
  });

  it('hands out every color once before repeating one', () => {
    const used: number[] = [];
    for (let i = 0; i < SERVICE_COLOR_COUNT; i++) used.push(leastUsedColor(used));
    expect(new Set(used).size).toBe(SERVICE_COLOR_COUNT);
    expect(leastUsedColor(used)).toBe(0);
  });

  it('fills the gap left by a color nobody uses', () => {
    expect(leastUsedColor([0, 1, 3, 4, 5, 6, 7])).toBe(2);
  });
});
