import { supabase } from '../supabaseClient.js';

export function assertResult(result, fallback = 'Database request failed.') {
  if (result.error) {
    const error = new Error(result.error.message || fallback);
    error.code = result.error.code;
    error.details = result.error.details;
    throw error;
  }
  return result.data;
}

export async function requireRecord(table, column, value, message) {
  const result = await supabase.from(table).select('*').eq(column, value).maybeSingle();
  const row = assertResult(result);
  if (!row) throw new Error(message || `${table} record was not found.`);
  return row;
}

export function applyDateRange(query, column, filters = {}) {
  let next = query;
  if (filters.from) next = next.gte(column, filters.from);
  if (filters.to) next = next.lte(column, filters.to);
  return next;
}

export function applyEquals(query, filters, mapping) {
  let next = query;
  for (const [filterKey, column] of Object.entries(mapping)) {
    const value = filters?.[filterKey];
    if (value !== undefined && value !== null && value !== '' && value !== 'All') {
      next = next.eq(column, value);
    }
  }
  return next;
}

export { supabase };
