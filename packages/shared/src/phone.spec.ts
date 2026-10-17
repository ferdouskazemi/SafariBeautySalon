import { describe, expect, it } from 'vitest';
import { normalizeAfghanPhone, toLatinDigits } from './phone.js';

describe('toLatinDigits', () => {
  it('converts Persian and Arabic digits', () => {
    expect(toLatinDigits('۰۷۹۹')).toBe('0799');
    expect(toLatinDigits('٠٧٩٩')).toBe('0799');
  });
});

describe('normalizeAfghanPhone', () => {
  it.each([
    ['0799123456', '0799123456'],
    ['+93799123456', '0799123456'],
    ['0093 799 123 456', '0799123456'],
    ['۰۷۹۹-۱۲۳-۴۵۶', '0799123456'],
    ['799123456', '0799123456'],
  ])('normalizes %s', (input, expected) => {
    expect(normalizeAfghanPhone(input)).toBe(expected);
  });

  it.each(['0599123456', '07991234', '+98912123456', 'abc'])('rejects %s', (input) => {
    expect(normalizeAfghanPhone(input)).toBeNull();
  });
});
