import { toFiniteNumber } from '../lib/money.js';
import { nonNegative, required, validDate, validate } from '../lib/validation.js';
import { createCrudService } from './baseService.js';

function payload(input) {
  validate(input, {
    expense_date: [required('Expense date'), validDate('Expense date')],
    particular: [required('Particular')],
    amount: [required('Amount'), nonNegative('Amount')],
  });
  return { ...input, amount: toFiniteNumber(input.amount) };
}

export const expenseService = createCrudService({ table: 'expenses', validateCreate: payload, dateColumn: 'expense_date', filterMap: { category: 'category' } });
