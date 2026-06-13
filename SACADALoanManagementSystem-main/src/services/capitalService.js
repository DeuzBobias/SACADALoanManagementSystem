import { assertResult, requireRecord, supabase } from '../lib/supabase.js';
import { nonNegative, required, validDate, validate } from '../lib/validation.js';
import { nonNegativeMoney, roundMoney } from '../lib/money.js';

const MEMBER_COLUMNS = {
  'Share Capital': 'paid_up_share_capital',
  'Regular Savings': 'regular_savings',
  'Time Deposit': 'time_deposits',
};

function payload(input) {
  validate(input, {
    member_id: [required('Member')],
    transaction_date: [required('Transaction date'), validDate('Transaction date')],
    transaction_type: [required('Transaction type')],
    amount: [required('Amount'), nonNegative('Amount')],
    shares: [nonNegative('Shares')],
  });
  return { ...input, amount: nonNegativeMoney(input.amount, 'Amount'), shares: nonNegativeMoney(input.shares, 'Shares') };
}

export const capitalService = {
  async list(filters = {}) {
    let query = supabase.from('capital_transactions').select('*, members(full_name)').order('transaction_date', { ascending: false });
    if (filters.memberId) query = query.eq('member_id', filters.memberId);
    if (filters.type && filters.type !== 'All') query = query.eq('transaction_type', filters.type);
    if (filters.from) query = query.gte('transaction_date', filters.from);
    if (filters.to) query = query.lte('transaction_date', filters.to);
    return assertResult(await query) || [];
  },
  async create(input) {
    const data = payload(input);
    const member = await requireRecord('members', 'id', data.member_id, 'Member not found.');
    const transaction = assertResult(await supabase.from('capital_transactions').insert(data).select().single());
    const column = MEMBER_COLUMNS[data.transaction_type];
    if (!column) return transaction;
    try {
      const newValue = roundMoney(Number(member[column] || 0) + data.amount);
      assertResult(await supabase.from('members').update({ [column]: newValue, updated_at: new Date().toISOString() }).eq('id', member.id));
      return transaction;
    } catch (error) {
      await supabase.from('capital_transactions').delete().eq('id', transaction.id);
      throw error;
    }
  },
};
