import { isIsoDate } from './dates.js';
import { toFiniteNumber } from './money.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ValidationError extends Error {
  constructor(errors, message = 'Please correct the validation errors.') {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export function validate(input, rules) {
  const errors = {};
  for (const [field, validators] of Object.entries(rules)) {
    for (const validator of validators) {
      const message = validator(input?.[field], input);
      if (message) {
        errors[field] = message;
        break;
      }
    }
  }
  if (Object.keys(errors).length) throw new ValidationError(errors);
  return input;
}

export const required = (label) => (value) =>
  value === null || value === undefined || String(value).trim() === '' ? `${label} is required.` : '';

export const oneOfRequired = (fields, label) => (_, input) =>
  fields.some((field) => String(input?.[field] || '').trim()) ? '' : `${label} is required.`;

export const nonNegative = (label) => (value) =>
  value !== '' && value !== null && value !== undefined && toFiniteNumber(value, Number.NaN) < 0
    ? `${label} cannot be negative.`
    : '';

export const positive = (label) => (value) =>
  toFiniteNumber(value) > 0 ? '' : `${label} must be greater than zero.`;

export const validDate = (label, optional = false) => (value) =>
  optional && !value ? '' : isIsoDate(value) ? '' : `${label} must use YYYY-MM-DD format.`;

export const validUuid = (label, optional = false) => (value) =>
  optional && !value ? '' : UUID_PATTERN.test(String(value || '')) ? '' : `${label} must be a valid UUID.`;

export function cleanText(value) {
  const text = String(value ?? '').trim();
  return text || null;
}
