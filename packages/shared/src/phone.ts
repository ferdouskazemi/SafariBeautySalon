const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** Converts Persian and Arabic-Indic digits to ASCII digits. */
export function toLatinDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));
}

/**
 * Normalizes an Afghan mobile number to the local `07XXXXXXXX` form.
 * Accepts `+93`, `0093`, `93` or `0` prefixes, spaces, dashes and Persian digits.
 * Returns `null` when the input is not a valid mobile number.
 */
export function normalizeAfghanPhone(input: string): string | null {
  const compact = toLatinDigits(input).replace(/[\s\-()]/g, '');
  const match = /^(?:\+93|0093|93|0)?(7\d{8})$/.exec(compact);
  return match ? `0${match[1]}` : null;
}
