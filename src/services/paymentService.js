import { assertResult, requireRecord, supabase } from '../lib/supabase.js';
import { nonNegative, required, validDate, validUuid, validate } from '../lib/validation.js';
import { nonNegativeMoney, roundMoney, sumMoney } from '../lib/money.js';

export function paymentFromDb(row, loan) {
  return {
    id: row.id,
    date: row.payment_date,
    borrower: loan ? `${loan.surname || ''}, ${loan.given_name || ''} ${loan.middle_name || ''}`.trim() : '',
    memberId: row.member_id,
    loanId: row.loan_id,
    loanAccount: loan?.voucher_no || row.loan_id,
    amountPaid: Number(row.amount_paid || 0),
    penalty: Number(row.penalty || 0),
    paymentMethod: row.payment_method || '',
    orNumber: row.or_number || '',
    encodedBy: row.encoded_by || '',
    remarks: row.remarks || '',
    raw: row,
  };
}

export async function recomputeLoanAfterPayments(loanId) {
  const loan = await requireRecord('loans', 'id', loanId, 'Loan not found.');
  const payments = assertResult(await supabase.from('payments').select('amount_paid,penalty').eq('loan_id', loanId)) || [];
  const loanPayments = sumMoney(payments, 'amount_paid');
  const penaltyCollected = sumMoney(payments, 'penalty');
  const loanReceivable = roundMoney(Math.max(Number(loan.total_payable || 0) - loanPayments, 0));
  const status = loanReceivable === 0 ? 'Paid' : loan.status === 'Delinquent' ? 'Delinquent' : 'Active';
  return assertResult(await supabase.from('loans').update({
    loan_payments: loanPayments,
    penalty_collected: penaltyCollected,
    loan_receivable: loanReceivable,
    status,
  }).eq('id', loanId).select().single());
}

function paymentPayload(input) {
  validate(input, {
    loan_id: [required('Loan'), validUuid('Loan')],
    member_id: [required('Member')],
    payment_date: [required('Payment date'), validDate('Payment date')],
    amount_paid: [required('Amount paid'), nonNegative('Amount paid')],
    penalty: [nonNegative('Penalty')],
  });
  return {
    loan_id: input.loan_id,
    member_id: input.member_id,
    payment_date: input.payment_date,
    amount_paid: nonNegativeMoney(input.amount_paid, 'Amount paid'),
    penalty: nonNegativeMoney(input.penalty, 'Penalty'),
    payment_method: input.payment_method || null,
    or_number: input.or_number || null,
    encoded_by: input.encoded_by || null,
    remarks: input.remarks || null,
  };
}

export const paymentService = {
  async list(filters = {}) {
    let query = supabase.from('payments').select('*, loans(*)').order('payment_date', { ascending: false });
    if (filters.loanId) query = query.eq('loan_id', filters.loanId);
    if (filters.memberId) query = query.eq('member_id', filters.memberId);
    if (filters.method && filters.method !== 'All') query = query.eq('payment_method', filters.method);
    if (filters.from) query = query.gte('payment_date', filters.from);
    if (filters.to) query = query.lte('payment_date', filters.to);
    if (filters.search) query = query.ilike('or_number', `%${String(filters.search).trim()}%`);
    return assertResult(await query) || [];
  },
  async create(input) {
    const payload = paymentPayload(input);
    const loan = await requireRecord('loans', 'id', payload.loan_id, 'Loan not found.');
    if (loan.member_id !== payload.member_id) throw new Error('Payment member does not match the loan member.');
    await requireRecord('members', 'id', payload.member_id, 'Member not found.');
    const payment = assertResult(await supabase.from('payments').insert(payload).select().single());
    try {
      const updatedLoan = await recomputeLoanAfterPayments(payload.loan_id);
      return { payment, loan: updatedLoan };
    } catch (error) {
      await supabase.from('payments').delete().eq('id', payment.id);
      throw error;
    }
  },
  async update(id, input) {
    const current = assertResult(await supabase.from('payments').select('*').eq('id', id).maybeSingle());
    if (!current) throw new Error('Payment not found.');
    const payload = paymentPayload({ ...current, ...input });
    const loan = await requireRecord('loans', 'id', payload.loan_id, 'Loan not found.');
    if (loan.member_id !== payload.member_id) throw new Error('Payment member does not match the loan member.');
    const payment = assertResult(await supabase.from('payments').update(payload).eq('id', id).select().single());
    try {
      await recomputeLoanAfterPayments(current.loan_id);
      if (payload.loan_id !== current.loan_id) await recomputeLoanAfterPayments(payload.loan_id);
      return payment;
    } catch (error) {
      await supabase.from('payments').update(current).eq('id', id);
      throw error;
    }
  },
  async remove(id) {
    const current = assertResult(await supabase.from('payments').select('*').eq('id', id).maybeSingle());
    if (!current) throw new Error('Payment not found.');
    assertResult(await supabase.from('payments').delete().eq('id', id));
    try {
      await recomputeLoanAfterPayments(current.loan_id);
      return { id };
    } catch (error) {
      await supabase.from('payments').insert(current);
      throw error;
    }
  },
};
