import { assertResult, supabase } from '../lib/supabase.js';
import { cleanText, nonNegative, oneOfRequired, required, validDate, validate } from '../lib/validation.js';
import { toFiniteNumber } from '../lib/money.js';

const numericFields = [
  'shares_subscribed', 'amount_subscribed', 'paid_up_share_capital', 'regular_savings',
  'time_deposits', 'accounts_receivable', 'years_in_service', 'estimated_monthly_income',
];

function memberPayload(input, partial = false) {
  validate(input, {
    id: partial ? [] : [required('Member ID')],
    surname: [oneOfRequired(['surname', 'given_name'], 'Surname or given name')],
    date_accepted: input.date_accepted ? [validDate('Date accepted')] : [],
    birthdate: input.birthdate ? [validDate('Birthdate')] : [],
    employment_date: input.employment_date ? [validDate('Employment date')] : [],
    ...Object.fromEntries(numericFields.map((field) => [field, [nonNegative(field.replaceAll('_', ' '))]])),
  });
  const payload = { ...input };
  for (const field of numericFields) if (field in payload) payload[field] = toFiniteNumber(payload[field]);
  for (const [key, value] of Object.entries(payload)) {
    if (!numericFields.includes(key) && key !== 'extra_data' && typeof value === 'string') payload[key] = cleanText(value);
  }
  if (!partial) payload.membership_status = payload.membership_status || 'Active';
  return payload;
}

function applyMemberSearch(query, search) {
  const term = String(search || '').trim().replaceAll(',', ' ');
  if (!term) return query;
  return query.or(`id.ilike.%${term}%,full_name.ilike.%${term}%,tin.ilike.%${term}%,barangay.ilike.%${term}%,municipality.ilike.%${term}%,mobile.ilike.%${term}%`);
}

export const memberService = {
  async list(filters = {}) {
    let query = supabase.from('members').select('*').order('created_at', { ascending: false });
    query = applyMemberSearch(query, filters.search);
    if (filters.status && filters.status !== 'All') query = query.eq('membership_status', filters.status);
    return assertResult(await query) || [];
  },
  async get(id) {
    const row = assertResult(await supabase.from('members').select('*').eq('id', id).maybeSingle());
    if (!row) throw new Error('Member not found.');
    return row;
  },
  async create(input) {
    return assertResult(await supabase.from('members').insert(memberPayload(input)).select().single());
  },
  async update(id, input) {
    await this.get(id);
    const payload = memberPayload({ ...input, id }, true);
    delete payload.id;
    payload.updated_at = new Date().toISOString();
    return assertResult(await supabase.from('members').update(payload).eq('id', id).select().single());
  },
  async upsert(input) {
    const payload = memberPayload(input);
    return assertResult(await supabase.from('members').upsert(payload, { onConflict: 'id' }).select().single());
  },
};
