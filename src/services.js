import { supabase } from './supabaseClient.js';

const mockMembers = [
  {
    id: 'M-0001',
    fullName: 'Sample Member 001',
    tin: '000-000-001-000',
    membershipType: 'Regular',
    dateAccepted: '2026-01-15',
    boardResolution: 'BR-2026-001',
    barangay: 'Poblacion',
    mobile: '0917-000-0001',
    gender: 'Female',
    civilStatus: 'Married',
    profession: 'Teacher',
    specialization: 'Education',
    sharesSubscribed: 50,
    shareValue: 100,
    amountSubscribed: 5000,
    paidUpShareCapital: 3500,
    regularSavings: 1200,
    timeDeposits: 10000,
    accountsReceivable: 0,
    membershipStatus: 'Active',
    hasActiveLoan: true,
    hasTimeDeposit: true,
  },
  {
    id: 'M-0002',
    fullName: 'Sample Member 002',
    tin: '000-000-002-000',
    membershipType: 'Associate',
    dateAccepted: '2026-02-20',
    boardResolution: 'BR-2026-002',
    barangay: 'Cabittaogan',
    mobile: '0917-000-0002',
    gender: 'Male',
    civilStatus: 'Single',
    profession: 'Driver / TODA',
    specialization: 'Driving / Transportation',
    sharesSubscribed: 25,
    shareValue: 100,
    amountSubscribed: 2500,
    paidUpShareCapital: 1800,
    regularSavings: 600,
    timeDeposits: 0,
    accountsReceivable: 12500,
    membershipStatus: 'Active',
    hasActiveLoan: true,
    hasTimeDeposit: false,
  },
];

const capitalTransactions = [
  { id: 'CAP-0001', memberId: 'M-0001', memberName: 'Sample Member 001', type: 'Initial Share Capital', shares: 35, amount: 3500, date: '2026-01-15', orNumber: 'OR-CAP-0001', remarks: 'Initial payment', encodedBy: 'Admin' },
  { id: 'CAP-0002', memberId: 'M-0001', memberName: 'Sample Member 001', type: 'Regular Savings Deposit', shares: 0, amount: 1200, date: '2026-03-10', orNumber: 'OR-SAV-0001', remarks: 'Savings deposit', encodedBy: 'Admin' },
  { id: 'CAP-0003', memberId: 'M-0002', memberName: 'Sample Member 002', type: 'Capital Subscription Payment', shares: 18, amount: 1800, date: '2026-02-20', orNumber: 'OR-CAP-0002', remarks: 'Partial paid-up capital', encodedBy: 'Admin' },
];

const delinquentLoans = [
  { loanNumber: 'DL-0001', voucherNumber: 'V-0001', borrower: 'Sample Member 002', memberId: 'M-0002', contact: '0917-000-0002', barangay: 'Cabittaogan', originalAmount: 30000, term: '12 months', totalPayable: 34200, monthlyPayment: 2850, totalPayments: 17100, arrears: 5700, penalty: 100, lastPaymentDate: '2026-03-30', monthsDelayed: 2, collectionStatus: 'For Follow-Up' },
  { loanNumber: 'DL-0002', voucherNumber: 'V-0002', borrower: 'Sample Member 003', memberId: 'M-0003', contact: '0917-000-0003', barangay: 'Subec', originalAmount: 50000, term: '18 months', totalPayable: 60500, monthlyPayment: 3361.11, totalPayments: 20166.66, arrears: 10083.33, penalty: 150, lastPaymentDate: '2026-02-28', monthsDelayed: 3, collectionStatus: 'Contacted' },
];

const timeDeposits = [
  { id: 'TD-0001', memberName: 'Sample Member 001', memberId: 'M-0001', principal: 10000, investmentDate: '2026-01-15', maturityDate: '2026-12-15', annualRate: 5, convertedAmount: 0, convertedDate: '', orNumber: 'OR-TD-0001', status: 'Active', remarks: 'One-year time deposit' },
  { id: 'TD-0002', memberName: 'Sample Investor 001', memberId: 'INV-0001', principal: 25000, investmentDate: '2025-09-15', maturityDate: '2026-07-15', annualRate: 5, convertedAmount: 0, convertedDate: '', orNumber: 'OR-TD-0002', status: 'Maturing Soon', remarks: 'Matures within 60 days' },
];

const expenses = [
  { id: 'EXP-0001', date: '2026-01-12', category: 'Office Supplies', payee: 'Office Supplier', amount: 8500, reference: 'EXP-OR-0001', status: 'Approved', remarks: 'Paper and folders' },
  { id: 'EXP-0002', date: '2026-02-18', category: "Officers' Honorarium", payee: 'Board Officers', amount: 18000, reference: 'EXP-OR-0002', status: 'Approved', remarks: 'Monthly honorarium' },
  { id: 'EXP-0003', date: '2026-03-08', category: 'Trainings and Seminars', payee: 'Training Provider', amount: 11000, reference: 'EXP-OR-0003', status: 'For Approval', remarks: 'Staff training' },
];

const dividends = [
  { id: 'DIV-2026-0001', memberId: 'M-0001', memberName: 'Sample Member 001', tin: '000-000-001-000', paidUpShareCapital: 3500, shares: 35, estimatedDividend: 388.5, approvedDividend: 0, amountPaid: 0, status: 'Calculated', datePaid: '', orNumber: '' },
  { id: 'DIV-2026-0002', memberId: 'M-0002', memberName: 'Sample Member 002', tin: '000-000-002-000', paidUpShareCapital: 1800, shares: 18, estimatedDividend: 199.8, approvedDividend: 0, amountPaid: 0, status: 'Draft', datePaid: '', orNumber: '' },
];

const patronage = [
  { id: 'PAT-2026-0001', memberId: 'M-0001', memberName: 'Sample Member 001', tin: '000-000-001-000', loanParticipation: 50000, collectedInterest: 5800, basis: 'Loan interest paid', allocationRate: 25.9, estimatedRefund: 1502.2, approvedRefund: 0, amountPaid: 0, status: 'Calculated', paymentDate: '', orNumber: '', remarks: '' },
  { id: 'PAT-2026-0002', memberId: 'M-0002', memberName: 'Sample Member 002', tin: '000-000-002-000', loanParticipation: 30000, collectedInterest: 2900, basis: 'Loan interest paid', allocationRate: 25.9, estimatedRefund: 751.1, approvedRefund: 0, amountPaid: 0, status: 'Draft', paymentDate: '', orNumber: '', remarks: '' },
];

const birRegistry = [
  { number: 1, memberId: 'M-0001', surname: 'Member', givenName: 'Sample 001', middleName: '', fullName: 'Sample Member 001', tin: '000-000-001-000', birthdate: '1980-01-01', barangay: 'Poblacion', municipality: 'Vigan City', province: 'Ilocos Sur', address: 'Poblacion, Vigan City, Ilocos Sur', capitalShare: 3500, included: 'Yes', remarks: 'Included by administrator' },
  { number: 2, memberId: 'M-0002', surname: 'Member', givenName: 'Sample 002', middleName: '', fullName: 'Sample Member 002', tin: '000-000-002-000', birthdate: '1985-02-02', barangay: 'Cabittaogan', municipality: 'Vigan City', province: 'Ilocos Sur', address: 'Cabittaogan, Vigan City, Ilocos Sur', capitalShare: 1800, included: 'No', remarks: 'Pending review' },
];

const financialStatement = {
  position: [
    { account: 'Cash on Hand and in Bank', current: 450000, previous: 390000 },
    { account: 'Loans Receivable', current: 1140000, previous: 980000 },
    { account: 'Time Deposits', current: 35000, previous: 22000 },
    { account: 'Property and Equipment', current: 125000, previous: 130000 },
    { account: 'Accounts Payable', current: 78000, previous: 65000 },
    { account: 'Members Equity', current: 1267000, previous: 1120000 },
  ],
  operations: [
    { account: 'Interest Income from Loans', amount: 42000 },
    { account: 'Service or Collection Fees', amount: 18500 },
    { account: 'Membership Fees', amount: 6000 },
    { account: 'Fines and Penalties', amount: 2500 },
    { account: 'Office Supplies', amount: -18500 },
    { account: "Officers' Honorarium", amount: -52000 },
    { account: 'Travel and Transportation', amount: -16000 },
    { account: 'Miscellaneous Expenses', amount: -6200 },
  ],
  allocation: [
    { name: 'Reserve Fund', percentage: 50, manualAdjustment: 0, remarks: '' },
    { name: 'CETF - Federation / Union', percentage: 0, manualAdjustment: 0, remarks: 'Configurable' },
    { name: 'CETF - Local', percentage: 3, manualAdjustment: 0, remarks: '' },
    { name: 'Community Development Fund', percentage: 5, manualAdjustment: 0, remarks: '' },
    { name: 'Optional Fund', percentage: 5, manualAdjustment: 0, remarks: '' },
    { name: 'Interest on Share Capital', percentage: 11.1, manualAdjustment: 0, remarks: '' },
    { name: 'Patronage Refund', percentage: 25.9, manualAdjustment: 0, remarks: '' },
  ],
};

const dataSets = {
  members: mockMembers,
  capitalTransactions,
  delinquentLoans,
  timeDeposits,
  expenses,
  dividends,
  patronage,
  birRegistry,
  financialStatement,
};

const serviceTables = {
  members: 'members',
  capitalTransactions: 'capital_transactions',
  delinquentLoans: 'delinquent_loans',
  timeDeposits: 'time_deposits',
  expenses: 'expenses',
  dividends: 'dividends',
  patronage: 'patronage',
  birRegistry: 'bir_registry',
};

const cache = {};

function emptyToNull(value) {
  return value === '' || value === undefined ? null : value;
}

function numberOrZero(value) {
  return Number(value || 0);
}

function memberFromDb(row) {
  return {
    id: row.id,
    lastName: row.surname || '',
    firstName: row.given_name || '',
    middleName: row.middle_name || '',
    surname: row.surname || '',
    givenName: row.given_name || '',
    fullName: row.full_name || `${row.surname || ''}, ${row.given_name || ''} ${row.middle_name || ''}`.trim(),
    tin: row.tin || '',
    dateAccepted: row.date_accepted || '',
    boardResolution: row.board_resolution || '',
    membershipType: row.membership_type || 'Regular',
    sharesSubscribed: numberOrZero(row.shares_subscribed),
    shareValue: 100,
    amountSubscribed: numberOrZero(row.amount_subscribed),
    paidUpShareCapital: numberOrZero(row.paid_up_share_capital),
    shareCapital: numberOrZero(row.paid_up_share_capital),
    regularSavings: numberOrZero(row.regular_savings),
    timeDeposits: numberOrZero(row.time_deposits),
    timeDeposit: numberOrZero(row.time_deposits),
    accountsReceivable: numberOrZero(row.accounts_receivable),
    gender: row.gender || '',
    birthPlace: row.birth_place || '',
    birthDate: row.birthdate || '',
    birthdate: row.birthdate || '',
    civilStatus: row.civil_status || '',
    education: row.education || '',
    specialization: row.specialization || '',
    barangay: row.barangay || '',
    city: row.municipality || '',
    municipality: row.municipality || '',
    citizenship: row.citizenship || '',
    religion: row.religion || '',
    mobile: row.mobile || '',
    telephone: row.telephone || '',
    email: row.email || '',
    facebook: row.facebook || '',
    emergencyContact: row.emergency_contact || '',
    emergencyNumber: row.emergency_number || '',
    profession: row.profession || '',
    occupation: row.profession || '',
    employerName: row.employer || '',
    position: row.position || '',
    employmentStatus: row.employment_status || '',
    employmentDate: row.employment_date || '',
    yearsInService: numberOrZero(row.years_in_service),
    averageMonthlyIncome: numberOrZero(row.estimated_monthly_income),
    coMaker: row.co_maker || '',
    investorGuarantor: row.investor_guarantor || '',
    membershipStatus: row.membership_status || 'Active',
    initials: `${(row.given_name || 'N').charAt(0)}${(row.surname || 'M').charAt(0)}`.toUpperCase(),
    ...(row.extra_data || {}),
  };
}

function memberToDb(member) {
  return {
    id: member.id,
    surname: emptyToNull(member.lastName || member.surname),
    given_name: emptyToNull(member.firstName || member.givenName),
    middle_name: emptyToNull(member.middleName),
    tin: emptyToNull(member.tin),
    date_accepted: emptyToNull(member.dateAccepted),
    board_resolution: emptyToNull(member.boardResolution),
    membership_type: emptyToNull(member.membershipType),
    shares_subscribed: numberOrZero(member.sharesSubscribed),
    amount_subscribed: numberOrZero(member.amountSubscribed),
    paid_up_share_capital: numberOrZero(member.paidUpShareCapital || member.shareCapital),
    regular_savings: numberOrZero(member.regularSavings),
    time_deposits: numberOrZero(member.timeDeposits || member.timeDeposit),
    accounts_receivable: numberOrZero(member.accountsReceivable),
    gender: emptyToNull(member.gender),
    birth_place: emptyToNull(member.birthPlace),
    birthdate: emptyToNull(member.birthDate || member.birthdate),
    civil_status: emptyToNull(member.civilStatus),
    education: emptyToNull(member.education),
    specialization: emptyToNull(member.specialization),
    barangay: emptyToNull(member.barangay),
    municipality: emptyToNull(member.city || member.municipality),
    citizenship: emptyToNull(member.citizenship),
    religion: emptyToNull(member.religion),
    mobile: emptyToNull(member.mobile),
    telephone: emptyToNull(member.telephone),
    email: emptyToNull(member.email),
    facebook: emptyToNull(member.facebook),
    emergency_contact: emptyToNull(member.emergencyContact),
    emergency_number: emptyToNull(member.emergencyNumber),
    profession: emptyToNull(member.profession || member.occupation),
    employer: emptyToNull(member.employerName || member.employer),
    position: emptyToNull(member.position),
    employment_status: emptyToNull(member.employmentStatus),
    employment_date: emptyToNull(member.employmentDate),
    years_in_service: numberOrZero(member.yearsInService),
    estimated_monthly_income: numberOrZero(member.averageMonthlyIncome || member.monthlyIncome || member.monthlySalary),
    co_maker: emptyToNull(member.coMaker),
    investor_guarantor: emptyToNull(member.investorGuarantor),
    membership_status: emptyToNull(member.membershipStatus || 'Active'),
    extra_data: {
      extension: member.extension || '',
      presentAddress: member.presentAddress || '',
      permanentAddress: member.permanentAddress || '',
      province: member.province || '',
      zip: member.zip || '',
      remarks: member.remarks || '',
    },
  };
}

function capitalFromDb(row) {
  return {
    id: row.id,
    memberId: row.member_id || '',
    memberName: row.member_name || '',
    type: row.transaction_type || '',
    shares: numberOrZero(row.shares),
    amount: numberOrZero(row.amount),
    date: row.transaction_date || '',
    orNumber: row.or_number || '',
    remarks: row.remarks || '',
    encodedBy: row.encoded_by || '',
  };
}

function delinquentLoanFromDb(row) {
  return {
    loanNumber: row.id,
    voucherNumber: '',
    borrower: row.borrower || '',
    memberId: row.member_id || '',
    contact: row.contact_details || '',
    barangay: row.barangay || '',
    originalAmount: 0,
    term: '',
    totalPayable: 0,
    monthlyPayment: numberOrZero(row.monthly_payment),
    totalPayments: 0,
    arrears: numberOrZero(row.arrears),
    penalty: numberOrZero(row.penalty),
    lastPaymentDate: row.last_payment || '',
    monthsDelayed: numberOrZero(row.months_delayed),
    collectionStatus: row.collection_status || 'For Follow-Up',
  };
}

function timeDepositFromDb(row) {
  const annualRate = numberOrZero(row.annual_rate);
  return {
    id: row.id,
    memberId: row.member_id || '',
    memberName: row.member_name || '',
    principal: numberOrZero(row.principal),
    investmentDate: row.investment_date || '',
    maturityDate: row.maturity_date || '',
    annualRate: annualRate <= 1 ? annualRate * 100 : annualRate,
    earnedInterest: numberOrZero(row.earned_interest),
    convertedAmount: numberOrZero(row.converted_amount),
    status: row.status || 'Active',
    remarks: row.remarks || '',
  };
}

function expenseFromDb(row) {
  return {
    id: row.id,
    date: row.expense_date || '',
    category: row.category || 'Miscellaneous Expenses',
    payee: row.particular || '',
    amount: numberOrZero(row.amount),
    reference: row.reference_no || '',
    status: 'Approved',
    remarks: row.remarks || '',
  };
}

function dividendFromDb(row) {
  return {
    id: row.id,
    memberId: row.member_id || '',
    memberName: row.member_name || '',
    tin: row.tin || '',
    paidUpShareCapital: numberOrZero(row.total_paid_up_share),
    shares: numberOrZero(row.total_shares),
    estimatedDividend: numberOrZero(row.estimated_dividend),
    approvedDividend: numberOrZero(row.approved_dividend),
    amountPaid: numberOrZero(row.amount_paid),
    status: row.status || 'Draft',
    datePaid: row.date_paid || '',
    orNumber: row.or_number || '',
  };
}

function patronageFromDb(row) {
  return {
    id: row.id,
    memberId: row.member_id || '',
    memberName: row.member_name || '',
    tin: row.tin || '',
    loanParticipation: numberOrZero(row.accounts_receivable),
    collectedInterest: numberOrZero(row.estimated_collected_loan_interest),
    basis: 'Loan interest paid',
    allocationRate: 25.9,
    estimatedRefund: numberOrZero(row.estimated_collected_loan_interest) * 0.259,
    approvedRefund: numberOrZero(row.approved_refund),
    amountPaid: numberOrZero(row.amount_paid),
    status: row.status || 'Draft',
  };
}

function birRegistryFromDb(row, index) {
  return {
    number: index + 1,
    memberId: row.member_id || '',
    surname: row.surname || '',
    givenName: row.given_name || '',
    middleName: row.middle_name || '',
    fullName: `${row.surname || ''}, ${row.given_name || ''} ${row.middle_name || ''}`.trim(),
    tin: row.tin || '',
    birthdate: row.birthdate || '',
    barangay: row.barangay || '',
    municipality: row.municipality || '',
    province: row.province || '',
    address: [row.barangay, row.municipality, row.province].filter(Boolean).join(', '),
    capitalShare: numberOrZero(row.capital_share),
    included: row.included ? 'Yes' : 'No',
    remarks: row.remarks || '',
  };
}

const fromDbMappers = {
  members: (rows) => rows.map(memberFromDb),
  capitalTransactions: (rows) => rows.map(capitalFromDb),
  delinquentLoans: (rows) => rows.map(delinquentLoanFromDb),
  timeDeposits: (rows) => rows.map(timeDepositFromDb),
  expenses: (rows) => rows.map(expenseFromDb),
  dividends: (rows) => rows.map(dividendFromDb),
  patronage: (rows) => rows.map(patronageFromDb),
  birRegistry: (rows) => rows.map(birRegistryFromDb),
};

const toDbMappers = {
  members: (records) => records.map(memberToDb),
};

async function loadRemoteData(name) {
  const table = serviceTables[name];
  if (!table) return structuredClone(dataSets[name] || []);
  const { data, error } = await supabase.from(table).select('*');
  if (error) throw error;
  return (fromDbMappers[name] || ((rows) => rows))(data || []);
}

async function saveRemoteData(name, records) {
  const table = serviceTables[name];
  const mapper = toDbMappers[name];
  if (!table || !mapper) return records;
  const { error } = await supabase.from(table).upsert(mapper(records), { onConflict: 'id' });
  if (error) throw error;
  return records;
}

function createService(name) {
  cache[name] = serviceTables[name] ? [] : structuredClone(dataSets[name] || []);
  return {
    list() {
      return cache[name];
    },
    async load() {
      cache[name] = await loadRemoteData(name);
      return cache[name];
    },
    async save(records) {
      cache[name] = records;
      await saveRemoteData(name, records);
      return records;
    },
    reset() {
      cache[name] = serviceTables[name] ? [] : structuredClone(dataSets[name] || []);
      return cache[name];
    },
  };
}

export const memberService = createService('members');
export const capitalService = createService('capitalTransactions');
export const delinquentLoanService = createService('delinquentLoans');
export const timeDepositService = createService('timeDeposits');
export const expenseService = createService('expenses');
export const dividendService = createService('dividends');
export const patronageService = createService('patronage');
export const birRegistryService = createService('birRegistry');
export const financialService = createService('financialStatement');

export async function initializeServices() {
  const results = await Promise.allSettled([
    memberService.load(),
    capitalService.load(),
    delinquentLoanService.load(),
    timeDepositService.load(),
    expenseService.load(),
    dividendService.load(),
    patronageService.load(),
    birRegistryService.load(),
  ]);
  return results
    .map((result, index) => ({ result, name: Object.keys(serviceTables)[index] }))
    .filter(({ result }) => result.status === 'rejected')
    .map(({ result, name }) => ({ name, error: result.reason }));
}
