const STORAGE_PREFIX = 'sacada-lms-';

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

function getStorageKey(name) {
  return `${STORAGE_PREFIX}${name}`;
}

function readData(name) {
  const saved = localStorage.getItem(getStorageKey(name));
  if (!saved) return structuredClone(dataSets[name] || []);
  try {
    return JSON.parse(saved);
  } catch {
    return structuredClone(dataSets[name] || []);
  }
}

function writeData(name, records) {
  localStorage.setItem(getStorageKey(name), JSON.stringify(records));
  return records;
}

function createService(name) {
  return {
    list() {
      return readData(name);
    },
    save(records) {
      return writeData(name, records);
    },
    reset() {
      localStorage.removeItem(getStorageKey(name));
      return readData(name);
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
