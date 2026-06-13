import { addMonthsIso, todayIso } from '../lib/dates.js';
import { allocateMoney, roundMoney, sumMoney } from '../lib/money.js';
import { assertResult, supabase } from '../lib/supabase.js';

function fullName(row) {
  return `${row?.surname || ''}, ${row?.given_name || ''} ${row?.middle_name || ''}`.trim();
}

export function buildStatementSchedule(loan, payments, currentDate = todayIso()) {
  const terms = Math.max(0, Math.trunc(Number(loan.loan_terms || 0)));
  const installments = allocateMoney(loan.total_payable, terms);
  let unallocated = sumMoney(payments, 'amount_paid');
  let beginning = roundMoney(loan.total_payable);
  return installments.map((installment, index) => {
    const paidAmount = roundMoney(Math.min(unallocated, installment));
    unallocated = roundMoney(Math.max(unallocated - paidAmount, 0));
    const dueDate = addMonthsIso(loan.loan_released, index + 1);
    const ending = roundMoney(Math.max(beginning - installment, 0));
    let status = paidAmount >= installment ? 'Paid' : paidAmount > 0 ? 'Partial' : dueDate && dueDate < currentDate ? 'Overdue' : 'Unpaid';
    const row = { month_number: index + 1, due_date: dueDate, beginning_balance: beginning, monthly_amortization: installment, ending_balance: ending, paid_amount: paidAmount, status };
    beginning = ending;
    return row;
  });
}

export const statementService = {
  async get(loanId, currentDate = todayIso()) {
    const loan = assertResult(await supabase.from('loans').select('*, members(*)').eq('id', loanId).maybeSingle());
    if (!loan) throw new Error('Loan not found.');
    const payments = assertResult(await supabase.from('payments').select('*').eq('loan_id', loanId).order('payment_date')) || [];
    return {
      borrower: { ...loan.members, full_name: loan.members?.full_name || fullName(loan) },
      loan,
      summary: {
        loan_amount: Number(loan.loan_amount || 0),
        interest_amount: Number(loan.interest_amount || 0),
        collection_fee: Number(loan.collection_fee || 0),
        processing_fee: Number(loan.processing_fee || 0),
        total_payable: Number(loan.total_payable || 0),
        loan_terms: Number(loan.loan_terms || 0),
        monthly_amortization: loan.loan_terms ? roundMoney(Number(loan.total_payable || 0) / Number(loan.loan_terms)) : 0,
        total_payments: sumMoney(payments, 'amount_paid'),
        penalties_collected: sumMoney(payments, 'penalty'),
        remaining_balance: Number(loan.loan_receivable || 0),
      },
      payment_history: payments,
      schedule: buildStatementSchedule(loan, payments, currentDate),
    };
  },
};
