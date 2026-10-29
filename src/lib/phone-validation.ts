import { z } from 'zod';
// Accept familiar formatting at the API boundary and store a consistent number.
export const phoneSchema = z
  .string()
  .trim()
  .max(30)
  .regex(/^[+0-9 ()-]+$/, 'Enter a valid phone number')
  .transform((value) => value.replace(/[ ()-]/g, ''))
  .pipe(z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Use 10–15 digits, with an optional +country code'));
export const optionalPhoneSchema = z.union([z.literal(''), phoneSchema]);
