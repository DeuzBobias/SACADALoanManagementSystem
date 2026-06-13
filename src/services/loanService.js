import { applyDateRange, assertResult, requireRecord, supabase } from '../lib/supabase.js';
import { nonNegative, positive, required, validDate, validate } from '../lib/validation.js';
import { nonNegativeMoney, roundMoney, toFiniteNumber } from '../lib/money.js';

export function computeLoan(input = {}) {
  const loanAmount = nonNegativeMoney(input.loan_amount ?? input.loanAmount, 'Loan amount');
  const loanTerms = Math.trunc(toFiniteNumber(input.loan_terms ?? input.loanTerms));
  if (loanTerms <= 0) throw new Error('Loan terms must be greater than zero.');
  const interestRate = toFiniteNumber(input.interest_rate ?? input.interestRate, 0.12);
  const collectionFeeRate = toFiniteNumber(input.collection_fee_rate ?? input.collectionFeeRate, 0.02);
  const processingFeeRate = toFiniteNumber(input.processing_fee_rate ?? input.processingFeeRate, 0.01);
  const interestAmount = roundMoney(loanAmount * interestRate);
  const collectionFee = roundMoney(loanAmount * collectionFeeRate);
  const processingFee = roundMoney(loanAmount * processingFeeRate);
  const totalPayable = roundMoney(loanAmount + interestAmount + collectionFee);
  return {
    loan_amount: loanAmount,
    loan_terms: loanTerms,
    interest_amount: interestAmount,
    collection_fee: collectionFee,
    processing_fee: processingFee,
    total_payable: totalPayable,
    monthly_payment: roundMoney(totalPayable / loanTerms),
    loan_receivable: totalPayable,
  };
}

export function loanFromDb(row) {
  return {
    id: row.id,
    applicationId: row.id,
    accountNumber: row.voucher_no || row.id,
    voucherNumber: row.voucher_no || '',
    loanYear: row.loan_year || '',
    memberId: row.member_id,
    borrowerName: `${row.surname || ''}, ${row.given_name || ''} ${row.middle_name || ''}`.trim(),
    tin: row.tin || '',
    originalAmount: toFiniteNumber(row.loan_amount),
    totalPayable: toFiniteNumber(row.total_payable),
    remainingBalance: toFiniteNumber(row.loan_receivable),
    monthlyAmortization: row.loan_terms ? roundMoney(toFiniteNumber(row.total_payable) / toFiniteNumber(row.loan_terms)) : 0,
    loanPayments: toFiniteNumber(row.loan_payments),
    penalties: toFiniteNumber(row.penalty_collected),
    termMonths: toFiniteNumber(row.loan_terms),
    releaseDate: row.loan_released || '',
    nextDueDate: row.loan_released || '',
    lastPaymentDate: '',
    paidMonths: row.loan_terms ? Math.floor(toFiniteNumber(row.loan_payments) / (toFiniteNumber(row.total_payable) / toFiniteNumber(row.loan_terms))) : 0,
    status: row.status || 'Active',
    remarks: '',
    raw: row,
  };
}

function validateLoan(input) {
  validate(input, {
    member_id: [required('Member')],
    loan_amount: [required('Loan amount'), positive('Loan amount')],
    loan_terms: [required('Loan terms'), positive('Loan terms')],
    loan_released: ['Active', 'Released', 'Delinquent'].includes(input.status || 'Active') ? [required('Loan release date'), validDate('Loan release date')] : input.loan_released ? [validDate('Loan release date')] : [],
    interest_amount: [nonNegative('Interest amount')],
    collection_fee: [nonNegative('Collection fee')],
    processing_fee: [nonNegative('Processing fee')],
  });
}

export const loanService = {
  async list(filters = {}) {
    let query = supabase.from('loans').select('*').order('created_at', { ascending: false });
    if (filters.status && filters.status !== 'All') query = query.eq('status', filters.status);
    if (filters.memberId) query = query.eq('member_id', filters.memberId);
    if (filters.search) {
      const term = String(filters.search).trim().replaceAll(',', ' ');
      query = query.or(`surname.ilike.%${term}%,given_name.ilike.%${term}%,tin.ilike.%${term}%,voucher_no.ilike.%${term}%,loan_year.ilike.%${term}%,status.ilike.%${term}%`);
    }
    query = applyDateRange(query, 'loan_released', filters);
    return assertResult(await query) || [];
  },
  async get(id) {
    const row = assertResult(await supabase.from('loans').select('*').eq('id', id).maybeSingle());
    if (!row) throw new Error('Loan not found.');
    return row;
  },
  async create(input) {
    const member = await requireRecord('members', 'id', input.member_id, 'Member not found.');
    const computed = computeLoan(input);
    const payload = {
      member_id: member.id,
      voucher_no: input.voucher_no || null,
      loan_year: input.loan_year || (input.loan_released || '').slice(0, 4) || null,
      surname: member.surname,
      given_name: member.given_name,
      middle_name: member.middle_name,
      tin: member.tin,
      ...computed,
      loan_released: input.loan_released || null,
      loan_payments: 0,
      penalty_collected: 0,
      status: input.status || 'Active',
    };
    delete payload.monthly_payment;
    validateLoan(payload);
    return assertResult(await supabase.from('loans').insert(payload).select().single());
  },
  async update(id, input) {
    const current = await this.get(id);
    const memberId = input.member_id || current.member_id;
    const member = await requireRecord('members', 'id', memberId, 'Member not found.');
    const base = { ...current, ...input, member_id: memberId };
    const computed = computeLoan(base);
    const loanPayments = nonNegativeMoney(base.loan_payments, 'Loan payments');
    const payload = {
      ...input,
      member_id: member.id,
      surname: member.surname,
      given_name: member.given_name,
      middle_name: member.middle_name,
      tin: member.tin,
      ...computed,
      loan_payments: loanPayments,
      loan_receivable: roundMoney(Math.max(computed.total_payable - loanPayments, 0)),
    };
    delete payload.monthly_payment;
    delete payload.interest_rate;
    delete payload.interestRate;
    delete payload.collection_fee_rate;
    delete payload.collectionFeeRate;
    delete payload.processing_fee_rate;
    delete payload.processingFeeRate;
    payload.status = payload.loan_receivable === 0 ? 'Paid' : (input.status || current.status || 'Active');
    validateLoan(payload);
    return assertResult(await supabase.from('loans').update(payload).eq('id', id).select().single());
  },
};
