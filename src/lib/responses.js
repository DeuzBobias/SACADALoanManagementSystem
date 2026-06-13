import { ValidationError } from './validation.js';

export function success(data, message = 'Request completed successfully.') {
  return { success: true, data, message, errors: {} };
}

export function failure(message, errors = {}) {
  return { success: false, data: null, message, errors };
}

export function normalizeError(error, fallback = 'The request could not be completed.') {
  if (error instanceof ValidationError) return failure(error.message, error.errors);
  return failure(error?.message || fallback, error?.errors || {});
}

export async function respond(operation, successMessage) {
  try {
    return success(await operation(), successMessage);
  } catch (error) {
    return normalizeError(error);
  }
}
