import { roundMoney, sumMoney } from '../lib/money.js';
import { assertResult, supabase } from '../lib/supabase.js';

function monthKey(value) {
  return String(value || '').slice(0, 7);
}

function monthly(rows, dateKey, amountKey) {
  const grouped = rows.reduce((result, row) => {
    const month = monthKey(row[dateKey]);
    if (month) result[month] = roundMoney((result[month] || 0) + Number(row[amountKey] || 0));
    return result;
  }, {});
  return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([month, amount]) => ({ month, amount }));
}

export const dashboardService = {
  async getSummary() {
    const [membersResult, loansResult, paymentsResult, delinquentsResult, expensesResult, dividendsResult, patronageResult, timeDepositsResult] = await Promise.all([
      supabase.from('members').select('*'),
      supabase.from('loans').select('*'),
      supabase.from('payments').select('*, loans(voucher_no,surname,given_name,middle_name)').order('payment_date', { ascending: false }),
      supabase.from('delinquent_loans').select('*'),
      supabase.from('expenses').select('*'),
      supabase.from('dividends').select('*'),
      supabase.from('patronage').select('*'),
      supabase.from('time_deposits').select('*'),
    ]);
    const members = assertResult(membersResult) || [];
    const loans = assertResult(loansResult) || [];
    const payments = assertResult(paymentsResult) || [];
    const delinquents = assertResult(delinquentsResult) || [];
    const expenses = assertResult(expensesResult) || [];
    const dividends = assertResult(dividendsResult) || [];
    const patronage = assertResult(patronageResult) || [];
    const timeDeposits = assertResult(timeDepositsResult) || [];
    return {
      metrics: {
        total_members: members.length,
        active_members: members.filter((row) => row.membership_status === 'Active').length,
        active_loans: loans.filter((row) => row.status === 'Active').length,
        paid_loans: loans.filter((row) => row.status === 'Paid').length,
        delinquent_loans: loans.filter((row) => row.status === 'Delinquent').length || delinquents.length,
        total_loan_amount_released: sumMoney(loans, 'loan_amount'),
        total_loan_receivable: sumMoney(loans, 'loan_receivable'),
        total_loan_payments_collected: sumMoney(payments, 'amount_paid'),
        total_penalty_collected: sumMoney(payments, 'penalty'),
        total_share_capital: sumMoney(members, 'paid_up_share_capital'),
        total_regular_savings: sumMoney(members, 'regular_savings'),
        total_time_deposits: sumMoney(timeDeposits.filter((row) => row.status === 'Active'), 'principal'),
        total_expenses: sumMoney(expenses, 'amount'),
        estimated_dividends: sumMoney(dividends, 'estimated_dividend'),
        patronage_total: sumMoney(patronage, 'approved_refund'),
      },
      recent_payments: payments.slice(0, 10),
      recent_loans: [...loans].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 10),
      monthly_collections: monthly(payments, 'payment_date', 'amount_paid'),
      monthly_loan_releases: monthly(loans, 'loan_released', 'loan_amount'),
    };
  },
};
