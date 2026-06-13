import { buildAmortizationSchedule, calculateLoan, formatCurrency, formatDate, formatNumber } from './calculations.js';
import {
  amortizationTable,
  button,
  chartCard,
  columnVisibilityMenu,
  dashboardSection,
  dataTable,
  dateRangeFilter,
  donutChart,
  emptyState,
  escapeHtml,
  field,
  filterBar,
  formActions,
  formSection,
  groupedBarChart,
  horizontalBarChart,
  lineChart,
  printLayout,
  signatureLine,
  statCard,
  statusBadge,
  summaryCard,
  yearSelector,
} from './components.js';
import {
  birRegistryService,
  capitalService,
  delinquentLoanService,
  dividendService,
  expenseService,
  financialService,
  memberService,
  patronageService,
  timeDepositService,
} from './services.js';

export const extendedRouteTitles = {
  'capital-savings': ['Capital & Savings', 'Membership / Capital & Savings'],
  'delinquent-loans': ['Delinquent Loans', 'Loans / Delinquent Loans'],
  'time-deposits': ['Time Deposits', 'Financial / Time Deposits'],
  dividends: ['Dividends', 'Financial / Dividends'],
  patronage: ['Patronage', 'Financial / Patronage'],
  expenses: ['Expenses', 'Financial / Expenses'],
  'financial-statements': ['Financial Statements', 'Financial / Statements'],
  'bir-registry': ['BIR Tax-Exempt Registry', 'Reports and Documents / BIR Registry'],
  'forms-printables': ['Forms & Printables', 'Reports and Documents / Forms'],
};

export function getExtendedActiveNav(section) {
  const ids = {
    'capital-savings': 'capital-savings',
    'delinquent-loans': 'delinquent-loans',
    'time-deposits': 'time-deposits',
    dividends: 'dividends',
    patronage: 'patronage',
    expenses: 'expenses',
    'financial-statements': 'financial-statements',
    'bir-registry': 'bir-registry',
    'forms-printables': 'forms-printables',
  };
  return ids[section] || '';
}

export function renderEnhancedDashboard(state) {
  const members = memberService.list();
  const capital = capitalService.list();
  const timeDeposits = timeDepositService.list();
  const delinquent = delinquentLoanService.list();
  const expenses = expenseService.list();
  const dividends = dividendService.list();
  const patronage = patronageService.list();

  const paidUpCapital = sum(members, 'paidUpShareCapital') + sum(capital.filter((row) => row.type.includes('Capital')), 'amount');
  const amountSubscribed = sum(members, 'amountSubscribed');
  const regularSavings = sum(members, 'regularSavings');
  const timeDepositPrincipal = sum(timeDeposits, 'principal');
  const totalExpenses = sum(expenses, 'amount');
  const estimatedDividends = sum(dividends, 'estimatedDividend');
  const estimatedPatronage = sum(patronage, 'estimatedRefund');
  const totalLoanPayments = sum(state.payments, 'amountPaid');
  const processingFees = state.loanApplications.reduce((total, app) => total + calculateLoan(app.computation || {}).processingFee, 0);
  const penalties = sum(state.payments, 'penalty');
  const interestIncome = state.loanApplications.reduce((total, app) => total + calculateLoan(app.computation || {}).totalInterest, 0);
  const membershipFees = sum(members, 'membershipFeeAmount');
  const totalRevenue = totalLoanPayments + processingFees + penalties + interestIncome + membershipFees;
  const netSurplus = totalRevenue - totalExpenses;
  const activeLoanTotal = sum(state.activeLoans, 'originalAmount');
  const activeLoanReceivables = sum(state.activeLoans, 'remainingBalance');

  const membershipTypeRows = countRows(members, 'membershipType');
  const sexRows = genderRows(members);
  const civilRows = countRows(members, 'civilStatus');
  const barangayRows = ilocosSurLocationRows(members);
  const incomeRows = incomeClassificationRows(members);
  const ageRows = ageGroupRows(members);
  const professionRows = countRows(members, 'profession', 'occupation');
  const educationRows = countRows(members, 'education');
  const religionRows = countRows(members, 'religion');
  const memberMovementRows = yearlyMemberMovementRows(members);
  const collectionTrend = monthlyTrend(state.payments, 'amountPaid', 'penalty');
  const releaseTrend = monthlyTrend(state.loanApplications, 'approvedAmount', 'requestedAmount');
  const expenseTrend = monthlyTrend(expenses, 'amount');
  const revenueExpenseTrend = mergeMonthlyTrend(collectionTrend, expenseTrend);
  const expenseRows = countAmountRows(expenses, 'category', 'amount');
  const timeDepositRows = countRows(timeDeposits, 'status');
  const dividendPatronageRows = [
    { label: 'Estimated Dividends', estimated: estimatedDividends, approved: sum(dividends, 'approvedDividend'), paid: sum(dividends, 'amountPaid') },
    { label: 'Patronage Refund', estimated: estimatedPatronage, approved: sum(patronage, 'approvedRefund'), paid: sum(patronage, 'amountPaid') },
  ].filter((row) => row.estimated || row.approved || row.paid);
  const loanPortfolioRows = [
    { label: 'Loans Released', value: activeLoanTotal },
    { label: 'Payments', value: totalLoanPayments },
    { label: 'Receivables', value: activeLoanReceivables },
  ].filter((row) => row.value);
  const delinquencyRows = [
    { label: '1 month delayed', value: delinquent.filter((row) => row.monthsDelayed === 1).length },
    { label: '2 months delayed', value: delinquent.filter((row) => row.monthsDelayed === 2).length },
    { label: '3-5 months delayed', value: delinquent.filter((row) => row.monthsDelayed >= 3 && row.monthsDelayed <= 5).length },
    { label: '6-11 months delayed', value: delinquent.filter((row) => row.monthsDelayed >= 6 && row.monthsDelayed <= 11).length },
    { label: '12+ months delayed', value: delinquent.filter((row) => row.monthsDelayed >= 12).length },
  ];

  const summaryCards = [
    ['Total Members', formatNumber(members.length), 'Records in Members / KYC'],
    ['Regular Members', formatNumber(members.filter((member) => member.membershipType === 'Regular').length), 'Regular membership type'],
    ['Associate Members', formatNumber(members.filter((member) => member.membershipType === 'Associate').length), 'Associate membership type'],
    ['New Members This Year', members.length, 'Encoded in this prototype'],
    ['Total Share Capital', formatCurrency(paidUpCapital), 'Paid-up member capital'],
    ['Total Share Subscription', formatCurrency(amountSubscribed), 'Subscribed shares'],
    ['Total Regular Savings', formatCurrency(regularSavings), 'Separate from share capital'],
    ['Total Time Deposits', formatCurrency(timeDepositPrincipal), 'Principal deposits'],
    ['Pending Loan Applications', formatNumber(state.loanApplications.filter((loan) => loan.status === 'Pending').length), 'Needs evaluation'],
    ['Approved Loans', formatNumber(state.loanApplications.filter((loan) => loan.status === 'Approved').length), 'Approved records'],
    ['Active Loans', formatNumber(state.activeLoans.filter((loan) => loan.status !== 'Completed').length), 'Open loan accounts'],
    ['Completed Loans', formatNumber(state.activeLoans.filter((loan) => loan.status === 'Completed').length), 'Paid accounts'],
    ['Delinquent Loans', formatNumber(delinquent.length), 'Dedicated delinquency register'],
    ['Total Loans Released', formatCurrency(activeLoanTotal), 'From Active Loans'],
    ['Total Loan Payments', formatCurrency(totalLoanPayments), 'From Payments'],
    ['Total Loan Receivables', formatCurrency(activeLoanReceivables), 'From Active Loans'],
    ['Penalties Collected', formatCurrency(penalties), 'From Payments'],
    ['Processing Fees Collected', formatCurrency(processingFees), 'From Loan Applications'],
    ['Total Revenue', formatCurrency(totalRevenue), 'Income categories'],
    ['Total Expenses', formatCurrency(totalExpenses), 'Expense register'],
    ['Net Surplus or Loss', formatCurrency(netSurplus), 'Revenue less expenses'],
    ['Interest Income', formatCurrency(interestIncome), 'From loan computations'],
    ['Service or Collection Fees', formatCurrency(processingFees), 'Collection charges'],
    ['Membership Fees', formatCurrency(membershipFees), 'From member records'],
    ['Estimated Dividends', formatCurrency(estimatedDividends), 'For approval'],
    ['Estimated Patronage Refund', formatCurrency(estimatedPatronage), 'For approval'],
  ];

  return `
    <section class="page-header">
      <div>
        <h3>Dashboard</h3>
        <p>Module-based analytics and office-ready summaries.</p>
      </div>
      <div class="top-actions">
        ${button('Refresh', '', 'secondary', 'data-action="refresh-page"')}
        ${button('Print Dashboard', '', 'secondary', 'data-action="print-page"')}
        ${button('View Full Reports', '#/reports', 'primary')}
      </div>
    </section>

    <section class="panel">
      ${filterBar(`${yearSelector('2026')}${dateRangeFilter('2026-01-01', '2026-12-31')}`, button('Clear Filters', '', 'secondary', 'data-action="clear-filters"'))}
    </section>

    ${dashboardSection('Summary', 'Membership, loan, and financial cards.', `<div class="grid stats-grid">${summaryCards.map(([label, value, helper]) => statCard(label, value, helper)).join('')}</div>`)}

    ${dashboardSection(
      'Membership Analytics',
      'Demographics from member records.',
      `<div class="grid two-column">
        ${chartCard('Yearly Member Movement', lineChart(memberMovementRows, [
          { key: 'members', label: 'Members', color: 'var(--color-success)' },
          { key: 'removed', label: 'Members Removed', color: 'var(--color-danger)' },
        ]), 'Accepted members vs inactive or terminated members since 2022', '#/members')}
        ${chartCard('Members by Type of Membership', donutChart(membershipTypeRows), 'Regular vs Associate', '#/members')}
        ${chartCard('Members by Sex', donutChart(sexRows), 'Male and Female only', '#/members')}
        ${chartCard('Civil Status', donutChart(civilRows), 'Civil status share', '#/reports')}
        ${chartCard('Members by Barangay / City', horizontalBarChart(barangayRows), 'Ilocos Sur locations only; outside province is Others', '#/reports')}
        ${chartCard('Income Classification', donutChart(incomeRows), 'Monthly income brackets', '#/reports')}
        ${chartCard('Age Group', donutChart(ageRows), 'Main non-overlapping age groups', '#/reports')}
        ${chartCard('Profession', horizontalBarChart(professionRows), 'Horizontal only because profession labels are long', '#/reports')}
        ${chartCard('Educational Attainment', donutChart(educationRows), 'Education levels', '#/reports')}
        ${chartCard('Religion', donutChart(religionRows), 'Religion categories', '#/reports')}
      </div>`,
    )}

    ${dashboardSection(
      'Loan Analytics',
      'Collection target, actual payments, receivables, and delinquency.',
      `<div class="grid two-column">
        ${chartCard('Loan Collections Over Time', lineChart(collectionTrend, [
          { key: 'amountPaid', label: 'Actual Loan Collection' },
          { key: 'penalty', label: 'Penalty Collected' },
        ]), 'Line chart based on Payments records', '#/payments/history')}
        ${chartCard('Monthly Loan Releases', lineChart(releaseTrend, [
          { key: 'approvedAmount', label: 'Approved Loan Amount' },
          { key: 'requestedAmount', label: 'Requested Loan Amount' },
        ]), 'Line chart based on Loan Applications', '#/loan-applications')}
        ${chartCard('Loan Portfolio Status', donutChart(loanPortfolioRows), 'Only shows if Active Loans or Payments have values', '#/active-loans')}
        ${chartCard('Delinquency Aging', donutChart(delinquencyRows), 'Only shows if Delinquent Loans has records', '#/delinquent-loans')}
      </div>`,
    )}

    ${dashboardSection(
      'Financial Analytics',
      'Expense and surplus views.',
      `<div class="grid two-column">
        ${chartCard('Expenses by Category', donutChart(expenseRows), 'From Expenses module records', '#/expenses')}
        ${chartCard('Revenue vs Expenses vs Net Surplus', lineChart(revenueExpenseTrend, [
          { key: 'revenue', label: 'Revenue' },
          { key: 'expenses', label: 'Expenses' },
          { key: 'surplus', label: 'Net Surplus or Loss' },
        ]), 'Line chart from Payments and Expenses records', '#/financial-statements')}
      </div>`,
    )}

    ${dashboardSection(
      'Deposit, Dividend, and Patronage Analytics',
      'Deposit maturities and allocation progress.',
      `<div class="grid two-column">
        ${chartCard('Time Deposit Status', donutChart(timeDepositRows), 'From Time Deposits module records', '#/time-deposits')}
        ${chartCard('Dividend and Patronage Overview', groupedBarChart(dividendPatronageRows, [
          { key: 'estimated', label: 'Estimated' },
          { key: 'approved', label: 'Approved' },
          { key: 'paid', label: 'Paid' },
        ]), 'Estimated, approved, and paid amounts', '#/dividends')}
      </div>`,
    )}
  `;
}

export function renderExtendedRoute(section, id, state) {
  if (section === 'capital-savings') return renderCapitalSavings();
  if (section === 'delinquent-loans') return renderDelinquentLoans();
  if (section === 'time-deposits') return renderTimeDeposits(id);
  if (section === 'dividends') return renderDividends();
  if (section === 'patronage') return renderPatronage();
  if (section === 'expenses') return renderExpenses();
  if (section === 'financial-statements') return renderFinancialStatements();
  if (section === 'bir-registry') return renderBirRegistry();
  if (section === 'forms-printables') return renderFormsPrintables(id, state);
  return '';
}

function renderCapitalSavings() {
  const rows = capitalService.list();
  const members = memberService.list();
  const paidUp = sum(members, 'paidUpShareCapital');
  const subscribed = sum(members, 'amountSubscribed');
  const savings = sum(members, 'regularSavings');
  const columns = [
    { key: 'id', label: 'Transaction Number' },
    { key: 'memberName', label: 'Member' },
    { key: 'memberId', label: 'Member ID' },
    { key: 'type', label: 'Transaction Type' },
    { key: 'shares', label: 'Number of Shares' },
    { key: 'amount', label: 'Amount', render: (row) => formatCurrency(row.amount) },
    { key: 'date', label: 'Transaction Date', render: (row) => formatDate(row.date) },
    { key: 'orNumber', label: 'OR / Reference Number' },
    { key: 'remarks', label: 'Remarks' },
    { key: 'encodedBy', label: 'Encoded By' },
  ];
  return moduleShell(
    'Capital & Savings Overview',
    'Track member capital subscriptions, share payments, and regular savings.',
    [
      ['Total Amount Subscribed', formatCurrency(subscribed)],
      ['Total Paid-Up Share Capital', formatCurrency(paidUp)],
      ['Total Unpaid Subscription', formatCurrency(Math.max(0, subscribed - paidUp))],
      ['Total Number of Shares', formatNumber(sum(members, 'sharesSubscribed'))],
      ['Total Regular Savings', formatCurrency(savings)],
      ['Capital Payments This Year', formatCurrency(sum(rows, 'amount'))],
    ],
    `${filterBar(
      `${field('Search', 'searchCapital', '', { placeholder: 'Search member or OR number' })}
       ${field('Transaction Type', 'capitalType', 'All', { type: 'select', choices: ['All', 'Initial Share Capital', 'Additional Share Capital', 'Capital Subscription Payment', 'Regular Savings Deposit', 'Regular Savings Withdrawal', 'Time Deposit Converted to Share Capital', 'Adjustment'] })}
       ${dateRangeFilter()}`,
      `${button('Record Capital Payment', '', 'primary', 'data-action="placeholder-export" data-message="Capital payment form can be connected to local state in the next iteration."')}${button('Print Ledger', '', 'secondary', 'data-action="print-page"')}${button('Export Placeholder', '', 'secondary', 'data-action="placeholder-export" data-message="Excel export placeholder."')}`,
    )}
    ${columnVisibilityMenu(columns)}
    ${dataTable({ columns, rows, emptyText: 'No capital or savings transactions yet.' })}`,
  );
}

function renderDelinquentLoans() {
  const rows = delinquentLoanService.list();
  const aging = [
    { label: '1 month delayed', value: rows.filter((row) => row.monthsDelayed === 1).length },
    { label: '2 months delayed', value: rows.filter((row) => row.monthsDelayed === 2).length },
    { label: '3-5 months delayed', value: rows.filter((row) => row.monthsDelayed >= 3 && row.monthsDelayed <= 5).length },
    { label: '6-11 months delayed', value: rows.filter((row) => row.monthsDelayed >= 6 && row.monthsDelayed <= 11).length },
    { label: '12+ months delayed', value: rows.filter((row) => row.monthsDelayed >= 12).length },
  ];
  const columns = [
    { key: 'loanNumber', label: 'Loan Number' },
    { key: 'voucherNumber', label: 'Voucher Number' },
    { key: 'borrower', label: 'Borrower' },
    { key: 'contact', label: 'Contact Details' },
    { key: 'barangay', label: 'Barangay' },
    { key: 'originalAmount', label: 'Original Loan Amount', render: (row) => formatCurrency(row.originalAmount) },
    { key: 'term', label: 'Loan Term' },
    { key: 'totalPayable', label: 'Total Loan Payable', render: (row) => formatCurrency(row.totalPayable) },
    { key: 'monthlyPayment', label: 'Monthly Payment', render: (row) => formatCurrency(row.monthlyPayment) },
    { key: 'totalPayments', label: 'Total Loan Payments', render: (row) => formatCurrency(row.totalPayments) },
    { key: 'arrears', label: 'Arrears as of Selected Date', render: (row) => formatCurrency(row.arrears) },
    { key: 'penalty', label: 'Penalty', render: (row) => formatCurrency(row.penalty) },
    { key: 'lastPaymentDate', label: 'Last Payment Date', render: (row) => formatDate(row.lastPaymentDate) },
    { key: 'monthsDelayed', label: 'Number of Months Delayed' },
    { key: 'collectionStatus', label: 'Collection Status', render: (row) => statusBadge(row.collectionStatus) },
    { key: 'actions', label: 'Actions', render: () => actionButtons(['Record Follow-Up', 'Add Collection Note', 'Record Payment', 'Print Notice', 'View Borrower', 'View Loan']) },
  ];
  return moduleShell(
    'Delinquent Loans',
    'Dedicated register for arrears, follow-up status, notes, and notices.',
    [
      ['Total Delinquent Accounts', formatNumber(rows.length)],
      ['Total Arrears', formatCurrency(sum(rows, 'arrears'))],
      ['Total Penalties', formatCurrency(sum(rows, 'penalty'))],
      ['Average Months Delayed', rows.length ? (sum(rows, 'monthsDelayed') / rows.length).toFixed(1) : '0'],
      ['Accounts Delayed 1-2 Months', formatNumber(rows.filter((row) => row.monthsDelayed <= 2).length)],
      ['Accounts Delayed 3 Months or More', formatNumber(rows.filter((row) => row.monthsDelayed >= 3).length)],
    ],
    `${chartCard('Aging Chart', horizontalBarChart(aging), 'Delay buckets for collection follow-up')}
     ${filterBar(`${field('Search', 'searchDelinquent', '', { placeholder: 'Search borrower or loan number' })}${field('Collection Status', 'collectionStatus', 'All', { type: 'select', choices: ['All', 'For Follow-Up', 'Contacted', 'Promised to Pay', 'Partial Payment', 'Restructuring Requested', 'For Board Review', 'Defaulted', 'Settled'] })}`, button('Clear Filters', '', 'secondary'))}
     ${dataTable({ columns, rows })}`,
  );
}

function renderTimeDeposits(id) {
  if (id === 'new') return renderTimeDepositForm();
  const rows = timeDepositService.list().map((row) => {
    const days = daysBetween(row.investmentDate, new Date().toISOString().slice(0, 10));
    const expectedDays = Math.max(1, daysBetween(row.investmentDate, row.maturityDate));
    const interest = row.principal * (row.annualRate / 100) * (Math.max(0, days) / 365);
    return {
      ...row,
      days,
      earnedInterest: interest,
      maturityValue: row.principal + row.principal * (row.annualRate / 100) * (expectedDays / 365),
      daysRemaining: daysBetween(new Date().toISOString().slice(0, 10), row.maturityDate),
    };
  });
  const columns = [
    { key: 'id', label: 'Deposit Number' },
    { key: 'memberName', label: 'Member / Investor' },
    { key: 'principal', label: 'Principal', render: (row) => formatCurrency(row.principal) },
    { key: 'investmentDate', label: 'Investment Date', render: (row) => formatDate(row.investmentDate) },
    { key: 'maturityDate', label: 'Maturity Date', render: (row) => formatDate(row.maturityDate) },
    { key: 'annualRate', label: 'Annual Rate', render: (row) => `${row.annualRate}%` },
    { key: 'earnedInterest', label: 'Earned Interest', render: (row) => formatCurrency(row.earnedInterest) },
    { key: 'maturityValue', label: 'Maturity Value', render: (row) => formatCurrency(row.maturityValue) },
    { key: 'daysRemaining', label: 'Days Remaining' },
    { key: 'status', label: 'Status', render: (row) => statusBadge(row.status) },
    { key: 'actions', label: 'Actions', render: () => actionButtons(['View', 'Edit', 'Renew', 'Mark Matured', 'Convert to Share Capital', 'Print Certificate']) },
  ];
  return moduleShell(
    'Time Deposit List',
    'Monitor deposit maturity, interest preview, conversion, and printable statements.',
    [
      ['Total Active Deposits', formatNumber(rows.filter((row) => row.status === 'Active').length)],
      ['Total Principal', formatCurrency(sum(rows, 'principal'))],
      ['Total Interest Accrued', formatCurrency(sum(rows, 'earnedInterest'))],
      ['Deposits Maturing Soon', formatNumber(rows.filter((row) => row.daysRemaining <= 60 && row.daysRemaining >= 0).length)],
      ['Matured Deposits', formatNumber(rows.filter((row) => row.daysRemaining < 0 || row.status === 'Matured').length)],
      ['Converted to Share Capital', formatCurrency(sum(rows, 'convertedAmount'))],
    ],
    `${filterBar(`${field('Search', 'searchTimeDeposit', '', { placeholder: 'Search deposit number or investor' })}${field('Status', 'tdStatus', 'All', { type: 'select', choices: ['All', 'Active', 'Maturing Soon', 'Matured', 'Renewed', 'Converted to Share Capital', 'Withdrawn', 'Closed'] })}`, `${button('Add Time Deposit', '#/time-deposits/new', 'primary')}${button('Print Maturity List', '', 'secondary', 'data-action="print-page"')}`)}
     ${dataTable({ columns, rows })}`,
  );
}

function renderTimeDepositForm() {
  return `
    <section class="page-header">
      <div>
        <h3>Add Time Deposit</h3>
        <p>Frontend-only entry form with maturity and interest previews.</p>
      </div>
      ${button('Back to Time Deposits', '#/time-deposits', 'secondary')}
    </section>
    ${formSection('Time Deposit Details', 'Default annual interest can be changed in Settings.', `<div class="form-grid">
      ${field('Time Deposit Number', 'tdNumber', 'TD-NEW')}
      ${field('Member / Investor', 'tdInvestor', '')}
      ${field('Member ID', 'tdMemberId', '')}
      ${field('Principal Amount', 'tdPrincipal', 0, { type: 'number' })}
      ${field('Investment Date', 'tdInvestmentDate', '2026-01-01', { type: 'date' })}
      ${field('Maturity Date', 'tdMaturityDate', '2026-12-31', { type: 'date' })}
      ${field('Annual Interest Rate', 'tdRate', 5, { type: 'number' })}
      ${field('OR / Reference Number', 'tdOr', '')}
      ${field('Status', 'tdStatus', 'Active', { type: 'select', choices: ['Active', 'Maturing Soon', 'Matured', 'Renewed', 'Converted to Share Capital', 'Withdrawn', 'Closed'] })}
      ${field('Remarks', 'tdRemarks', '', { type: 'textarea' })}
    </div>${formActions([button('Cancel', '#/time-deposits', 'secondary'), button('Save Time Deposit', '', 'primary', 'data-action="placeholder-export" data-message="Time deposit saving placeholder."')])}`)}
  `;
}

function renderDividends() {
  const rows = dividendService.list();
  const columns = [
    { key: 'memberId', label: 'Member ID' },
    { key: 'memberName', label: 'Member Name' },
    { key: 'tin', label: 'TIN' },
    { key: 'paidUpShareCapital', label: 'Total Paid-Up Share Capital', render: (row) => formatCurrency(row.paidUpShareCapital) },
    { key: 'shares', label: 'Total Number of Shares' },
    { key: 'estimatedDividend', label: 'Estimated Dividend', render: (row) => formatCurrency(row.estimatedDividend) },
    { key: 'approvedDividend', label: 'Approved Dividend', render: (row) => formatCurrency(row.approvedDividend) },
    { key: 'amountPaid', label: 'Amount Paid', render: (row) => formatCurrency(row.amountPaid) },
    { key: 'status', label: 'Payment Status', render: (row) => statusBadge(row.status) },
    { key: 'datePaid', label: 'Date Paid', render: (row) => formatDate(row.datePaid) },
    { key: 'orNumber', label: 'OR / Reference Number' },
    { key: 'actions', label: 'Actions', render: () => actionButtons(['View Details', 'Approve Selected', 'Mark as Paid', 'Print Statement']) },
  ];
  return moduleShell(
    'Dividend Overview',
    'Estimated dividends based on paid-up share capital. Label remains Estimated until approved.',
    [
      ['Total Paid-Up Share Capital', formatCurrency(sum(rows, 'paidUpShareCapital'))],
      ['Total Number of Shares', formatNumber(sum(rows, 'shares'))],
      ['Dividend Rate per PHP 100 Share', '11.10%'],
      ['Estimated Total Dividends', formatCurrency(sum(rows, 'estimatedDividend'))],
      ['Approved Dividends', formatCurrency(sum(rows, 'approvedDividend'))],
      ['Paid Dividends', formatCurrency(sum(rows, 'amountPaid'))],
      ['Unpaid Dividends', formatCurrency(sum(rows, 'approvedDividend') - sum(rows, 'amountPaid'))],
    ],
    `${filterBar(`${yearSelector('2026')}${field('Status', 'dividendStatus', 'All', { type: 'select', choices: ['All', 'Draft', 'Calculated', 'For Approval', 'Approved', 'Partially Paid', 'Paid', 'Withheld'] })}`, `${button('Calculate All', '', 'primary', 'data-action="placeholder-export" data-message="Dividend calculation placeholder."')}${button('Print Dividend Register', '', 'secondary', 'data-action="print-page"')}`)}
     ${chartCard('Dividend Computation Table', dividendComputationTable(), 'Contribution-level preview')}
     ${dataTable({ columns, rows })}`,
  );
}

function renderPatronage() {
  const rows = patronageService.list();
  const columns = [
    { key: 'memberId', label: 'Member ID' },
    { key: 'memberName', label: 'Member Name' },
    { key: 'tin', label: 'TIN' },
    { key: 'loanParticipation', label: 'Loan Participation', render: (row) => formatCurrency(row.loanParticipation) },
    { key: 'collectedInterest', label: 'Collected Loan Interest', render: (row) => formatCurrency(row.collectedInterest) },
    { key: 'basis', label: 'Patronage Basis' },
    { key: 'allocationRate', label: 'Allocation Rate', render: (row) => `${row.allocationRate}%` },
    { key: 'estimatedRefund', label: 'Estimated Patronage Refund', render: (row) => formatCurrency(row.estimatedRefund) },
    { key: 'approvedRefund', label: 'Approved Patronage Refund', render: (row) => formatCurrency(row.approvedRefund) },
    { key: 'amountPaid', label: 'Amount Paid', render: (row) => formatCurrency(row.amountPaid) },
    { key: 'status', label: 'Payment Status', render: (row) => statusBadge(row.status) },
    { key: 'actions', label: 'Actions', render: () => actionButtons(['View Details', 'Approve Selected', 'Mark as Paid', 'Print Statement']) },
  ];
  return moduleShell(
    'Patronage Overview',
    'Patronage refund computation based on member loan participation.',
    [
      ['Total Eligible Members', formatNumber(rows.length)],
      ['Total Member Loan Participation', formatCurrency(sum(rows, 'loanParticipation'))],
      ['Total Collected Loan Interest', formatCurrency(sum(rows, 'collectedInterest'))],
      ['Patronage Allocation Rate', '25.9%'],
      ['Estimated Patronage Refund', formatCurrency(sum(rows, 'estimatedRefund'))],
      ['Approved Patronage Refund', formatCurrency(sum(rows, 'approvedRefund'))],
      ['Paid Patronage Refund', formatCurrency(sum(rows, 'amountPaid'))],
    ],
    `${filterBar(`${yearSelector('2026')}${field('Status', 'patronageStatus', 'All', { type: 'select', choices: ['All', 'Draft', 'Calculated', 'For Approval', 'Approved', 'Partially Paid', 'Paid', 'Not Eligible'] })}`, `${button('Calculate Patronage', '', 'primary', 'data-action="placeholder-export" data-message="Patronage calculation placeholder."')}${button('Print Patronage Register', '', 'secondary', 'data-action="print-page"')}`)}
     ${chartCard('Patronage Computation Table', patronageComputationTable(rows), 'Allocation preview')}
     ${dataTable({ columns, rows })}`,
  );
}

function renderExpenses() {
  const rows = expenseService.list();
  const columns = [
    { key: 'id', label: 'Expense Number' },
    { key: 'date', label: 'Date', render: (row) => formatDate(row.date) },
    { key: 'category', label: 'Category' },
    { key: 'payee', label: 'Payee' },
    { key: 'amount', label: 'Amount', render: (row) => formatCurrency(row.amount) },
    { key: 'reference', label: 'OR / Reference Number' },
    { key: 'status', label: 'Status', render: (row) => statusBadge(row.status) },
    { key: 'remarks', label: 'Remarks' },
  ];
  return moduleShell(
    'Expenses',
    'Administrative expenses for statement of operations and cash-flow previews.',
    [
      ['Total Expenses', formatCurrency(sum(rows, 'amount'))],
      ['For Approval', formatNumber(rows.filter((row) => row.status === 'For Approval').length)],
      ['Approved Expenses', formatCurrency(sum(rows.filter((row) => row.status === 'Approved'), 'amount'))],
    ],
    `${chartCard('Expenses by Category', donutChart(countAmountRows(rows, 'category', 'amount')), 'From expense records only')}
     ${filterBar(`${dateRangeFilter()}${field('Category', 'expenseCategory', 'All', { type: 'select', choices: ['All', 'Office Supplies', "Officers' Honorarium", 'Travel and Transportation', 'Taxes, Fees and Charges', 'Representation', 'Trainings and Seminars', 'Meetings and Conferences', 'Miscellaneous Expenses'] })}`, button('Record Expense', '', 'primary', 'data-action="placeholder-export" data-message="Expense form placeholder."'))}
     ${dataTable({ columns, rows })}`,
  );
}

function renderFinancialStatements() {
  const data = financialService.list();
  const operations = data.operations || [];
  const revenue = operations.filter((row) => row.amount > 0).reduce((sumValue, row) => sumValue + row.amount, 0);
  const expenses = Math.abs(operations.filter((row) => row.amount < 0).reduce((sumValue, row) => sumValue + row.amount, 0));
  const surplus = revenue - expenses;
  const allocationTotal = (data.allocation || []).reduce((total, row) => total + Number(row.percentage || 0), 0);
  const allocationRows = (data.allocation || []).map((row) => ({
    ...row,
    computedAmount: surplus * (row.percentage / 100),
    finalAmount: surplus * (row.percentage / 100) + Number(row.manualAdjustment || 0),
  }));
  return `
    <section class="page-header">
      <div>
        <h3>Financial Statements</h3>
        <p>Frontend previews for statements of position, operations, allocation, cash flows, and comparative analysis.</p>
      </div>
      <div class="top-actions">${button('Print Financial Statements', '', 'secondary', 'data-action="print-page"')}${button('Export Excel Placeholder', '', 'secondary', 'data-action="placeholder-export" data-message="Excel export placeholder."')}</div>
    </section>
    <div class="grid stats-grid">
      ${statCard('Revenue', formatCurrency(revenue))}
      ${statCard('Expenses', formatCurrency(expenses))}
      ${statCard('Net Surplus / Loss', formatCurrency(surplus))}
      ${statCard('Allocation Percentage Total', `${allocationTotal.toFixed(1)}%`, allocationTotal === 100 ? 'Ready' : 'Warning: total must equal 100%')}
    </div>
    <section class="panel" style="margin-top:16px;">
      <div class="tabs"><button class="tab active">Statement of Financial Position</button><button class="tab">Statement of Operations</button><button class="tab">Net Surplus Allocation</button><button class="tab">Cash Flows</button><button class="tab">Comparative Analysis</button></div>
      ${financialStatementTable(data.position || [])}
      <h4>Statement of Operations</h4>
      ${dataTable({ columns: [{ key: 'account', label: 'Account' }, { key: 'amount', label: 'Amount', render: (row) => formatCurrency(row.amount) }], rows: operations })}
      <h4>Net Surplus Allocation</h4>
      ${allocationTotal !== 100 ? '<div class="notice">Allocation percentages do not equal 100%. Please review Settings.</div>' : ''}
      ${dataTable({ columns: [
        { key: 'name', label: 'Allocation Name' },
        { key: 'percentage', label: 'Percentage', render: (row) => `${row.percentage}%` },
        { key: 'computedAmount', label: 'Computed Amount', render: (row) => formatCurrency(row.computedAmount) },
        { key: 'manualAdjustment', label: 'Manual Adjustment', render: (row) => formatCurrency(row.manualAdjustment) },
        { key: 'finalAmount', label: 'Final Amount', render: (row) => formatCurrency(row.finalAmount) },
        { key: 'remarks', label: 'Remarks' },
      ], rows: allocationRows })}
      <h4>Statement of Cash Flows</h4>
      ${cashFlowPreview()}
      <h4>Comparative Analysis</h4>
      ${comparativePreview(data.position || [])}
    </section>
  `;
}

function renderBirRegistry() {
  const rows = birRegistryService.list();
  const columns = [
    { key: 'number', label: 'Number' },
    { key: 'memberId', label: 'Member ID' },
    { key: 'surname', label: 'Surname' },
    { key: 'givenName', label: 'Given Name' },
    { key: 'middleName', label: 'Middle Name' },
    { key: 'fullName', label: 'Full Name' },
    { key: 'tin', label: 'TIN Number' },
    { key: 'birthdate', label: 'Birthdate', render: (row) => formatDate(row.birthdate) },
    { key: 'barangay', label: 'Barangay' },
    { key: 'municipality', label: 'Municipality' },
    { key: 'province', label: 'Province' },
    { key: 'address', label: 'Full Address' },
    { key: 'capitalShare', label: 'Capital Share', render: (row) => formatCurrency(row.capitalShare) },
    { key: 'included', label: 'Included in BIR Registry', render: (row) => statusBadge(row.included) },
    { key: 'remarks', label: 'Remarks' },
    { key: 'actions', label: 'Actions', render: () => actionButtons(['Add to BIR Registry', 'Remove from BIR Registry', 'View Member', 'Print Individual Record']) },
  ];
  return moduleShell(
    'BIR Tax-Exempt Registry',
    'Printable administrator-controlled registry. The system does not decide legal tax exemption.',
    [
      ['Cooperative Name', 'SACADA'],
      ['CDA Registration Number', 'CDA-REG-0000-0000'],
      ['TIN', '000-000-000-000'],
      ['Registry As-of Date', formatDate(new Date().toISOString().slice(0, 10))],
    ],
    `${filterBar(`${field('Search Member', 'birSearch', '', { placeholder: 'Search member, TIN, or address' })}${field('Barangay', 'birBarangay', 'All', { type: 'select', choices: ['All', 'Poblacion', 'Cabittaogan', 'Subec'] })}${field('Included / Not Included', 'birIncluded', 'All', { type: 'select', choices: ['All', 'Yes', 'No'] })}${field('As-of Date', 'birAsOf', new Date().toISOString().slice(0, 10), { type: 'date' })}`, `${button('Print Full Registry', '#/forms-printables/bir-registry', 'primary')}${button('Export Excel Placeholder', '', 'secondary', 'data-action="placeholder-export" data-message="BIR registry Excel export placeholder."')}${button('Export PDF Placeholder', '', 'secondary', 'data-action="placeholder-export" data-message="BIR registry PDF export placeholder."')}`)}
     ${dataTable({ columns, rows })}`,
  );
}

function renderFormsPrintables(id, state) {
  if (id) return renderPrintable(id, state);
  const forms = [
    ['membership-form', 'SACADA Membership Form'],
    ['loan-package', 'SACADA Loan Application'],
    ['promissory-note', 'Promissory Note'],
    ['salary-deduction', 'Salary Deduction Agreement'],
    ['truth-in-lending', 'Truth in Lending Disclosure Statement'],
    ['privacy-form', 'Loan Data Privacy and Personal Information Form'],
    ['employment-certification', 'Employment / Self-Employment Certification'],
    ['statement-of-account', 'Statement of Account'],
    ['authorization-slip', 'Salary Deduction Authorization Slip'],
    ['member-ledger', 'Member Capital Ledger'],
    ['time-deposit-statement', 'Time Deposit Statement'],
    ['dividend-statement', 'Dividend Statement'],
    ['patronage-statement', 'Patronage Statement'],
    ['bir-registry', 'BIR Tax-Exempt Registry'],
    ['financial-statements', 'Financial Statements'],
  ];
  return `
    <section class="page-header">
      <div>
        <h3>Forms Library</h3>
        <p>Printable browser-based SACADA forms. Print blank or prefilled copies using browser print.</p>
      </div>
      ${button('Print Blank Copy', '', 'secondary', 'data-action="print-page"')}
    </section>
    <section class="panel">
      ${filterBar(`${field('Select Existing Record', 'recordSelector', 'Blank Form', { type: 'select', choices: ['Blank Form', ...memberService.list().map((member) => `${member.id} - ${member.fullName}`)] })}`, `${button('Print Preview', '', 'secondary', 'data-action="print-page"')}${button('Download PDF Placeholder', '', 'secondary', 'data-action="placeholder-export" data-message="PDF download placeholder. Use browser print for now."')}`)}
      <div class="forms-grid">
        ${forms
          .map(
            ([route, title]) => `
              <article class="summary-card">
                <h4>${escapeHtml(title)}</h4>
                <p class="muted">A4 printable template with blank and prefilled support.</p>
                ${button('Open Print Preview', `#/forms-printables/${route}`, 'primary')}
              </article>
            `,
          )
          .join('')}
      </div>
    </section>
  `;
}

function renderPrintable(id, state) {
  const app = state.loanApplications[0] || {
    id: 'APP-BLANK',
    borrowerName: '',
    memberId: '',
    requestedAmount: 0,
    approvedAmount: 0,
    termMonths: 12,
    applicationDate: '',
    computation: {
      loanAmount: 0,
      termMonths: 12,
      annualInterestRate: 14,
      processingFeeRate: 1,
      previousLoanBalance: 0,
      existingCapitalShare: 0,
      additionalCapitalShare: 0,
      savingsDeposit: 0,
      timeDeposit: 0,
      releaseDate: '',
      firstDueDate: '',
    },
  };
  const computed = calculateLoan(app.computation);
  const schedule = buildAmortizationSchedule(app.computation).slice(0, app.computation.termMonths || 12);
  const member = memberService.list()[0] || {};
  const pages = printablePages(id, member, app, computed, schedule);
  return printLayout(printableTitle(id), pages);
}

function printablePages(id, member, app, computed, schedule) {
  if (id === 'membership-form') {
    return [
      {
        subtitle: 'Membership Application Form',
        body: `
          ${printSection('Evaluation', [['Approved / Not Approved', ''], ['Member ID Number', member.id || '']])}
          ${printSection('Personal Information', [['Last Name', ''], ['Given Name', member.fullName || ''], ['Middle Name', ''], ['Date of Birth', ''], ['Place of Birth', ''], ['Gender', member.gender || ''], ['Civil Status', member.civilStatus || ''], ['TIN Number', member.tin || ''], ['Citizenship', 'Filipino'], ['Religion', ''], ['Highest Educational Attainment', ''], ['Average Monthly Income', '']])}
          ${printSection('Address and Contact', [['Present Address', member.address || ''], ['Permanent Address', ''], ['Mobile Number', member.mobile || ''], ['Telephone', ''], ['Email Address', ''], ['Facebook Link', ''], ['Emergency Contact Person and Number', '']])}
          ${printSection('Membership Payments', [['Membership Fee Amount', ''], ['Date Paid', ''], ['OR Number', ''], ['Share Capital Amount', ''], ['Time Deposit Amount', ''], ['Collected By', ''], ['Certified By', ''], ['Date Certified', '']])}
          <p class="print-consent">I consent to the collection, processing, and storage of my personal information for membership, loan evaluation, regulatory reporting, and cooperative operations in accordance with applicable data privacy rules.</p>
          <div class="signature-grid">${signatureLine('Applicant Signature')}${signatureLine('SACADA Treasurer')}${signatureLine('Certified By')}</div>
        `,
      },
    ];
  }
  if (id === 'loan-package') {
    return [
      { subtitle: "Page 1 - Member's Loan Application", body: loanApplicationPrint(app) },
      { subtitle: 'Page 2 - Promissory Note', body: promissoryPrint(app, computed) },
      { subtitle: 'Page 3 - Salary Deduction Agreement', body: salaryDeductionPrint(app, computed) },
      { subtitle: 'Page 4 - Truth in Lending Disclosure Statement', body: truthInLendingPrint(app, computed, schedule) },
      { subtitle: 'Page 5 - Data Privacy Consent and Personal Information', body: privacyPrint(member) },
      { subtitle: 'Page 6 - Employment / Self-Employment and Approval', body: approvalPrint(app) },
    ];
  }
  if (id === 'truth-in-lending' || id === 'statement-of-account') {
    return [{ subtitle: 'Truth in Lending / Statement of Account', body: truthInLendingPrint(app, computed, schedule) }];
  }
  if (id === 'authorization-slip') {
    return [{ subtitle: 'Authorization Slip', body: authorizationSlipPrint(app, computed) }];
  }
  if (id === 'bir-registry') {
    return [{ subtitle: 'BIR Tax-Exempt Registry', body: birPrintTable() }];
  }
  return [{ subtitle: printableTitle(id), body: genericPrintableBody(id) }];
}

function moduleShell(title, helper, cards, body) {
  return `
    <section class="page-header">
      <div>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(helper)}</p>
      </div>
      <div class="top-actions">
        ${button('Back', '#/dashboard', 'secondary')}
        ${button('Print', '', 'secondary', 'data-action="print-page"')}
      </div>
    </section>
    <div class="grid stats-grid">${cards.map(([label, value]) => statCard(label, value)).join('')}</div>
    <section class="panel" style="margin-top: 16px;">${body}</section>
  `;
}

function actionButtons(labels) {
  return `<div class="cell-actions">${labels.map((label) => button(label, '', label.includes('Print') ? 'secondary small' : 'secondary small', `data-action="placeholder-export" data-message="${escapeHtml(label)} placeholder."`)).join('')}</div>`;
}

const DASHBOARD_YEARS = ['2022', '2023', '2024', '2025', '2026'];

function genderRows(members) {
  if (!members.length) return [];
  const counts = { Male: 0, Female: 0, 'No Data': 0 };
  members.forEach((member) => {
    const gender = String(member.gender || '').trim().toLowerCase();
    if (gender === 'male') counts.Male += 1;
    else if (gender === 'female') counts.Female += 1;
    else counts['No Data'] += 1;
  });
  return Object.entries(counts)
    .filter(([, value]) => value)
    .map(([label, value]) => ({ label, value }));
}

function memberAcceptedYear(member) {
  const value = member.dateAccepted || member.date_accepted || member.acceptedDate || member.createdAt || member.created_at || '';
  const date = value ? new Date(`${String(value).slice(0, 10)}T00:00:00`) : null;
  return date && !Number.isNaN(date.getTime()) ? String(date.getFullYear()) : '';
}

function isRemovedMember(member) {
  return ['inactive', 'terminated'].includes(String(member.membershipStatus || '').trim().toLowerCase());
}

function yearlyMemberMovementRows(members) {
  return DASHBOARD_YEARS.map((year) => {
    const accepted = members.filter((member) => memberAcceptedYear(member) === year);
    return {
      label: year,
      members: accepted.filter((member) => !isRemovedMember(member)).length,
      removed: accepted.filter((member) => isRemovedMember(member)).length,
    };
  });
}

function isOutsideIlocosSur(member) {
  const province = String(member.province || '').trim().toLowerCase();
  return province && province !== 'ilocos sur';
}

function ilocosSurLocationRows(members) {
  if (!members.length) return [];
  const counts = members.reduce((acc, member) => {
    const label = isOutsideIlocosSur(member)
      ? 'Others'
      : member.barangay || member.city || member.municipality || 'No Data';
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).map(([label, value]) => ({ label, value }));
}

function countRows(rows, key, fallbackKey = '') {
  if (!rows.length) return [];
  const counts = rows.reduce((acc, row) => {
    const raw = row[key] || (fallbackKey ? row[fallbackKey] : '') || 'No Data';
    acc[raw] = (acc[raw] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).map(([label, value]) => ({ label, value }));
}

function countAmountRows(rows, groupKey, amountKey) {
  if (!rows.length) return [];
  const counts = rows.reduce((acc, row) => {
    const label = row[groupKey] || 'No Data';
    acc[label] = (acc[label] || 0) + Number(row[amountKey] || 0);
    return acc;
  }, {});
  return Object.entries(counts)
    .filter(([, value]) => value)
    .map(([label, value]) => ({ label, value, display: formatCurrency(value) }));
}

function incomeClassificationRows(members) {
  if (!members.length) return [];
  const buckets = [
    { label: 'Poor', max: 10597, tooltip: 'Below PHP 10,597' },
    { label: 'Low Income but Not Poor', max: 21194, tooltip: 'PHP 10,597-PHP 21,194' },
    { label: 'Lower Middle Class', max: 43828, tooltip: 'PHP 21,194-PHP 43,828' },
    { label: 'Middle Class', max: 76669, tooltip: 'PHP 43,828-PHP 76,669' },
    { label: 'Upper Middle Class', max: 131484, tooltip: 'PHP 76,669-PHP 131,484' },
    { label: 'Upper but Not Rich', max: 219140, tooltip: 'PHP 131,484-PHP 219,140' },
    { label: 'Rich', max: Infinity, tooltip: 'PHP 219,140 and above' },
  ];
  const counts = Object.fromEntries([...buckets.map((bucket) => [bucket.label, 0]), ['No Data', 0]]);
  members.forEach((member) => {
    const income = Number(member.averageMonthlyIncome || member.monthlyIncome || 0);
    if (!income) {
      counts['No Data'] += 1;
      return;
    }
    const bucket = buckets.find((item) => income < item.max);
    counts[bucket.label] += 1;
  });
  return [...buckets.map((bucket) => ({ ...bucket, value: counts[bucket.label] })), { label: 'No Data', value: counts['No Data'] }].filter((row) => row.value);
}

function ageGroupRows(members) {
  if (!members.length) return [];
  const counts = { 'Gen Z': 0, Millennials: 0, 'Gen X': 0, 'Senior Citizens': 0, 'No Data': 0 };
  const today = new Date();
  members.forEach((member) => {
    const value = member.birthDate || member.birthdate;
    const birthDate = value ? new Date(`${value}T00:00:00`) : null;
    if (!birthDate || Number.isNaN(birthDate.getTime())) {
      counts['No Data'] += 1;
      return;
    }
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 28) counts['Gen Z'] += 1;
    else if (age < 45) counts.Millennials += 1;
    else if (age < 60) counts['Gen X'] += 1;
    else counts['Senior Citizens'] += 1;
  });
  return Object.entries(counts)
    .filter(([, value]) => value)
    .map(([label, value]) => ({ label, value }));
}

function monthlyTrend(rows, valueKey, secondaryKey = '') {
  if (!rows.length) return [];
  const byMonth = rows.reduce((acc, row) => {
    const dateValue = row.date || row.paymentDate || row.applicationDate || row.releaseDate || row.investmentDate;
    if (!dateValue) return acc;
    const label = monthLabel(dateValue);
    acc[label] ||= { label };
    acc[label][valueKey] = (acc[label][valueKey] || 0) + Number(row[valueKey] || 0);
    if (secondaryKey) {
      acc[label][secondaryKey] = (acc[label][secondaryKey] || 0) + Number(row[secondaryKey] || 0);
    }
    return acc;
  }, {});
  return Object.values(byMonth);
}

function mergeMonthlyTrend(revenueRows, expenseRows) {
  const labels = [...new Set([...revenueRows.map((row) => row.label), ...expenseRows.map((row) => row.label)])];
  return labels.map((label) => {
    const revenue = revenueRows.find((row) => row.label === label)?.amountPaid || 0;
    const expenses = expenseRows.find((row) => row.label === label)?.amount || 0;
    return { label, revenue, expenses, surplus: revenue - expenses };
  });
}

function monthLabel(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'No Date';
  return date.toLocaleString('en-US', { month: 'short' });
}

function sum(rows, key) {
  return rows.reduce((total, row) => total + Number(row[key] || 0), 0);
}

function daysBetween(start, end) {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 0;
  return Math.ceil((endDate - startDate) / 86400000);
}

function financialStatementTable(rows) {
  return dataTable({
    columns: [
      { key: 'account', label: 'Account' },
      { key: 'current', label: 'Current Year', render: (row) => formatCurrency(row.current) },
      { key: 'previous', label: 'Previous Year', render: (row) => formatCurrency(row.previous) },
      { key: 'difference', label: 'Difference', render: (row) => formatCurrency(row.current - row.previous) },
      { key: 'change', label: 'Percentage Change', render: (row) => `${row.previous ? (((row.current - row.previous) / row.previous) * 100).toFixed(2) : '0.00'}%` },
    ],
    rows,
  });
}

function cashFlowPreview() {
  const rows = [
    { label: 'Beginning Cash on Hand and in Bank', value: 390000 },
    { label: 'Total Cash Inflows', value: 710000 },
    { label: 'Total Cash Outflows', value: -650000 },
    { label: 'Net Increase / Decrease in Cash', value: 60000 },
    { label: 'Ending Cash on Hand and in Bank', value: 450000 },
  ];
  return dataTable({ columns: [{ key: 'label', label: 'Cash Flow Item' }, { key: 'value', label: 'Amount', render: (row) => formatCurrency(row.value) }], rows });
}

function comparativePreview(rows) {
  return financialStatementTable(rows);
}

function dividendComputationTable() {
  const rows = [
    { type: 'Initial Share Capital', amount: 3500, date: '2026-01-15', shares: 35, days: 351, dividend: 374.1 },
    { type: 'Additional Share Capital', amount: 1000, date: '2026-06-15', shares: 10, days: 199, dividend: 60.55 },
  ];
  return dataTable({
    columns: [
      { key: 'type', label: 'Contribution Type' },
      { key: 'amount', label: 'Amount', render: (row) => formatCurrency(row.amount) },
      { key: 'date', label: 'Date Shared', render: (row) => formatDate(row.date) },
      { key: 'shares', label: 'Number of Shares' },
      { key: 'days', label: 'Number of Eligible Days' },
      { key: 'dividend', label: 'Estimated Dividend for Contribution', render: (row) => formatCurrency(row.dividend) },
    ],
    rows,
  });
}

function patronageComputationTable(rows) {
  return dataTable({
    columns: [
      { key: 'memberName', label: 'Member' },
      { key: 'loanParticipation', label: 'Loan Participation', render: (row) => formatCurrency(row.loanParticipation) },
      { key: 'collectedInterest', label: 'Collected Interest', render: (row) => formatCurrency(row.collectedInterest) },
      { key: 'allocationRate', label: 'Allocation Rate', render: (row) => `${row.allocationRate}%` },
      { key: 'estimatedRefund', label: 'Estimated Patronage Refund', render: (row) => formatCurrency(row.estimatedRefund) },
    ],
    rows,
  });
}

function printSection(title, rows) {
  return `
    <section class="print-section">
      <h2>${escapeHtml(title)}</h2>
      <div class="print-fields">
        ${rows.map(([label, value]) => `<div><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></div>`).join('')}
      </div>
    </section>
  `;
}

function loanApplicationPrint(app) {
  return `
    ${printSection("Member's Loan Application", [['Application Number', app.id], ['Date', formatDate(app.applicationDate)], ['Loan Amount', formatCurrency(app.approvedAmount || app.requestedAmount)], ['Loan Period', `${app.termMonths || 12} months`], ['Installment Type', app.installmentType || 'Monthly'], ['Purpose', app.purpose || 'Productive / Providential']])}
    <p>I hereby apply for a loan from SACADA and certify that the information supplied is true and correct.</p>
    <div class="signature-grid">${signatureLine('Borrower Signature', app.borrowerName)}${signatureLine('Co-Maker Signature')}${signatureLine('Witness Signature')}</div>
  `;
}

function promissoryPrint(app, computed) {
  return `
    ${printSection('Promissory Note', [['Application Number', app.id], ['Principal Amount', formatCurrency(computed.loanAmount)], ['Installment Amount', formatCurrency(computed.monthlyAmortization)], ['Start Date', formatDate(app.startDate)], ['End Date', formatDate(app.endDate)], ['Interest Rate', `${(computed.annualInterestRate * 100).toFixed(2)}% yearly`], ['Processing Fee', formatCurrency(computed.processingFee)], ['Penalty Terms', 'PHP 50 per month of delay']])}
    <p>In case of default, the borrower and co-maker agree to meet all loan obligations based on cooperative policies.</p>
    <div class="signature-grid">${signatureLine('Borrower Signature')}${signatureLine('Co-Maker Signature')}${signatureLine('Notary / Witness')}</div>
  `;
}

function salaryDeductionPrint(app, computed) {
  return `
    ${printSection('Salary Deduction Agreement', [['Application Number', app.id], ['Borrower Name', app.borrowerName], ['Employer', app.employerName || ''], ['Monthly Amortization', formatCurrency(computed.monthlyAmortization)], ['Date Signed', formatDate(app.dateSigned)]])}
    <p>I authorize payroll deduction for my SACADA loan amortization and related penalties if applicable.</p>
    ${signatureLine('Borrower Signature')}
  `;
}

function truthInLendingPrint(app, computed, schedule) {
  return `
    ${printSection('Truth in Lending / Statement of Account', [['Borrower Name', app.borrowerName], ['TIN', ''], ['Approved Loan Amount', formatCurrency(computed.loanAmount)], ['Interest Rate', `${(computed.annualInterestRate * 100).toFixed(2)}% yearly`], ['Number of Months Payable', computed.termMonths], ['Monthly Amortization', formatCurrency(computed.monthlyAmortization)], ['Principal Monthly Payment', formatCurrency(computed.principalPortion)], ['Monthly Interest and Collection Charge', formatCurrency(computed.interestPortion)], ['Total Loan Interest and Collection Charge', formatCurrency(computed.totalInterest)], ['Total Loan Amount Payable', formatCurrency(computed.totalPayable)], ['Balance from Previous Loans', formatCurrency(computed.previousLoanBalance)], ['Existing Capital Share', formatCurrency(computed.existingCapitalShare)], ['Additional Capital Share', formatCurrency(computed.additionalCapitalShare)], ['Processing Fee', formatCurrency(computed.processingFee)], ['Total Net Take-Home Pay', formatCurrency(computed.netTakeHome)]])}
    ${amortizationTable(schedule)}
    <p class="print-consent">Payment reminder: please pay on or before the due date to avoid penalties.</p>
    ${signatureLine('Borrower Acknowledgment and Signature')}
  `;
}

function privacyPrint(member) {
  return `
    <p class="print-consent">I consent to the use of my personal information for membership, loan processing, salary deduction coordination, reporting, and cooperative operations.</p>
    ${printSection('Personal Information', [['Full Name', member.fullName || ''], ['Birth Details', ''], ['Sex', member.gender || ''], ['Civil Status', member.civilStatus || ''], ['Present Address', member.address || ''], ['Permanent Address', ''], ['Housing Status', ''], ['Nationality / Citizenship', 'Filipino'], ['Contact Information', member.mobile || ''], ['Occupation', member.profession || ''], ['Employment Status', ''], ['Monthly Salary', '']])}
    ${signatureLine('Borrower Signature')}
  `;
}

function approvalPrint(app) {
  return `
    ${printSection('Employment / Self-Employment and Approval', [['Employment Certification', ''], ['Self-Employment Business Type', ''], ['Monthly Income', ''], ['Farming / Livestock Information', ''], ['Time Deposit', formatCurrency(app.computation?.timeDeposit || 0)], ['Received By', app.receivedBy || ''], ['Date Received', formatDate(app.dateReceived)], ['Credit Committee Evaluation', app.recommendation || ''], ['Board Recommendation', app.boardDecision || ''], ['Approval / Disapproval', app.status || '']])}
    <div class="signature-grid">${signatureLine('Borrower Certification')}${signatureLine('Credit Committee')}${signatureLine('Board Signature')}</div>
  `;
}

function authorizationSlipPrint(app, computed) {
  return `
    ${printSection('Authorization Slip', [['Employer / LGU', app.employerName || ''], ['Borrower Name', app.borrowerName || ''], ['Monthly Loan Payment', formatCurrency(computed.monthlyAmortization)], ['Payment Month', ''], ['Amount in Figures', formatCurrency(computed.monthlyAmortization)], ['Amount in Words', 'Amount in words placeholder'], ['Employee Position', app.position || ''], ['Date', formatDate(new Date().toISOString().slice(0, 10))]])}
    ${signatureLine('Employee Signature')}
  `;
}

function birPrintTable() {
  return dataTable({
    columns: [
      { key: 'number', label: 'No.' },
      { key: 'fullName', label: 'Member Name' },
      { key: 'tin', label: 'TIN' },
      { key: 'birthdate', label: 'Birthdate', render: (row) => formatDate(row.birthdate) },
      { key: 'address', label: 'Address' },
      { key: 'capitalShare', label: 'Capital Share', render: (row) => formatCurrency(row.capitalShare) },
    ],
    rows: birRegistryService.list().filter((row) => row.included === 'Yes'),
  });
}

function genericPrintableBody(id) {
  return `
    ${printSection(printableTitle(id), [['Select Existing Record', 'Blank / Prefilled'], ['Prepared By', ''], ['Certified By', ''], ['Date', formatDate(new Date().toISOString().slice(0, 10))]])}
    <div class="signature-grid">${signatureLine('Prepared By')}${signatureLine('Certified By')}${signatureLine('Received By')}</div>
  `;
}

function printableTitle(id) {
  const titles = {
    'membership-form': 'SACADA Membership Form',
    'loan-package': 'SACADA Loan Application Package',
    'promissory-note': 'Promissory Note',
    'salary-deduction': 'Salary Deduction Agreement',
    'truth-in-lending': 'Truth in Lending Disclosure Statement',
    'privacy-form': 'Loan Data Privacy and Personal Information Form',
    'employment-certification': 'Employment / Self-Employment Certification',
    'statement-of-account': 'Statement of Account',
    'authorization-slip': 'Salary Deduction Authorization Slip',
    'member-ledger': 'Member Capital Ledger',
    'time-deposit-statement': 'Time Deposit Statement',
    'dividend-statement': 'Dividend Statement',
    'patronage-statement': 'Patronage Statement',
    'bir-registry': 'BIR Tax-Exempt Registry',
    'financial-statements': 'Financial Statements',
  };
  return titles[id] || 'Printable Form';
}
