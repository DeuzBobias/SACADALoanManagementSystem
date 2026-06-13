export const navItems = [
  { id: 'dashboard', label: 'Dashboard', href: '#/dashboard', icon: 'DB' },
  { id: 'members', label: 'Members / KYC', href: '#/members', icon: 'KY' },
  { id: 'applications', label: 'Loan Applications', href: '#/loan-applications', icon: 'LA' },
  { id: 'active-loans', label: 'Active Loans', href: '#/active-loans', icon: 'AL' },
  { id: 'payments', label: 'Payments', href: '#/payments', icon: 'PM' },
  { id: 'reports', label: 'Reports', href: '#/reports', icon: 'RP' },
  { id: 'settings', label: 'Settings', href: '#/settings', icon: 'ST' },
];

export const defaultTheme = {
  primary: '#237a3b',
  secondary: '#1f6f9e',
  accent: '#d99a22',
  background: '#f4f7f5',
  text: '#1d2b24',
  sidebar: '#173f2a',
  button: '#237a3b',
};

export const themePresets = [
  {
    name: 'SACADA Default',
    theme: defaultTheme,
  },
  {
    name: 'Blue Office',
    theme: {
      primary: '#1f5f99',
      secondary: '#2f80c0',
      accent: '#d39b2a',
      background: '#f3f7fb',
      text: '#1e2b36',
      sidebar: '#173a59',
      button: '#1f5f99',
    },
  },
  {
    name: 'Green Cooperative',
    theme: {
      primary: '#2f7d32',
      secondary: '#4f8f54',
      accent: '#c8942c',
      background: '#f5f8f1',
      text: '#243123',
      sidebar: '#214f2c',
      button: '#2f7d32',
    },
  },
  {
    name: 'High Contrast',
    theme: {
      primary: '#005a32',
      secondary: '#004c8c',
      accent: '#b85c00',
      background: '#ffffff',
      text: '#111111',
      sidebar: '#111111',
      button: '#005a32',
    },
  },
  {
    name: 'Light Minimal',
    theme: {
      primary: '#376c55',
      secondary: '#5b7891',
      accent: '#a87628',
      background: '#fafafa',
      text: '#24302a',
      sidebar: '#33423a',
      button: '#376c55',
    },
  },
];

export const members = [];
export const loanApplications = [];
export const activeLoans = [];
export const payments = [];

export const reportTypes = [
  'Member Registry Report',
  'Loan Application Report',
  'Statement of Account',
  'Collection Report',
  'Delinquent Loans Report',
  'Capital Share Report',
  'Time Deposit Report',
  'Demographics Report',
  'Financial Summary Report',
];

export const requirementItems = [
  'Membership Form Completed',
  'Loan Application Form Completed',
  'Valid ID Submitted',
  'TIN Number Provided',
  'PMES Completed',
  'Membership Fee Paid',
  'At least PHP 2,000 Share Capital',
  'Savings Deposit',
  'Time Deposit',
  'Co-maker Confirmed',
  'Employment Certification Submitted',
  'Salary Deduction Agreement Signed',
  'Data Privacy Consent Signed',
  'Promissory Note Signed',
  'DTI Registration, if self-employed',
  "Mayor's Permit, if self-employed",
  'Other Supporting Documents',
];
