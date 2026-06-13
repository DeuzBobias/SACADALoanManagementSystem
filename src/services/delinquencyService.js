import { addMonthsIso, elapsedWholeMonths, todayIso } from '../lib/dates.js';
import { assertResult, supabase } from '../lib/supabase.js';
import { roundMoney, toFiniteNumber } from '../lib/money.js';

export function calculateDelinquency(loan, currentDate = todayIso()) {
  const totalPayable = toFiniteNumber(loan.total_payable);
  const terms = Math.trunc(toFiniteNumber(loan.loan_terms));
  const payments = toFiniteNumber(loan.loan_payments);
  const receivable = toFiniteNumber(loan.loan_receivable, Math.max(totalPayable - payments, 0));
  if (receivable <= 0) return { monthly_payment: terms ? roundMoney(totalPayable / terms) : 0, expected_elapsed_months: 0, expected_paid: totalPayable, arrears: 0, months_delayed: 0, penalty: 0, collection_status: 'Settled', computed_status: 'Paid' };
  if (!loan.loan_released || terms <= 0 || totalPayable <= 0) return { monthly_payment: 0, expected_elapsed_months: 0, expected_paid: 0, arrears: 0, months_delayed: 0, penalty: 0, collection_status: 'For Follow-Up', computed_status: 'Active' };
  const monthlyPayment = roundMoney(totalPayable / terms);
  const elapsed = Math.min(terms, elapsedWholeMonths(loan.loan_released, currentDate));
  const expectedPaid = roundMoney(monthlyPayment * elapsed);
  const arrears = roundMoney(Math.max(expectedPaid - payments, 0));
  const monthsDelayed = monthlyPayment ? Math.floor(arrears / monthlyPayment) : 0;
  return {
    monthly_payment: monthlyPayment,
    expected_elapsed_months: elapsed,
    expected_paid: expectedPaid,
    arrears,
    months_delayed: monthsDelayed,
    penalty: roundMoney(monthsDelayed * 50),
    collection_status: 'For Follow-Up',
    computed_status: monthsDelayed > 0 ? 'Delinquent' : 'Active',
    next_due_date: addMonthsIso(loan.loan_released, elapsed),
  };
}

export const delinquencyService = {
  async syncLoan(loanId, currentDate = todayIso()) {
    const loan = assertResult(await supabase.from('loans').select('*, members(mobile,telephone,barangay)').eq('id', loanId).maybeSingle());
    if (!loan) throw new Error('Loan not found.');
    const calculation = calculateDelinquency(loan, currentDate);
    const existing = assertResult(await supabase.from('delinquent_loans').select('*').eq('loan_id', loanId).maybeSingle());
    if (calculation.arrears > 0) {
      const payload = {
        loan_id: loan.id,
        member_id: loan.member_id,
        contact_details: loan.members?.mobile || loan.members?.telephone || null,
        barangay: loan.members?.barangay || null,
        monthly_payment: calculation.monthly_payment,
        arrears: calculation.arrears,
        penalty: calculation.penalty,
        last_payment: null,
        months_delayed: calculation.months_delayed,
        collection_status: existing?.collection_status || 'For Follow-Up',
      };
      if (existing) assertResult(await supabase.from('delinquent_loans').update(payload).eq('id', existing.id));
      else assertResult(await supabase.from('delinquent_loans').insert(payload));
    } else if (existing) {
      assertResult(await supabase.from('delinquent_loans').delete().eq('id', existing.id));
    }
    assertResult(await supabase.from('loans').update({ status: calculation.computed_status }).eq('id', loan.id));
    return calculation;
  },
  async syncAll(currentDate = todayIso()) {
    const loans = assertResult(await supabase.from('loans').select('id').neq('status', 'Paid')) || [];
    return Promise.all(loans.map((loan) => this.syncLoan(loan.id, currentDate)));
  },
  async list(filters = {}) {
    let query = supabase.from('delinquent_loans').select('*, loans(*), members(*)').order('months_delayed', { ascending: false });
    if (filters.memberId) query = query.eq('member_id', filters.memberId);
    if (filters.status && filters.status !== 'All') query = query.eq('collection_status', filters.status);
    if (filters.barangay && filters.barangay !== 'All') query = query.eq('barangay', filters.barangay);
    return assertResult(await query) || [];
  },
};
