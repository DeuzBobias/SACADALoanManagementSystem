import { requireRecord } from '../lib/supabase.js';
import { nonNegative, required, validDate, validate } from '../lib/validation.js';
import { createCrudService } from './baseService.js';

function payload(input) {
  validate(input, {
    member_id: [required('Member')],
    accounts_receivable: [nonNegative('Accounts receivable')],
    estimated_collected_loan_interest: [nonNegative('Collected loan interest')],
    approved_refund: [nonNegative('Approved refund')],
    amount_paid: [nonNegative('Amount paid')],
    date_shared: input.date_shared ? [validDate('Date shared')] : [],
  });
  return { ...input, status: input.status || 'Draft' };
}

const base = createCrudService({ table: 'patronage', validateCreate: payload, dateColumn: 'date_shared', filterMap: { memberId: 'member_id', status: 'status' } });
export const patronageService = {
  ...base,
  async create(input) {
    const member = await requireRecord('members', 'id', input.member_id, 'Member not found.');
    return base.create({ ...input, tin: input.tin || member.tin, accounts_receivable: input.accounts_receivable ?? member.accounts_receivable });
  },
};
