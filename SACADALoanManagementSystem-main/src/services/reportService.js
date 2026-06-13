import { assertResult, supabase } from '../lib/supabase.js';
import { statementService } from './statementService.js';

const definitions = {
  member_masterlist: { table: 'members', date: 'created_at', status: 'membership_status', member: 'id' },
  active_loans: { table: 'loans', date: 'loan_released', fixed: ['status', 'Active'], member: 'member_id' },
  paid_loans: { table: 'loans', date: 'loan_released', fixed: ['status', 'Paid'], member: 'member_id' },
  delinquent_loans: { table: 'delinquent_loans', date: 'created_at', status: 'collection_status', member: 'member_id', select: '*, loans(*), members(*)' },
  payment_collection: { table: 'payments', date: 'payment_date', member: 'member_id', select: '*, loans(voucher_no,surname,given_name,middle_name)' },
  loan_release: { table: 'loans', date: 'loan_released', status: 'status', member: 'member_id' },
  capital_transactions: { table: 'capital_transactions', date: 'transaction_date', status: 'transaction_type', member: 'member_id', select: '*, members(full_name)' },
  time_deposits: { table: 'time_deposits', date: 'investment_date', status: 'status', member: 'member_id' },
  expenses: { table: 'expenses', date: 'expense_date', status: 'category' },
  dividends: { table: 'dividends', date: 'date_paid', status: 'status', member: 'member_id' },
  patronage: { table: 'patronage', date: 'date_shared', status: 'status', member: 'member_id' },
  bir_registry: { table: 'bir_registry', date: 'created_at', status: 'included', member: 'member_id' },
};

function includesSearch(row, search) {
  if (!search) return true;
  return JSON.stringify(row).toLowerCase().includes(String(search).toLowerCase());
}

export const reportService = {
  async get(type, filters = {}) {
    if (type === 'statement_of_account') {
      if (!filters.loanId) throw new Error('Loan is required for a statement of account.');
      const data = await statementService.get(filters.loanId, filters.currentDate);
      return { type, filters, columns: Object.keys(data.summary), rows: [data], export_ready: true };
    }
    const definition = definitions[type];
    if (!definition) throw new Error('Unsupported report type.');
    let query = supabase.from(definition.table).select(definition.select || '*');
    if (definition.fixed) query = query.eq(definition.fixed[0], definition.fixed[1]);
    if (filters.from && definition.date) query = query.gte(definition.date, filters.from);
    if (filters.to && definition.date) query = query.lte(definition.date, filters.to);
    if (filters.status !== undefined && filters.status !== '' && filters.status !== 'All' && definition.status) query = query.eq(definition.status, filters.status);
    if (filters.memberId && definition.member) query = query.eq(definition.member, filters.memberId);
    const rows = (assertResult(await query) || []).filter((row) => includesSearch(row, filters.search));
    return { type, filters, columns: rows.length ? Object.keys(rows[0]) : [], rows, export_ready: true, generated_at: new Date().toISOString() };
  },
  types() {
    return [...Object.keys(definitions), 'statement_of_account'];
  },
};
