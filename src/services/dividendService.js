import { toFiniteNumber } from '../lib/money.js';
import { requireRecord } from '../lib/supabase.js';
import { nonNegative, required, validDate, validate } from '../lib/validation.js';
import { createCrudService } from './baseService.js';

function payload(input) {
  validate(input, {
    member_id: [required('Member')],
    total_paid_up_share: [nonNegative('Paid-up share')],
    total_shares: [nonNegative('Total shares')],
    estimated_dividend: [nonNegative('Estimated dividend')],
    approved_dividend: [nonNegative('Approved dividend')],
    amount_paid: [nonNegative('Amount paid')],
    date_paid: input.date_paid ? [validDate('Date paid')] : [],
  });
  return { ...input, status: input.status || 'Draft' };
}

const base = createCrudService({ table: 'dividends', validateCreate: payload, dateColumn: 'date_paid', filterMap: { memberId: 'member_id', status: 'status' } });
export const dividendService = {
  ...base,
  async create(input) {
    const member = await requireRecord('members', 'id', input.member_id, 'Member not found.');
    return base.create({
      ...input,
      tin: input.tin || member.tin,
      total_paid_up_share: input.total_paid_up_share ?? member.paid_up_share_capital,
      total_shares: input.total_shares ?? toFiniteNumber(member.shares_subscribed),
    });
  },
};
