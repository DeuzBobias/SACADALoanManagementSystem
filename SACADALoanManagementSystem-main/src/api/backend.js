import { respond } from '../lib/responses.js';
import {
  birRegistryService,
  capitalService,
  dashboardService,
  delinquencyService,
  dividendService,
  expenseService,
  loanService,
  memberService,
  patronageService,
  paymentService,
  reportService,
  statementService,
  timeDepositService,
} from '../services/index.js';

function api(service, labels) {
  return {
    list: (filters) => respond(() => service.list(filters), `${labels.plural} loaded.`),
    get: service.get ? (id) => respond(() => service.get(id), `${labels.singular} loaded.`) : undefined,
    create: service.create ? (input) => respond(() => service.create(input), `${labels.singular} created.`) : undefined,
    update: service.update ? (id, input) => respond(() => service.update(id, input), `${labels.singular} updated.`) : undefined,
    remove: service.remove ? (id) => respond(() => service.remove(id), `${labels.singular} deleted.`) : undefined,
  };
}

export const membersApi = api(memberService, { singular: 'Member', plural: 'Members' });
export const loansApi = api(loanService, { singular: 'Loan', plural: 'Loans' });
export const paymentsApi = api(paymentService, { singular: 'Payment', plural: 'Payments' });
export const capitalTransactionsApi = api(capitalService, { singular: 'Capital transaction', plural: 'Capital transactions' });
export const timeDepositsApi = api(timeDepositService, { singular: 'Time deposit', plural: 'Time deposits' });
export const expensesApi = api(expenseService, { singular: 'Expense', plural: 'Expenses' });
export const dividendsApi = api(dividendService, { singular: 'Dividend', plural: 'Dividends' });
export const patronageApi = api(patronageService, { singular: 'Patronage record', plural: 'Patronage records' });
export const birRegistryApi = api(birRegistryService, { singular: 'BIR registry record', plural: 'BIR registry records' });

export const delinquentLoansApi = {
  list: (filters) => respond(() => delinquencyService.list(filters), 'Delinquent loans loaded.'),
  sync: (loanId, currentDate) => respond(() => delinquencyService.syncLoan(loanId, currentDate), 'Loan delinquency updated.'),
  syncAll: (currentDate) => respond(() => delinquencyService.syncAll(currentDate), 'Delinquency records updated.'),
};

export const dashboardApi = {
  summary: () => respond(() => dashboardService.getSummary(), 'Dashboard summary loaded.'),
};

export const reportsApi = {
  get: (type, filters) => respond(() => reportService.get(type, filters), 'Report generated.'),
  statementOfAccount: (loanId, currentDate) => respond(() => statementService.get(loanId, currentDate), 'Statement of account generated.'),
};
