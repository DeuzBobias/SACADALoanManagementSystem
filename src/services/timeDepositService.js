import { monthsBetween } from '../lib/dates.js';
import { roundMoney, toFiniteNumber } from '../lib/money.js';
import { requireRecord } from '../lib/supabase.js';
import { nonNegative, required, validDate, validate } from '../lib/validation.js';
import { createCrudService } from './baseService.js';

export function computeTimeDepositInterest(input) {
  const principal = toFiniteNumber(input.principal);
  const rate = toFiniteNumber(input.annual_rate, 0.05);
  const months = monthsBetween(input.investment_date, input.maturity_date);
  return roundMoney(principal * rate * (months ? months / 12 : 1));
}

function payload(input) {
  validate(input, {
    member_id: [required('Member')],
    principal: [required('Principal'), nonNegative('Principal')],
    investment_date: [required('Investment date'), validDate('Investment date')],
    maturity_date: input.maturity_date ? [validDate('Maturity date')] : [],
    annual_rate: [nonNegative('Annual rate')],
    converted_amount: [nonNegative('Converted amount')],
  });
  return {
    ...input,
    principal: toFiniteNumber(input.principal),
    annual_rate: toFiniteNumber(input.annual_rate, 0.05),
    earned_interest: input.earned_interest === undefined ? computeTimeDepositInterest(input) : toFiniteNumber(input.earned_interest),
    converted_amount: toFiniteNumber(input.converted_amount),
    status: input.status || 'Active',
  };
}

const base = createCrudService({ table: 'time_deposits', validateCreate: payload, dateColumn: 'investment_date', filterMap: { memberId: 'member_id', status: 'status' } });
export const timeDepositService = {
  ...base,
  async create(input) {
    const member = await requireRecord('members', 'id', input.member_id, 'Member not found.');
    return base.create({ ...input, member_name: input.member_name || member.full_name });
  },
};
