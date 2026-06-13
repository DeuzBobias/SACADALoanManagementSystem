import {
  activeLoans as seedActiveLoans,
  defaultTheme,
  loanApplications as seedLoanApplications,
  members as seedMembers,
  navItems,
  payments as seedPayments,
  reportTypes,
  requirementItems,
  themePresets,
} from './data.js';
import {
  buildAmortizationSchedule,
  calculateLoan,
  formatCurrency,
  formatDate,
  formatNumber,
  toNumber,
} from './calculations.js';
import {
  amortizationTable,
  button,
  columnVisibilityMenu,
  computationOutputs,
  dataTable,
  emptyState,
  escapeHtml,
  field,
  formSection,
  statCard,
  statusBadge,
  summaryCard,
} from './components.js';
import {
  extendedRouteTitles,
  getExtendedActiveNav,
  renderEnhancedDashboard,
  renderExtendedRoute,
} from './extendedPages.js';
import {
  initializeServices,
  loadLoanAndPaymentState,
  loanService,
  memberService,
  paymentService,
} from './services.js';

const app = document.querySelector('#app');
const storedTheme = localStorage.getItem('sacada-theme');

app.innerHTML = '<div class="loading-state">Loading SACADA records...</div>';
const serviceErrors = await initializeServices();
let remoteLoanPaymentState = { loans: [], payments: [] };
try {
  remoteLoanPaymentState = await loadLoanAndPaymentState();
} catch (error) {
  console.error('Supabase loan/payment load failed.', error);
  serviceErrors.push({ name: 'loans/payments', error });
}

const state = {
  members: seedMembers.length ? structuredClone(seedMembers) : memberService.list(),
  loanApplications: remoteLoanPaymentState.loans.length ? remoteLoanPaymentState.loans.map(remoteLoanToApplication) : structuredClone(seedLoanApplications),
  activeLoans: remoteLoanPaymentState.loans.length ? remoteLoanPaymentState.loans : structuredClone(seedActiveLoans),
  payments: remoteLoanPaymentState.payments.length ? remoteLoanPaymentState.payments : structuredClone(seedPayments),
  route: location.hash || '#/dashboard',
  memberFilters: {
    search: '',
    status: 'All',
    barangay: 'All',
    gender: 'All',
    civilStatus: 'All',
    membershipType: 'All',
    specialization: 'All',
  },
  loanFilters: {
    search: '',
    status: 'All',
  },
  activeLoanFilters: {
    search: '',
    status: 'All',
  },
  reportFilters: {
    type: reportTypes[0],
    search: '',
    status: 'All',
    from: '2026-01-01',
    to: '2026-12-31',
  },
  sort: {
    members: { key: 'id', direction: 'asc' },
    applications: { key: 'applicationDate', direction: 'desc' },
    activeLoans: { key: 'nextDueDate', direction: 'asc' },
  },
  memberTab: 'Personal Information',
  memberDraft: null,
  memberDraftKey: '',
  loanStep: 1,
  theme: storedTheme ? JSON.parse(storedTheme) : structuredClone(defaultTheme),
  themeDraft: storedTheme ? JSON.parse(storedTheme) : structuredClone(defaultTheme),
  notice: serviceErrors.length ? `Some Supabase tables could not load: ${serviceErrors.map((item) => item.name).join(', ')}.` : '',
  confirm: null,
  scrollTopOnRender: false,
};

const memberTabs = [
  'Overview',
  'Personal Information',
  'Membership',
  'Capital Subscription',
  'Address and Contact',
  'Education and Specialization',
  'Employment / Business',
  'Financial Services',
  'Loans',
  'Payments',
  'Time Deposits',
  'Dividends',
  'Patronage',
  'Documents',
];

const loanSteps = [
  'Borrower',
  'Loan Details',
  'Co-Maker',
  'Employment / Salary Deduction',
  'Requirements Checklist',
  'Approval',
];

function applyTheme(theme) {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', theme.primary);
  root.style.setProperty('--color-secondary', theme.secondary);
  root.style.setProperty('--color-accent', theme.accent);
  root.style.setProperty('--color-background', theme.background);
  root.style.setProperty('--color-surface', theme.surface || '#ffffff');
  root.style.setProperty('--color-text', theme.text);
  root.style.setProperty('--color-sidebar', theme.sidebar);
  root.style.setProperty('--color-button', theme.button);
  root.style.setProperty('--color-border', theme.border || '#d8e0da');
  root.style.setProperty('--color-success', theme.success || theme.primary);
  root.style.setProperty('--color-warning', theme.warning || '#b36b00');
  root.style.setProperty('--color-danger', theme.danger || '#b42318');
  const palette = String(theme.chartPalette || '#237a3b,#1f6f9e,#d99a22,#7c3aed,#0f8b8d,#b42318').split(',');
  palette.forEach((color, index) => root.style.setProperty(`--chart-${index + 1}`, color.trim()));
}

function routeParts() {
  return state.route.split('?')[0].replace('#/', '').split('/').filter(Boolean);
}

function activeNavId() {
  const [section] = routeParts();
  if (!section || section === 'dashboard') return 'dashboard';
  if (section === 'members') return 'members';
  const extendedNav = getExtendedActiveNav(section);
  if (extendedNav) return extendedNav;
  if (section === 'loan-applications') return 'applications';
  if (section === 'active-loans') return 'active-loans';
  if (section === 'payments') return 'payments';
  if (section === 'reports') return 'reports';
  if (section === 'settings') return 'settings';
  return 'dashboard';
}

function pageTitle() {
  const [section, id] = routeParts();
  if (!section || section === 'dashboard') return ['Dashboard', 'Home / Dashboard'];
  if (extendedRouteTitles[section]) return extendedRouteTitles[section];
  if (section === 'members' && id === 'new') return ['Add Member', 'Members / Add Member'];
  if (section === 'members' && id) return ['Member Profile', `Members / ${id}`];
  if (section === 'members') return ['Members / KYC', 'Home / Members'];
  if (section === 'loan-applications' && id === 'new') return ['New Loan Application', 'Loan Applications / New Loan'];
  if (section === 'loan-applications' && id) return ['Loan Application Details', `Loan Applications / ${id}`];
  if (section === 'loan-applications') return ['Loan Applications', 'Home / Loan Applications'];
  if (section === 'active-loans' && id) return ['Loan Account Details', `Active Loans / ${id}`];
  if (section === 'active-loans') return ['Active Loans', 'Home / Active Loans'];
  if (section === 'payments' && id === 'history') return ['Payment History', 'Payments / History'];
  if (section === 'payments') return ['Record Payment', 'Home / Payments'];
  if (section === 'reports') return ['Reports', 'Home / Reports'];
  if (section === 'settings') return ['Settings', 'Home / Settings'];
  return ['Dashboard', 'Home / Dashboard'];
}

function renderShell() {
  const [title, crumb] = pageTitle();
  const notice = state.notice;
  app.innerHTML = `
    <div class="app-shell">
      ${renderSidebar()}
      <div class="content">
        <header class="topbar">
          <div class="page-title">
            ${button('Show Menu', '', 'secondary mobile-menu', 'data-action="toggle-menu"')}
            <div class="breadcrumbs">${escapeHtml(crumb)}</div>
            <h2>${escapeHtml(title)}</h2>
          </div>
          <div class="top-actions">
            ${button('Add Member', '#/members/new', 'secondary')}
            ${button('New Loan', '#/loan-applications/new', 'primary')}
            ${button('Record Payment', '#/payments', 'secondary')}
          </div>
        </header>
        <main class="main-view">
          ${notice ? `<div class="notice">${escapeHtml(notice)}</div>` : ''}
          ${renderRoute()}
        </main>
      </div>
    </div>
    ${renderConfirmDialog()}
  `;
  if (state.scrollTopOnRender) {
    window.scrollTo({ top: 0, left: 0 });
    state.scrollTopOnRender = false;
  }
  if (notice) {
    state.notice = '';
  }
}

function renderSidebar() {
  const activeId = activeNavId();
  let currentGroup = '';
  return `
    <aside class="sidebar" id="sidebar">
      <div class="brand">
        <div class="brand-mark">SC</div>
        <h1>SACADA Loan Management System</h1>
        <p>Internal admin prototype</p>
      </div>
      <nav class="nav-list" aria-label="Main navigation">
        ${navItems
          .map((item) => {
            const heading = item.group !== currentGroup ? `<div class="nav-group">${escapeHtml(item.group)}</div>` : '';
            currentGroup = item.group;
            return `
              ${heading}
              <a class="nav-link ${activeId === item.id ? 'active' : ''}" href="${item.href}">
                <span class="nav-icon">${escapeHtml(item.icon)}</span>
                <span>${escapeHtml(item.label)}</span>
              </a>
            `;
          })
          .join('')}
      </nav>
    </aside>
  `;
}

function renderConfirmDialog() {
  const confirm = state.confirm;
  return `
    <div class="modal-backdrop ${confirm ? 'open' : ''}" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div class="modal">
        <h3 id="confirm-title">${escapeHtml(confirm?.title || 'Confirm Action')}</h3>
        <p>${escapeHtml(confirm?.message || '')}</p>
        <div class="modal-actions">
          ${button('Cancel', '', 'secondary', 'data-action="close-confirm"')}
          ${button(confirm?.confirmLabel || 'Continue', '', confirm?.danger ? 'danger' : 'primary', 'data-action="confirm-action"')}
        </div>
      </div>
    </div>
  `;
}

function renderRoute() {
  const [section, id] = routeParts();
  if (!section || section === 'dashboard') return renderEnhancedDashboard(state);
  const extended = renderExtendedRoute(section, id, state);
  if (extended) return extended;
  if (section === 'members' && id === 'new') return renderMemberEditor(null, true);
  if (section === 'members' && id) return renderMemberEditor(id, false);
  if (section === 'members') return renderMemberList();
  if (section === 'loan-applications' && id === 'new') return renderLoanApplicationEditor(null);
  if (section === 'loan-applications' && id) return renderLoanApplicationEditor(id);
  if (section === 'loan-applications') return renderLoanApplicationList();
  if (section === 'active-loans' && id) return renderLoanAccountDetails(id);
  if (section === 'active-loans') return renderActiveLoanList();
  if (section === 'payments' && id === 'history') return renderPaymentHistory();
  if (section === 'payments') return renderRecordPayment();
  if (section === 'reports') return renderReports();
  if (section === 'settings') return renderSettings();
  return renderEnhancedDashboard(state);
}

function renderMemberList() {
  const barangays = uniqueValues(state.members, 'barangay');
  const filters = state.memberFilters;
  const rows = sortRows(
    state.members.filter((member) => {
      const text = `${member.id} ${member.fullName} ${member.mobile} ${member.barangay} ${member.specialization || ''} ${member.profession || member.occupation || ''}`.toLowerCase();
      return (
        text.includes(filters.search.toLowerCase()) &&
        matchFilter(member.membershipStatus, filters.status) &&
        matchFilter(member.barangay, filters.barangay) &&
        matchFilter(member.gender, filters.gender) &&
        matchFilter(member.civilStatus, filters.civilStatus) &&
        matchFilter(member.membershipType, filters.membershipType || 'All') &&
        matchFilter(member.specialization, filters.specialization || 'All')
      );
    }),
    state.sort.members,
  );

  return `
    <section class="page-header">
      <div>
        <h3>Member List</h3>
        <p>Search, filter, and review member KYC records in an Excel-like table.</p>
      </div>
      ${button('Add Member', '#/members/new', 'primary')}
    </section>
    <section class="panel">
      <div class="toolbar" data-filter-group="memberFilters">
        ${field('Search Member', 'search', filters.search, { placeholder: 'Search by ID, name, contact, or barangay' })}
        ${field('Type', 'membershipType', filters.membershipType || 'All', { type: 'select', choices: ['All', 'Regular', 'Associate'] })}
        ${field('Status', 'status', filters.status, { type: 'select', choices: ['All', 'Active', 'Pending', 'Inactive'] })}
        ${field('Barangay', 'barangay', filters.barangay, { type: 'select', choices: ['All', ...barangays] })}
        ${field('Gender', 'gender', filters.gender, { type: 'select', choices: ['All', 'Male', 'Female', 'LGBTQ+'] })}
        ${field('Civil Status', 'civilStatus', filters.civilStatus, { type: 'select', choices: ['All', 'Single', 'Married', 'Widower', 'Legally Separated', 'Annulled', 'Single Mom/Dad'] })}
        ${field('Specialization', 'specialization', filters.specialization || 'All', { type: 'select', choices: ['All', 'Food Safety Management', 'Engineering', 'CPA / Accounting', 'Agriculture', 'Education', 'Business', 'Government Service', 'Driving / Transportation', 'Other'] })}
      </div>
      ${columnVisibilityMenu([
        { label: 'Member ID' }, { label: 'Full Name' }, { label: 'TIN' }, { label: 'Type of Membership' }, { label: 'Date Accepted' }, { label: 'Board Resolution Number' }, { label: 'Barangay' }, { label: 'Mobile Number' }, { label: 'Specialization' }, { label: 'Number of Shares Subscribed' }, { label: 'Amount Subscribed' }, { label: 'Paid-Up Share Capital' }, { label: 'Regular Savings' }, { label: 'Time Deposits' }, { label: 'Accounts Receivable' }, { label: 'Membership Status' }
      ])}
      ${dataTable({
        columns: [
          { key: 'id', label: 'Member ID', sortable: true },
          { key: 'fullName', label: 'Full Name', sortable: true },
          { key: 'tin', label: 'TIN', sortable: true },
          { key: 'membershipType', label: 'Type of Membership', sortable: true },
          { key: 'dateAccepted', label: 'Date Accepted', sortable: true, render: (row) => formatDate(row.dateAccepted) },
          { key: 'boardResolution', label: 'Board Resolution Number', sortable: true },
          { key: 'barangay', label: 'Barangay', sortable: true },
          { key: 'mobile', label: 'Mobile Number', sortable: true },
          { key: 'specialization', label: 'Specialization', sortable: true },
          { key: 'sharesSubscribed', label: 'Number of Shares Subscribed', sortable: true },
          { key: 'amountSubscribed', label: 'Amount Subscribed', sortable: true, render: (row) => formatCurrency(row.amountSubscribed || row.sharesSubscribed * (row.shareValue || 100)) },
          { key: 'paidUpShareCapital', label: 'Paid-Up Share Capital', sortable: true, render: (row) => formatCurrency(row.paidUpShareCapital || row.shareCapital || 0) },
          { key: 'regularSavings', label: 'Regular Savings', sortable: true, render: (row) => formatCurrency(row.regularSavings || 0) },
          { key: 'timeDeposits', label: 'Time Deposits', sortable: true, render: (row) => formatCurrency(row.timeDeposits || row.timeDeposit || 0) },
          { key: 'accountsReceivable', label: 'Accounts Receivable', sortable: true, render: (row) => formatCurrency(row.accountsReceivable || 0) },
          { key: 'membershipStatus', label: 'Membership Status', sortable: true, render: (row) => statusBadge(row.membershipStatus) },
          {
            key: 'actions',
            label: 'Actions',
            render: (row) => `
              <div class="cell-actions">
                ${button('View', `#/members/${row.id}`, 'secondary small')}
                ${button('Edit', `#/members/${row.id}`, 'secondary small')}
                ${button('New Loan', `#/loan-applications/new?member=${row.id}`, 'primary small')}
              </div>
            `,
          },
        ],
        rows,
      })}
    </section>
  `;
}

function renderMemberEditor(memberId, isNew) {
  const sourceMember = isNew ? null : state.members.find((item) => item.id === memberId);
  if (!isNew && !sourceMember) return notFound('Member record was not found.');
  const draftKey = isNew ? 'new' : memberId;
  if (!state.memberDraft || state.memberDraftKey !== draftKey) {
    state.memberDraft = structuredClone(sourceMember || createBlankMember());
    state.memberDraftKey = draftKey;
  }
  const member = state.memberDraft;

  return `
    <section class="page-header">
      <div>
        <h3>${isNew ? 'Add Member' : member.fullName}</h3>
        <p>${isNew ? 'Encode member details from the paper membership form.' : 'Review and update member KYC details.'}</p>
      </div>
      <div class="top-actions">
        ${button('Back to Member List', '#/members', 'secondary')}
        ${button('New Loan', `#/loan-applications/new?member=${member.id}`, 'primary')}
      </div>
    </section>

    <section class="panel">
      <div class="profile-heading">
        <div class="avatar">${escapeHtml(member.initials || 'NM')}</div>
        <div>
          <h3>${escapeHtml(member.fullName || 'New Member')}</h3>
          <div class="profile-meta">
            <span>${escapeHtml(member.id)}</span>
            <span>${statusBadge(member.membershipStatus)}</span>
            <span>${escapeHtml(member.mobile || 'No contact number')}</span>
          </div>
        </div>
        <div class="top-actions">
          ${button('Save Draft', '', 'secondary', 'data-action="save-member"')}
          ${button(isNew ? 'Save Member' : 'Save Changes', '', 'primary', 'data-action="save-member"')}
        </div>
      </div>
      <div class="tabs">
        ${memberTabs
          .map(
            (tab) => `<button type="button" class="tab ${state.memberTab === tab ? 'active' : ''}" data-action="set-member-tab" data-tab="${escapeHtml(tab)}">${escapeHtml(tab)}</button>`,
          )
          .join('')}
      </div>
      <form id="member-form" data-member-id="${escapeHtml(isNew ? '' : member.id)}">
        ${renderMemberTab(member, state.memberTab)}
        <div class="section-actions">
          ${button('Cancel', '#/members', 'secondary')}
          ${button('Save Draft', '', 'secondary', 'data-action="save-member"')}
          ${button(isNew ? 'Save Member' : 'Save Changes', '', 'primary', 'data-action="save-member"')}
        </div>
      </form>
    </section>
  `;
}

function renderMemberTab(member, tab) {
  if (tab === 'Overview') {
    const subscribed = (member.sharesSubscribed || 0) * (member.shareValue || 100);
    const paid = member.paidUpShareCapital || member.shareCapital || 0;
    return formSection(
      'Member Overview',
      'Quick view of membership standing, capital, savings, loans, deposits, dividends, and patronage.',
      `<div class="grid three-column">
        ${summaryCard('Membership', [
          ['Member ID', member.id],
          ['Type', member.membershipType || 'Regular'],
          ['Date Accepted', formatDate(member.dateAccepted)],
          ['Board Resolution', member.boardResolution || ''],
          ['Status', member.membershipStatus || 'Pending'],
        ])}
        ${summaryCard('Capital Subscription', [
          ['Share Value', formatCurrency(member.shareValue || 100)],
          ['Shares Subscribed', formatNumber(member.sharesSubscribed || 0)],
          ['Amount Subscribed', formatCurrency(member.amountSubscribed || subscribed)],
          ['Paid-Up Share Capital', formatCurrency(paid)],
          ['Unpaid Balance', formatCurrency(Math.max(0, (member.amountSubscribed || subscribed) - paid))],
        ])}
        ${summaryCard('Financial Services', [
          ['Regular Savings', formatCurrency(member.regularSavings || 0)],
          ['Time Deposit Total', formatCurrency(member.timeDeposits || member.timeDeposit || 0)],
          ['Accounts Receivable', formatCurrency(member.accountsReceivable || 0)],
          ['Outstanding Loan Balance', formatCurrency(member.outstandingLoanBalance || 0)],
          ['Dividends', formatCurrency(member.totalDividends || 0)],
          ['Patronage Refund', formatCurrency(member.totalPatronageRefund || 0)],
        ])}
      </div>
      <div class="section-actions">
        ${button('Edit Member', '', 'secondary', 'data-action="save-member"')}
        ${button('New Loan', `#/loan-applications/new?member=${member.id}`, 'primary')}
        ${button('Record Share Payment', '#/capital-savings', 'secondary')}
        ${button('Add Time Deposit', '#/time-deposits/new', 'secondary')}
        ${button('Print Membership Form', '#/forms-printables/membership-form', 'secondary')}
        ${button('Print Member Ledger', '#/forms-printables/member-ledger', 'secondary')}
        ${button('Print BIR Record', '#/forms-printables/bir-registry', 'secondary')}
      </div>`,
    );
  }

  if (tab === 'Personal Information') {
    return formSection(
      'Personal Information',
      'Encode the member information exactly as written on the membership form.',
      `<div class="form-grid">
        ${field('Member ID Number', 'id', member.id)}
        ${field('Last Name', 'lastName', member.lastName)}
        ${field('First Name', 'firstName', member.firstName)}
        ${field('Middle Name', 'middleName', member.middleName)}
        ${field('Name Extension', 'extension', member.extension)}
        ${field('Date of Birth', 'birthDate', member.birthDate, { type: 'date' })}
        ${field('Place of Birth', 'birthPlace', member.birthPlace)}
        ${field('Gender', 'gender', member.gender, { type: 'select', choices: ['Male', 'Female', 'LGBTQ+'] })}
        ${field('Civil Status', 'civilStatus', member.civilStatus, { type: 'select', choices: ['Single', 'Married', 'Widower', 'Legally Separated', 'Annulled', 'Single Mom/Dad'] })}
        ${field('TIN Number', 'tin', member.tin)}
        ${field('Citizenship', 'citizenship', member.citizenship)}
        ${field('Religion', 'religion', member.religion)}
        ${field('Highest Educational Attainment', 'education', member.education)}
        ${field('Average Monthly Income', 'averageMonthlyIncome', member.averageMonthlyIncome, { type: 'number' })}
      </div>`,
    );
  }

  if (tab === 'Membership') {
    return formSection(
      'Membership Acceptance and PMES',
      'Board acceptance, membership type, PMES, and certification fields.',
      `<div class="form-grid">
        ${field('Date Accepted', 'dateAccepted', member.dateAccepted, { type: 'date' })}
        ${field('Board Resolution Number', 'boardResolution', member.boardResolution)}
        ${field('Membership Status', 'membershipStatus', member.membershipStatus, { type: 'select', choices: ['Active', 'Pending', 'Inactive'] })}
        ${field('Type of Membership', 'membershipType', member.membershipType || 'Regular', { type: 'select', choices: ['Regular', 'Associate'] })}
        ${field('Evaluation', 'evaluation', member.evaluation || 'Pending', { type: 'select', choices: ['Approved', 'Not Approved', 'Pending'] })}
        ${field('Member ID Number', 'id', member.id)}
        ${field('Date Certified', 'dateCertified', member.dateCertified, { type: 'date' })}
        ${field('Certified By', 'certifiedBy', member.certifiedBy)}
        ${field('PMES Completed', 'pmesCompleted', member.pmesCompleted, { type: 'select', choices: ['Yes', 'No'] })}
        ${field('PMES Date', 'pmesDate', member.pmesDate, { type: 'date' })}
        ${field('PMES Conducted By', 'pmesConductedBy', member.pmesConductedBy)}
        ${field('Membership Fee Paid', 'membershipFeePaid', member.membershipFeePaid, { type: 'select', choices: ['Yes', 'No'] })}
        ${field('Membership Fee Amount', 'membershipFeeAmount', member.membershipFeeAmount || 0, { type: 'number' })}
        ${field('Membership Fee Date Paid', 'membershipFeeDate', member.membershipFeeDate, { type: 'date' })}
        ${field('Membership Fee OR Number', 'membershipFeeOr', member.membershipFeeOr)}
      </div>`,
    );
  }

  if (tab === 'Capital Subscription') {
    const shareValue = member.shareValue || 100;
    const shares = member.sharesSubscribed || 0;
    const subscribed = member.amountSubscribed || shareValue * shares;
    const paid = member.paidUpShareCapital || member.shareCapital || 0;
    return formSection(
      'Capital Subscription',
      'Frontend preview: Amount Subscribed = Number of Shares Subscribed x Share Value.',
      `<div class="form-grid">
        ${field('Share Value', 'shareValue', shareValue, { type: 'number', helper: 'Default may be changed in Settings.' })}
        ${field('Number of Shares Subscribed', 'sharesSubscribed', shares, { type: 'number' })}
        ${field('Amount Subscribed', 'amountSubscribed', subscribed, { type: 'number', helper: 'Auto-preview value; editable for correction.' })}
        ${field('Paid-Up Share Capital', 'paidUpShareCapital', paid, { type: 'number' })}
        ${field('Unpaid Subscription Balance', 'unpaidSubscriptionBalance', Math.max(0, subscribed - paid), { type: 'number' })}
        ${field('Date of Initial Share Payment', 'initialSharePaymentDate', member.initialSharePaymentDate, { type: 'date' })}
        ${field('OR / Reference Number', 'capitalOrNumber', member.capitalOrNumber)}
        ${field('Percentage of Authorized Share Capital', 'authorizedSharePercentage', member.authorizedSharePercentage || 0, { type: 'number' })}
        ${field('Percentage of Proposed Authorized Share Capital', 'proposedAuthorizedSharePercentage', member.proposedAuthorizedSharePercentage || 0, { type: 'number' })}
      </div>`,
    );
  }

  if (tab === 'Address and Contact') {
    return `${renderMemberTab(member, 'Address')}${renderMemberTab(member, 'Contact Details')}`;
  }

  if (tab === 'Education and Specialization') {
    return formSection(
      'Education and Specialization',
      'Specialization is free text; suggestions are provided only to help staff encode consistently.',
      `<div class="form-grid">
        ${field('Highest Educational Attainment', 'education', member.education)}
        ${field('Specialization', 'specialization', member.specialization || '', { placeholder: 'Example: Education, CPA / Accounting, Agriculture' })}
        ${field('Suggested Specialization', 'specializationSuggestion', member.specialization || 'Education', { type: 'select', choices: ['Food Safety Management', 'Engineering', 'CPA / Accounting', 'Agriculture', 'Education', 'Business', 'Government Service', 'Driving / Transportation', 'Other'] })}
      </div>`,
    );
  }

  if (tab === 'Financial Services') {
    return formSection(
      'Financial Services',
      'Summary values for member services. These are frontend records and can be connected to backend ledgers later.',
      `<div class="form-grid">
        ${field('Regular Savings', 'regularSavings', member.regularSavings || 0, { type: 'number' })}
        ${field('Time Deposit Total', 'timeDeposits', member.timeDeposits || member.timeDeposit || 0, { type: 'number' })}
        ${field('Accounts Receivable', 'accountsReceivable', member.accountsReceivable || 0, { type: 'number' })}
        ${field('Outstanding Loan Balance', 'outstandingLoanBalance', member.outstandingLoanBalance || 0, { type: 'number' })}
        ${field('Total Capital Share', 'totalCapitalShare', member.totalCapitalShare || member.paidUpShareCapital || member.shareCapital || 0, { type: 'number' })}
        ${field('Total Dividends', 'totalDividends', member.totalDividends || 0, { type: 'number' })}
        ${field('Total Patronage Refund', 'totalPatronageRefund', member.totalPatronageRefund || 0, { type: 'number' })}
        ${field('Co-Maker', 'coMaker', member.coMaker || 'No', { type: 'select', choices: ['Yes', 'No'] })}
        ${field('Investor / Guarantor', 'investorGuarantor', member.investorGuarantor || 'No', { type: 'select', choices: ['Yes', 'No'] })}
      </div>`,
    );
  }

  if (['Payments', 'Time Deposits', 'Dividends', 'Patronage', 'Documents'].includes(tab)) {
    return formSection(
      tab,
      `Related ${tab.toLowerCase()} records for this member will appear here.`,
      emptyState(`No ${tab} Records`, 'No related records are connected to this member yet.'),
    );
  }

  if (tab === 'Address') {
    return formSection(
      'Address',
      'Use complete barangay and city/province entries for report filtering.',
      `<div class="form-grid">
        ${field('Present Address', 'presentAddress', member.presentAddress, { type: 'textarea' })}
        ${field('Permanent Address', 'permanentAddress', member.permanentAddress, { type: 'textarea' })}
        ${field('House Number', 'houseNumber', member.houseNumber)}
        ${field('Barangay', 'barangay', member.barangay)}
        ${field('Municipality / City', 'city', member.city)}
        ${field('Province', 'province', member.province)}
        ${field('ZIP Code', 'zip', member.zip)}
        ${field('Years of Stay', 'yearsOfStay', member.yearsOfStay, { type: 'number' })}
        ${field('House Status', 'houseStatus', member.houseStatus, {
          type: 'select',
          choices: [
            'Fully Owned House',
            'Amortized House',
            'Renting / Boarding',
            'Staying FREE with Parents / Relatives',
            'Staying with Relatives with Monthly Contribution',
          ],
        })}
      </div>`,
    );
  }

  if (tab === 'Contact Details') {
    return formSection(
      'Contact Details',
      'Contact details are used for follow-up, emergency calls, and printed forms.',
      `<div class="form-grid">
        ${field('Mobile Number', 'mobile', member.mobile)}
        ${field('Telephone', 'telephone', member.telephone)}
        ${field('Email Address', 'email', member.email, { type: 'email' })}
        ${field('Facebook Link', 'facebook', member.facebook)}
        ${field('Emergency Contact Person', 'emergencyContact', member.emergencyContact)}
        ${field('Emergency Contact Number', 'emergencyNumber', member.emergencyNumber)}
      </div>`,
    );
  }

  if (tab === 'Family / Spouse') {
    return formSection(
      'Family / Spouse',
      'Keep spouse and dependent information updated for loan evaluation.',
      `<div class="form-grid">
        ${field("Father's Name", 'fatherName', member.fatherName)}
        ${field("Mother's Name", 'motherName', member.motherName)}
        ${field('Complete Name of Mother', 'completeMotherName', member.completeMotherName)}
        ${field('Spouse Name', 'spouseName', member.spouseName)}
        ${field('Spouse Occupation', 'spouseOccupation', member.spouseOccupation)}
        ${field('Number of Qualified Dependents', 'dependents', member.dependents, { type: 'number' })}
      </div>`,
    );
  }

  if (tab === 'Employment / Business') {
    return formSection(
      'Employment / Business',
      'These fields support credit committee review and income validation.',
      `<div class="form-grid">
        ${field('Present Occupation', 'occupation', member.occupation)}
        ${field('Employer Name', 'employerName', member.employerName)}
        ${field('Employer Address', 'employerAddress', member.employerAddress)}
        ${field('Employment Status', 'employmentStatus', member.employmentStatus, { type: 'select', choices: ['Permanent', 'Contractual / Job Order'] })}
        ${field('Years in Service', 'yearsInService', member.yearsInService, { type: 'number' })}
        ${field('Monthly Salary', 'monthlySalary', member.monthlySalary, { type: 'number' })}
        ${field('Employer Contact Details', 'employerContact', member.employerContact)}
        ${field('Business Type, if self-employed', 'businessType', member.businessType, {
          type: 'select',
          choices: [
            '',
            'Market Vendor with Market Stall Rights',
            'Grocery / Sari-sari Store',
            'Farming with Owned Parcel of Land',
            'Farming Tenant',
            'Fishing',
            'Service / Repair Shop',
            'Tricycle Operator',
            'Tricycle Driver',
            'Others',
          ],
        })}
        ${field('Monthly Income', 'monthlyIncome', member.monthlyIncome, { type: 'number' })}
        ${field('Years in Operation', 'yearsInOperation', member.yearsInOperation, { type: 'number' })}
        ${field('Owns land?', 'ownsLand', member.ownsLand, { type: 'select', choices: ['Yes', 'No'] })}
        ${field('Name of Landlord', 'landlordName', member.landlordName)}
        ${field('Size of Farmland', 'farmlandSize', member.farmlandSize)}
        ${field('Location of Farm', 'farmLocation', member.farmLocation)}
        ${field('Income per Crop/Harvest', 'incomePerCrop', member.incomePerCrop, { type: 'number' })}
        ${field('Kind of Livestock', 'livestock', member.livestock)}
        ${field('Income per Year', 'incomePerYear', member.incomePerYear, { type: 'number' })}
        ${field('Other Sources of Income', 'otherIncome', member.otherIncome, { type: 'select', choices: ['', 'Spouse Financial Support', 'Sibling Financial Support', 'Relative Financial Support', 'Other Sources', 'Monthly Pension'] })}
        ${field('Monthly Pension', 'monthlyPension', member.monthlyPension, { type: 'number' })}
      </div>`,
    );
  }

  if (tab === 'Membership Details') {
    return formSection(
      'Membership Details',
      'Encode fees, official receipts, certification, and remarks from the membership documents.',
      `<div class="form-grid">
        ${field('Evaluation', 'evaluation', member.evaluation, { type: 'select', choices: ['Approved', 'Not Approved'] })}
        ${field('PMES Completed', 'pmesCompleted', member.pmesCompleted, { type: 'select', choices: ['Yes', 'No'] })}
        ${field('Membership Fee Paid', 'membershipFeePaid', member.membershipFeePaid, { type: 'select', choices: ['Yes', 'No'] })}
        ${field('Membership Fee Date Paid', 'membershipFeeDate', member.membershipFeeDate, { type: 'date' })}
        ${field('Membership Fee OR Number', 'membershipFeeOr', member.membershipFeeOr)}
        ${field('Share Capital Amount', 'shareCapital', member.shareCapital, { type: 'number' })}
        ${field('Share Capital Date Paid', 'shareCapitalDate', member.shareCapitalDate, { type: 'date' })}
        ${field('Share Capital OR Number', 'shareCapitalOr', member.shareCapitalOr)}
        ${field('Time Deposit Amount', 'timeDeposit', member.timeDeposit, { type: 'number' })}
        ${field('Time Deposit Date Paid', 'timeDepositDate', member.timeDepositDate, { type: 'date' })}
        ${field('Time Deposit OR Number', 'timeDepositOr', member.timeDepositOr)}
        ${field('Collected By', 'collectedBy', member.collectedBy)}
        ${field('Certified By', 'certifiedBy', member.certifiedBy)}
        ${field('Date Certified', 'dateCertified', member.dateCertified, { type: 'date' })}
        ${field('Membership Status', 'membershipStatus', member.membershipStatus, { type: 'select', choices: ['Active', 'Pending', 'Inactive'] })}
        ${field('Remarks', 'remarks', member.remarks, { type: 'textarea' })}
      </div>`,
    );
  }

  const memberLoans = state.activeLoans.filter((loan) => loan.memberId === member.id);
  return formSection(
    'Loans',
    'Loan accounts connected to this member.',
    dataTable({
      columns: [
        { key: 'accountNumber', label: 'Loan Account Number' },
        { key: 'originalAmount', label: 'Original Loan Amount', render: (row) => formatCurrency(row.originalAmount) },
        { key: 'remainingBalance', label: 'Remaining Balance', render: (row) => formatCurrency(row.remainingBalance) },
        { key: 'monthlyAmortization', label: 'Monthly Amortization', render: (row) => formatCurrency(row.monthlyAmortization) },
        { key: 'status', label: 'Status', render: (row) => statusBadge(row.status) },
        { key: 'actions', label: 'Actions', render: (row) => button('View Loan', `#/active-loans/${row.accountNumber}`, 'secondary small') },
      ],
      rows: memberLoans,
      emptyText: 'No loan account linked to this member.',
    }),
  );
}

function renderLoanApplicationList() {
  const filters = state.loanFilters;
  const rows = sortRows(
    state.loanApplications.filter((loan) => {
      const text = `${loan.id} ${loan.borrowerName} ${loan.memberId} ${loan.purpose}`.toLowerCase();
      return text.includes(filters.search.toLowerCase()) && matchFilter(loan.status, filters.status);
    }),
    state.sort.applications,
  );

  return `
    <section class="page-header">
      <div>
        <h3>Loan Application List</h3>
        <p>Review applications, approve, reject, print, or continue editing drafts.</p>
      </div>
      ${button('New Loan Application', '#/loan-applications/new', 'primary')}
    </section>
    <section class="panel">
      <div class="toolbar" data-filter-group="loanFilters">
        ${field('Search Application', 'search', filters.search, { placeholder: 'Search by application number, borrower, or member ID' })}
        ${field('Status', 'status', filters.status, { type: 'select', choices: ['All', 'Draft', 'Pending', 'Approved', 'Disapproved', 'Released', 'Active', 'Completed', 'Defaulted'] })}
      </div>
      ${dataTable({
        columns: [
          { key: 'id', label: 'Application Number', sortable: true },
          { key: 'borrowerName', label: 'Borrower Name', sortable: true },
          { key: 'memberId', label: 'Member ID', sortable: true },
          { key: 'requestedAmount', label: 'Loan Amount Requested', sortable: true, render: (row) => formatCurrency(row.requestedAmount) },
          { key: 'approvedAmount', label: 'Approved Loan Amount', sortable: true, render: (row) => formatCurrency(row.approvedAmount) },
          { key: 'applicationDate', label: 'Application Date', sortable: true, render: (row) => formatDate(row.applicationDate) },
          { key: 'purpose', label: 'Loan Purpose', sortable: true },
          { key: 'status', label: 'Status', sortable: true, render: (row) => statusBadge(row.status) },
          {
            key: 'actions',
            label: 'Actions',
            render: (row) => `
              <div class="cell-actions">
                ${button('View', `#/loan-applications/${row.id}`, 'secondary small')}
                ${button('Edit', `#/loan-applications/${row.id}`, 'secondary small')}
                ${button('Approve', '', 'primary small', `data-action="approve-loan" data-id="${escapeHtml(row.id)}"`)}
                ${button('Reject', '', 'danger small', `data-action="reject-loan" data-id="${escapeHtml(row.id)}"`)}
                ${button('Print', '', 'secondary small', 'data-action="print-page"')}
              </div>
            `,
          },
        ],
        rows,
      })}
    </section>
  `;
}

function renderLoanApplicationEditor(applicationId) {
  if (!applicationId && !state.members.length) {
    return `
      <section class="panel">
        <div class="panel-title">
          <div>
            <h3>No Members Yet</h3>
            <p>Add a member record first before encoding a loan application.</p>
          </div>
        </div>
        <div class="empty-state">Loan applications must be linked to an existing member/KYC record.</div>
        <div class="section-actions">
          ${button('Add Member', '#/members/new', 'primary')}
          ${button('Back to Applications', '#/loan-applications', 'secondary')}
        </div>
      </section>
    `;
  }

  const application = applicationId ? state.loanApplications.find((item) => item.id === applicationId) : createBlankLoanApplication();
  if (!application) return notFound('Loan application was not found.');
  const member = state.members.find((item) => item.id === application.memberId) || state.members[0];
  const computed = calculateLoan(application.computation);
  const schedule = buildAmortizationSchedule(application.computation);

  return `
    <section class="page-header">
      <div>
        <h3>${applicationId ? application.id : 'New Loan Application'}</h3>
        <p>Tabbed loan encoding from borrower selection to approval decision.</p>
      </div>
      <div class="top-actions">
        ${button('Back to Applications', '#/loan-applications', 'secondary')}
        ${button('Save Draft', '', 'secondary', 'data-action="save-loan-draft"')}
        ${button('Save Loan', '', 'primary', 'data-action="save-loan-draft"')}
      </div>
    </section>

    <section class="panel">
      <div class="stepper">
        ${loanSteps
          .map(
            (step, index) => `<button type="button" class="step ${state.loanStep === index + 1 ? 'active' : ''}" data-action="set-loan-step" data-step="${index + 1}">Step ${index + 1}<br>${escapeHtml(step)}</button>`,
          )
          .join('')}
      </div>
      <form id="loan-form" data-application-id="${escapeHtml(applicationId || '')}">
        ${renderLoanStep(application, member, computed, schedule)}
        <div class="section-actions">
          ${button('Cancel', '#/loan-applications', 'secondary')}
          ${button('Save Draft', '', 'secondary', 'data-action="save-loan-draft"')}
          ${button('Save Loan', '', 'primary', 'data-action="save-loan-draft"')}
        </div>
      </form>
    </section>

    <section class="panel" style="margin-top: 16px;">
      <div class="panel-title">
        <div>
          <h3>Loan Computation / Statement of Account</h3>
          <p>Uses default 12% interest, 2% collection fee, 1% processing fee, and simple monthly amortization.</p>
        </div>
      </div>
      ${renderComputationInputs(application.computation)}
      <div style="margin-top: 16px;">${computationOutputs(computed)}</div>
      <div style="margin-top: 16px;">${amortizationTable(schedule)}</div>
    </section>
  `;
}

function renderLoanStep(application, member) {
  if (state.loanStep === 1) {
    return formSection(
      'Step 1: Borrower',
      'Select an existing member. Borrowers cannot sign up or apply online in this prototype.',
      `<div class="form-grid two">
        ${field('Select Existing Member', 'memberId', application.memberId || member.id, { type: 'select', choices: state.members.map((item) => item.id) })}
      </div>
      <div style="margin-top: 16px;">
        ${summaryCard('Borrower Summary', [
          ['Name', member.fullName],
          ['Member ID', member.id],
          ['TIN', member.tin],
          ['Contact Number', member.mobile],
          ['Address', member.presentAddress],
          ['Share Capital', formatCurrency(member.shareCapital)],
          ['Current Active Loans', formatNumber(member.activeLoanCount)],
          ['Previous Balance', formatCurrency(application.computation.previousLoanBalance)],
        ])}
      </div>`,
    );
  }

  if (state.loanStep === 2) {
    return formSection(
      'Step 2: Loan Details',
      'Enter requested amount first, then approved amount after evaluation.',
      `<div class="form-grid">
        ${field('Application Number', 'id', application.id)}
        ${field('Application Date', 'applicationDate', application.applicationDate, { type: 'date' })}
        ${field('Loan Amount Requested', 'requestedAmount', application.requestedAmount, { type: 'number' })}
        ${field('Approved Loan Amount', 'approvedAmount', application.approvedAmount, { type: 'number' })}
        ${field('Loan Term', 'termMonths', application.termMonths, { type: 'select', choices: ['12', '18', '24', '36'] })}
        ${field('Installment Type', 'installmentType', application.installmentType, { type: 'select', choices: ['Daily', 'Monthly'] })}
        ${field('Loan Purpose', 'purpose', application.purpose, { type: 'select', choices: ['Productive', 'Providential'] })}
        ${field('Start Date', 'startDate', application.startDate, { type: 'date' })}
        ${field('End Date', 'endDate', application.endDate, { type: 'date' })}
        ${field('Installment Amount', 'installmentAmount', application.installmentAmount, { type: 'number' })}
        ${field('Payment Method', 'paymentMethod', application.paymentMethod, { type: 'select', choices: ['Salary Deduction', 'Direct Payment', 'Online Payment', 'Cash'] })}
        ${field('Status', 'status', application.status, { type: 'select', choices: ['Draft', 'Pending', 'Approved', 'Disapproved', 'Released', 'Active', 'Completed', 'Defaulted'] })}
      </div>`,
    );
  }

  if (state.loanStep === 3) {
    return formSection(
      'Step 3: Co-Maker',
      'Use a member co-maker and confirm responsibility agreement.',
      `<div class="form-grid">
        ${field('Co-maker Name', 'coMakerName', application.coMakerName)}
        ${field('Co-maker Member ID', 'coMakerMemberId', application.coMakerMemberId)}
        ${field('Co-maker Contact Number', 'coMakerContact', application.coMakerContact)}
        ${field('Relationship to Borrower', 'coMakerRelationship', application.coMakerRelationship)}
        ${field('Co-maker Signature Status', 'coMakerSignatureStatus', application.coMakerSignatureStatus, { type: 'select', choices: ['Pending', 'Signed'] })}
      </div>
      <div class="notice" style="margin-top: 16px;">
        <label style="display:flex; gap:10px; align-items:center;">
          <input type="checkbox" name="coMakerAgreement" ${application.coMakerAgreement ? 'checked' : ''} />
          Co-maker accepts responsibility if the borrower fails to meet loan obligations.
        </label>
      </div>`,
    );
  }

  if (state.loanStep === 4) {
    return formSection(
      'Step 4: Employment / Salary Deduction',
      'Complete this section for employed borrowers or salary deduction arrangements.',
      `<div class="form-grid">
        ${field('Employer Name', 'employerName', application.employerName)}
        ${field('Position', 'position', application.position)}
        ${field('Monthly Salary', 'monthlySalary', application.monthlySalary, { type: 'number' })}
        ${field('Payroll Account Validated', 'payrollValidated', application.payrollValidated, { type: 'select', choices: ['Yes', 'No', 'Not Applicable'] })}
        ${field('Salary Deduction Authorized', 'salaryDeductionAuthorized', application.salaryDeductionAuthorized, { type: 'select', choices: ['Yes', 'No'] })}
        ${field('Authorized Signatory Name', 'authorizedSignatory', application.authorizedSignatory)}
        ${field('Date Signed', 'dateSigned', application.dateSigned, { type: 'date' })}
        ${field('Remarks', 'remarks', application.remarks, { type: 'textarea' })}
      </div>`,
    );
  }

  if (state.loanStep === 5) {
    return formSection(
      'Step 5: Requirements Checklist',
      'Set each item to Submitted, Missing, or Not Applicable. Upload buttons are placeholders for future backend storage.',
      `<div class="checklist">
        ${requirementItems
          .map((item, index) => {
            const status = index < 10 ? 'Submitted' : index < 14 ? 'Missing' : 'Not Applicable';
            return `
              <div class="check-row">
                <div class="check-title">${escapeHtml(item)}</div>
                ${field('Status', `requirementStatus${index}`, status, { type: 'select', choices: ['Submitted', 'Missing', 'Not Applicable'] })}
                ${field('Date Submitted', `requirementDate${index}`, index < 10 ? '2026-06-01' : '', { type: 'date' })}
                ${field('Remarks', `requirementRemarks${index}`, index < 10 ? 'On file' : '')}
                ${button('Upload File', '', 'secondary small', 'data-action="placeholder-export" data-message="Upload will connect to document storage later."')}
              </div>
            `;
          })
          .join('')}
      </div>`,
    );
  }

  return formSection(
    'Step 6: Approval',
    'Record staff receiving details, committee recommendation, board decision, and signature placeholders.',
    `<div class="form-grid">
      ${field('Received By', 'receivedBy', application.receivedBy)}
      ${field('Date Received', 'dateReceived', application.dateReceived, { type: 'date' })}
      ${field('Evaluated By', 'evaluatedBy', application.evaluatedBy)}
      ${field('Credit Committee Recommendation', 'recommendation', application.recommendation, { type: 'textarea' })}
      ${field('Board Decision', 'boardDecision', application.boardDecision, { type: 'textarea' })}
      ${field('Approval Status', 'approvalStatus', application.status, { type: 'select', choices: ['Approved', 'Disapproved'] })}
      ${field('Disapproval Reason', 'disapprovalReason', application.disapprovalReason, { type: 'textarea' })}
      ${field('Remarks', 'approvalRemarks', application.remarks, { type: 'textarea' })}
    </div>
    <div class="grid three-column" style="margin-top: 16px;">
      ${summaryCard('Received By Signature', [['Name', application.receivedBy || 'Pending'], ['Date', formatDate(application.dateReceived)]])}
      ${summaryCard('Credit Committee Signature', [['Name', application.evaluatedBy || 'Pending'], ['Recommendation', application.recommendation || 'Pending']])}
      ${summaryCard('Board Approval Signature', [['Decision', application.boardDecision || 'Pending'], ['Status', application.status]])}
    </div>`,
  );
}

function renderComputationInputs(computation) {
  return `
    <div class="form-grid four">
      ${field('Loan Amount', 'loanAmount', computation.loanAmount, { type: 'number' })}
      ${field('Term in Months', 'termMonths', computation.termMonths, { type: 'select', choices: ['12', '18', '24', '36'] })}
      ${field('Interest Rate', 'annualInterestRate', computation.annualInterestRate, { type: 'number', helper: 'Default is 12% of principal.' })}
      ${field('Collection Fee Rate', 'collectionFeeRate', computation.collectionFeeRate ?? 2, { type: 'number', helper: 'Default is 2% of principal.' })}
      ${field('Processing Fee Rate', 'processingFeeRate', computation.processingFeeRate, { type: 'number', helper: 'Default is 1% of principal loan amount.' })}
      ${field('Previous Loan Balance', 'previousLoanBalance', computation.previousLoanBalance, { type: 'number' })}
      ${field('Existing Capital Share', 'existingCapitalShare', computation.existingCapitalShare, { type: 'number' })}
      ${field('Additional Capital Share', 'additionalCapitalShare', computation.additionalCapitalShare, { type: 'number' })}
      ${field('Savings Deposit', 'savingsDeposit', computation.savingsDeposit, { type: 'number' })}
      ${field('Time Deposit', 'timeDeposit', computation.timeDeposit, { type: 'number' })}
      ${field('Release Date', 'releaseDate', computation.releaseDate, { type: 'date' })}
      ${field('First Due Date', 'firstDueDate', computation.firstDueDate, { type: 'date' })}
      ${summaryCard('Default Fees', [
        ['Penalty', 'PHP 50 per month of delay'],
        ['Default Term', '12 months'],
      ])}
    </div>
  `;
}

function renderActiveLoanList() {
  const filters = state.activeLoanFilters;
  const rows = sortRows(
    state.activeLoans.filter((loan) => {
      const text = `${loan.accountNumber} ${loan.borrowerName} ${loan.memberId}`.toLowerCase();
      return text.includes(filters.search.toLowerCase()) && matchFilter(loan.status, filters.status);
    }),
    state.sort.activeLoans,
  );

  return `
    <section class="page-header">
      <div>
        <h3>Active Loan List</h3>
        <p>Monitor remaining balances, due dates, and payment status.</p>
      </div>
      ${button('Record Payment', '#/payments', 'primary')}
    </section>
    <section class="panel">
      <div class="toolbar" data-filter-group="activeLoanFilters">
        ${field('Search Loan Account', 'search', filters.search, { placeholder: 'Search by account, borrower, or member ID' })}
        ${field('Status', 'status', filters.status, { type: 'select', choices: ['All', 'Active', 'Updated', 'Delayed', 'Delinquent', 'Completed', 'Defaulted'] })}
      </div>
      ${dataTable({
        columns: [
          { key: 'accountNumber', label: 'Loan Account Number', sortable: true },
          { key: 'borrowerName', label: 'Borrower Name', sortable: true },
          { key: 'memberId', label: 'Member ID', sortable: true },
          { key: 'originalAmount', label: 'Original Loan Amount', sortable: true, render: (row) => formatCurrency(row.originalAmount) },
          { key: 'totalPayable', label: 'Total Payable', sortable: true, render: (row) => formatCurrency(row.totalPayable) },
          { key: 'remainingBalance', label: 'Remaining Balance', sortable: true, render: (row) => formatCurrency(row.remainingBalance) },
          { key: 'monthlyAmortization', label: 'Monthly Amortization', sortable: true, render: (row) => formatCurrency(row.monthlyAmortization) },
          { key: 'nextDueDate', label: 'Next Due Date', sortable: true, render: (row) => formatDate(row.nextDueDate) },
          { key: 'status', label: 'Status', sortable: true, render: (row) => statusBadge(row.status) },
          {
            key: 'actions',
            label: 'Actions',
            render: (row) => `
              <div class="cell-actions">
                ${button('View', `#/active-loans/${row.accountNumber}`, 'secondary small')}
                ${button('Record Payment', `#/payments?loan=${row.accountNumber}`, 'primary small')}
              </div>
            `,
          },
        ],
        rows,
      })}
    </section>
  `;
}

function renderLoanAccountDetails(accountNumber) {
  const loan = state.activeLoans.find((item) => item.accountNumber === accountNumber);
  if (!loan) return notFound('Loan account was not found.');
  const member = state.members.find((item) => item.id === loan.memberId);
  const application = state.loanApplications.find((item) => item.id === loan.applicationId);
  const paymentRows = state.payments.filter((payment) => payment.loanAccount === accountNumber);
  const schedule = application
    ? buildAmortizationSchedule(application.computation, Array.from({ length: loan.paidMonths }, () => 'Paid'))
    : [];

  return `
    <section class="page-header">
      <div>
        <h3>${escapeHtml(loan.accountNumber)}</h3>
        <p>${escapeHtml(loan.borrowerName)} loan account details.</p>
      </div>
      <div class="top-actions">
        ${button('Back to Active Loans', '#/active-loans', 'secondary')}
        ${button('Record Payment', `#/payments?loan=${loan.accountNumber}`, 'primary')}
      </div>
    </section>

    <div class="grid two-column">
      ${summaryCard('Borrower Summary', [
        ['Name', loan.borrowerName],
        ['Member ID', loan.memberId],
        ['Contact Number', member?.mobile || 'N/A'],
        ['Address', member?.presentAddress || 'N/A'],
        ['Share Capital', formatCurrency(member?.shareCapital || 0)],
      ])}
      ${summaryCard('Loan Summary', [
        ['Original Loan Amount', formatCurrency(loan.originalAmount)],
        ['Total Payable', formatCurrency(loan.totalPayable)],
        ['Remaining Balance', formatCurrency(loan.remainingBalance)],
        ['Monthly Amortization', formatCurrency(loan.monthlyAmortization)],
        ['Next Due Date', formatDate(loan.nextDueDate)],
        ['Status', loan.status],
      ])}
    </div>

    <section class="panel" style="margin-top: 16px;">
      <div class="panel-title"><h3>Payment Schedule</h3></div>
      ${schedule.length ? amortizationTable(schedule) : '<div class="empty-state">No payment schedule attached to this account.</div>'}
    </section>

    <section class="panel" style="margin-top: 16px;">
      <div class="panel-title"><h3>Payment History</h3></div>
      ${paymentHistoryTable(paymentRows)}
    </section>

    <div class="grid two-column" style="margin-top: 16px;">
      ${summaryCard('Penalties', [
        ['Penalty Amount', formatCurrency(loan.penalties)],
        ['Default Rule', 'PHP 50 per month of delay'],
      ])}
      ${summaryCard('Remarks', [
        ['Notes', loan.remarks],
        ['Last Payment Date', formatDate(loan.lastPaymentDate)],
      ])}
    </div>
  `;
}

function renderRecordPayment() {
  if (!state.activeLoans.length) {
    return `
      <section class="page-header">
        <div>
          <h3>Record Payment</h3>
          <p>Payments can be encoded after a loan account has been created.</p>
        </div>
      </section>
      <section class="panel">
        <div class="empty-state">No active loan accounts yet. Add a member, encode a loan application, then create an active loan before recording payments.</div>
        <div class="section-actions">
          ${button('Add Member', '#/members/new', 'primary')}
          ${button('Go to Active Loans', '#/active-loans', 'secondary')}
        </div>
      </section>
    `;
  }

  const params = new URLSearchParams((state.route.split('?')[1] || '').trim());
  const selectedLoan = params.get('loan') || state.activeLoans.find((loan) => loan.status !== 'Completed')?.accountNumber;
  const loan = state.activeLoans.find((item) => item.accountNumber === selectedLoan) || state.activeLoans[0];

  return `
    <section class="page-header">
      <div>
        <h3>Record Payment</h3>
        <p>Encode cash, salary deduction, direct payment, online payment, or other collection entries.</p>
      </div>
      <div class="top-actions">
        ${button('Payment History', '#/payments/history', 'secondary')}
      </div>
    </section>

    <div class="grid two-column">
      <section class="panel">
        <form id="payment-form">
          <div class="form-grid two">
            ${field('Select Loan Account', 'loanAccount', loan.accountNumber, { type: 'select', choices: state.activeLoans.map((item) => item.accountNumber) })}
            ${field('Borrower Name', 'borrowerName', loan.borrowerName, { attrs: 'readonly' })}
            ${field('Payment Date', 'paymentDate', new Date().toISOString().slice(0, 10), { type: 'date' })}
            ${field('Amount Paid', 'amountPaid', loan.monthlyAmortization, { type: 'number' })}
            ${field('OR / Reference Number', 'orNumber', `OR-${new Date().toISOString().slice(2, 10).replaceAll('-', '')}`)}
            ${field('Payment Method', 'paymentMethod', 'Cash', { type: 'select', choices: ['Cash', 'Salary Deduction', 'Direct Payment', 'Online Payment', 'Other'] })}
            ${field('Penalty Amount', 'penalty', loan.penalties, { type: 'number' })}
            ${field('Remarks', 'remarks', 'Monthly amortization payment.', { type: 'textarea' })}
          </div>
          <div class="section-actions">
            ${button('Cancel', '#/active-loans', 'secondary')}
            ${button('Record Payment', '', 'primary', 'data-action="record-payment"')}
          </div>
        </form>
      </section>

      <section class="panel">
        <div class="panel-title">
          <div>
            <h3>Loan Balance Preview</h3>
            <p>Balance preview updates after recording a payment.</p>
          </div>
        </div>
        ${summaryCard('Current Loan Account', [
          ['Borrower', loan.borrowerName],
          ['Loan Account', loan.accountNumber],
          ['Remaining Balance', formatCurrency(loan.remainingBalance)],
          ['Paid Months', formatNumber(loan.paidMonths)],
          ['Last Payment Date', formatDate(loan.lastPaymentDate)],
          ['Payment Status', loan.status],
        ])}
      </section>
    </div>
  `;
}

function renderPaymentHistory() {
  return `
    <section class="page-header">
      <div>
        <h3>Payment History</h3>
        <p>All encoded payment transactions in table format.</p>
      </div>
      <div class="top-actions">
        ${button('Record Payment', '#/payments', 'primary')}
        ${button('Print', '', 'secondary', 'data-action="print-page"')}
      </div>
    </section>
    <section class="panel">
      ${paymentHistoryTable(state.payments)}
    </section>
  `;
}

function paymentHistoryTable(rows) {
  return dataTable({
    columns: [
      { key: 'date', label: 'Date', render: (row) => formatDate(row.date) },
      { key: 'borrower', label: 'Borrower' },
      { key: 'loanAccount', label: 'Loan Account' },
      { key: 'amountPaid', label: 'Amount Paid', render: (row) => formatCurrency(row.amountPaid) },
      { key: 'penalty', label: 'Penalty', render: (row) => formatCurrency(row.penalty) },
      { key: 'paymentMethod', label: 'Payment Method' },
      { key: 'orNumber', label: 'OR Number' },
      { key: 'encodedBy', label: 'Encoded By' },
      { key: 'remarks', label: 'Remarks' },
    ],
    rows,
    emptyText: 'No payments recorded for this account.',
  });
}

function renderReports() {
  const filters = state.reportFilters;
  const rows = buildReportRows(filters.type);

  return `
    <section class="page-header">
      <div>
        <h3>${escapeHtml(filters.type)}</h3>
        <p>Use filters, then print or export placeholders for office reporting.</p>
      </div>
      <div class="top-actions">
        ${button('Print Report', '', 'secondary', 'data-action="print-page"')}
        ${button('Export to Excel', '', 'secondary', 'data-action="placeholder-export" data-message="Excel export can be connected after backend data is ready."')}
        ${button('Export to PDF', '', 'secondary', 'data-action="placeholder-export" data-message="PDF export can be connected after report templates are finalized."')}
        ${button('Reset Filters', '', 'secondary', 'data-action="clear-filters"')}
      </div>
    </section>
    <section class="panel">
      <div class="toolbar reports-toolbar" data-filter-group="reportFilters">
        ${field('Report Type', 'type', filters.type, { type: 'select', choices: reportTypes })}
        ${field('Date From', 'from', filters.from, { type: 'date' })}
        ${field('Date To', 'to', filters.to, { type: 'date' })}
        ${field('Search', 'search', filters.search, { placeholder: 'Search table records' })}
        ${field('Status', 'status', filters.status, { type: 'select', choices: ['All', 'Active', 'Pending', 'Approved', 'Released', 'Completed', 'Delayed', 'Delinquent', 'Defaulted'] })}
      </div>
      ${rows}
    </section>
  `;
}

function renderSettings() {
  const draft = state.themeDraft;
  return `
    <section class="page-header">
      <div>
        <h3>Settings</h3>
        <p>Company details, loan defaults, and simple theme customization for staff readability.</p>
      </div>
    </section>

    ${formSection(
      'Company Settings',
      'These values will appear on future printed forms and reports.',
      `<div class="form-grid">
        ${field('Company Name', 'companyName', 'St. Catherine de Alexandria Savings & Credit Cooperative')}
        ${field('Address', 'companyAddress', 'Vigan City, Ilocos Sur', { type: 'textarea' })}
        ${field('CDA Registration Number', 'cdaNumber', 'CDA-REG-0000-0000')}
        ${field('TIN', 'companyTin', '000-000-000-000')}
        ${field('Logo upload placeholder', 'logoUpload', '', { type: 'file' })}
        ${field('Footer text for forms/reports', 'footerText', 'This is a system-generated office copy.', { type: 'textarea' })}
      </div>`,
    )}

    ${formSection(
      'Loan Settings',
      'Default values used by the loan computation card.',
      `<div class="form-grid">
        ${field('Monthly Interest Rate', 'monthlyInterest', '1.17', { type: 'number' })}
        ${field('Default Interest Rate', 'defaultInterest', '14', { type: 'number', helper: 'Yearly equivalent. Monthly estimate is 1.17%.' })}
        ${field('Collection / Service Fee', 'collectionFee', '0', { type: 'number' })}
        ${field('Default Processing Fee Rate', 'defaultProcessing', '1', { type: 'number' })}
        ${field('Penalty Per Month', 'defaultPenalty', '50', { type: 'number' })}
        ${field('Default Loan Terms', 'defaultTerms', '12, 18, 24, 36 months')}
        ${field('Default Grace Period', 'defaultGrace', '0 days')}
        ${field('Minimum Share Capital Requirement', 'minimumShareCapital', '2000', { type: 'number' })}
        ${field('Default Payment Frequency', 'defaultPaymentFrequency', 'Monthly', { type: 'select', choices: ['Daily', 'Monthly'] })}
        ${field('Minimum Net Take-Home Requirement', 'minimumNetTakeHome', '0', { type: 'number' })}
      </div>`,
    )}

    ${formSection(
      'Accessibility and Display',
      'Readable defaults for older staff and office monitors.',
      `<div class="form-grid">
        ${field('Default Font Size', 'defaultFontSize', 'Large', { type: 'select', choices: ['Normal', 'Large', 'Extra Large'] })}
        ${field('Compact Table Mode', 'compactTableMode', 'Off', { type: 'select', choices: ['On', 'Off'] })}
        ${field('High Contrast Mode', 'highContrastMode', 'Off', { type: 'select', choices: ['On', 'Off'] })}
        ${field('Reduce Animations', 'reduceAnimations', 'On', { type: 'select', choices: ['On', 'Off'] })}
        ${field('Confirm Before Saving', 'confirmBeforeSaving', 'On', { type: 'select', choices: ['On', 'Off'] })}
        ${field('Rows Per Page', 'rowsPerPage', '25', { type: 'number' })}
      </div>`,
    )}

    ${formSection(
      'Membership Settings',
      'Membership fees, share defaults, PMES rules, statuses, and specialization suggestions.',
      `<div class="form-grid">
        ${field('Membership Fee', 'membershipFeeSetting', '100', { type: 'number' })}
        ${field('Default Share Value', 'defaultShareValue', '100', { type: 'number' })}
        ${field('Minimum Share Capital', 'minimumShareCapitalSetting', '2000', { type: 'number' })}
        ${field('Membership Types', 'membershipTypesSetting', 'Regular, Associate')}
        ${field('Specialization Suggestions', 'specializationSuggestions', 'Food Safety Management, Engineering, CPA / Accounting, Agriculture, Education, Business, Government Service, Driving / Transportation, Other', { type: 'textarea' })}
        ${field('PMES Required', 'pmesRequired', 'Yes', { type: 'select', choices: ['Yes', 'No'] })}
        ${field('Available Membership Statuses', 'availableMembershipStatuses', 'Active, Pending, Inactive')}
      </div>`,
    )}

    ${formSection(
      'Time Deposit Settings',
      'Default terms, warning windows, and conversion policy.',
      `<div class="form-grid">
        ${field('Default Annual Interest Rate', 'tdDefaultAnnualRate', '5', { type: 'number' })}
        ${field('Default Term', 'tdDefaultTerm', '12 months')}
        ${field('Maturity Warning Days', 'tdWarningDays', '60', { type: 'number' })}
        ${field('Allow Conversion to Share Capital', 'tdAllowConversion', 'Yes', { type: 'select', choices: ['Yes', 'No'] })}
      </div>`,
    )}

    ${formSection(
      'Dividend, Patronage, and Allocation Settings',
      'Rates are editable by reporting year and remain frontend-only previews.',
      `<div class="form-grid">
        ${field('Reporting Year', 'allocationYear', '2026', { type: 'select', choices: ['2023', '2024', '2025', '2026'] })}
        ${field('Dividend Rate per PHP 100 Share', 'dividendRate', '11.1', { type: 'number' })}
        ${field('Share Eligibility Date', 'shareEligibilityDate', '2026-12-31', { type: 'date' })}
        ${field('Dividend Rounding Method', 'dividendRounding', 'Nearest Peso', { type: 'select', choices: ['Nearest Peso', 'Two Decimals', 'Round Down'] })}
        ${field('Dividend Approval Required', 'dividendApprovalRequired', 'Yes', { type: 'select', choices: ['Yes', 'No'] })}
        ${field('Patronage Allocation Percentage', 'patronageAllocationPercentage', '25.9', { type: 'number' })}
        ${field('Patronage Eligibility Rules', 'patronageEligibilityRules', 'Eligible members with loan participation and collected interest.', { type: 'textarea' })}
        ${field('Patronage Approval Required', 'patronageApprovalRequired', 'Yes', { type: 'select', choices: ['Yes', 'No'] })}
        ${field('Reserve Fund Percentage', 'reserveFundPercentage', '50', { type: 'number' })}
        ${field('CETF Federation Percentage', 'cetfFederationPercentage', '0', { type: 'number' })}
        ${field('CETF Local Percentage', 'cetfLocalPercentage', '3', { type: 'number' })}
        ${field('Community Development Fund Percentage', 'communityDevelopmentPercentage', '5', { type: 'number' })}
        ${field('Optional Fund Percentage', 'optionalFundPercentage', '5', { type: 'number' })}
        ${field('Interest on Share Capital Percentage', 'interestShareCapitalPercentage', '11.1', { type: 'number' })}
        ${field('Patronage Refund Percentage', 'patronageRefundPercentage', '25.9', { type: 'number' })}
      </div>
      <div class="notice">Allocation percentage total: 100.0%. Change these defaults carefully before finalizing reports.</div>`,
    )}

    <section class="form-section">
      <h4>Theme / Color Customization</h4>
      <p class="section-helper">Choose clear colors. Settings are saved in localStorage and applied using CSS variables.</p>
      <div class="preset-grid">
        ${themePresets
          .map(
            (preset, index) => `
              <button type="button" class="preset-button" data-action="apply-preset" data-index="${index}">
                <span>${escapeHtml(preset.name)}</span>
                <span class="preset-swatches">
                  ${Object.values(preset.theme)
                    .slice(0, 5)
                    .map((color) => `<span class="swatch" style="background:${escapeHtml(color)}"></span>`)
                    .join('')}
                </span>
              </button>
            `,
          )
          .join('')}
      </div>

      <div class="grid two-column" style="margin-top: 16px;">
        <div class="form-grid two" data-theme-form>
          ${field('Primary Color', 'primary', draft.primary, { type: 'color' })}
          ${field('Secondary Color', 'secondary', draft.secondary, { type: 'color' })}
          ${field('Accent Color', 'accent', draft.accent, { type: 'color' })}
          ${field('Page Background', 'background', draft.background, { type: 'color' })}
          ${field('Card Background', 'surface', draft.surface || '#ffffff', { type: 'color' })}
          ${field('Text Color', 'text', draft.text, { type: 'color' })}
          ${field('Sidebar Color', 'sidebar', draft.sidebar, { type: 'color' })}
          ${field('Main Button Color', 'button', draft.button, { type: 'color' })}
          ${field('Border Color', 'border', draft.border || '#d8e0da', { type: 'color' })}
          ${field('Success Color', 'success', draft.success || '#237a3b', { type: 'color' })}
          ${field('Warning Color', 'warning', draft.warning || '#b36b00', { type: 'color' })}
          ${field('Danger Color', 'danger', draft.danger || '#b42318', { type: 'color' })}
          ${field('Chart Color Palette', 'chartPalette', draft.chartPalette || '#237a3b,#1f6f9e,#d99a22,#7c3aed,#0f8b8d,#b42318', { helper: 'Comma-separated chart colors.' })}
        </div>
        <div class="theme-preview" style="--preview-bg:${escapeHtml(draft.background)}; --preview-text:${escapeHtml(draft.text)}; --preview-sidebar:${escapeHtml(draft.sidebar)}; --preview-button:${escapeHtml(draft.button)};">
          <div class="preview-sidebar">Sidebar Preview</div>
          <div class="preview-body">
            <strong>Preview Card</strong>
            <p>This shows how the selected colors look on a simple office screen.</p>
            <span class="preview-button">Main Button Color</span>
          </div>
        </div>
      </div>
      <div class="section-actions">
        ${button('Reset to Default', '', 'warning', 'data-action="reset-theme"')}
        ${button('Save Theme', '', 'primary', 'data-action="save-theme"')}
      </div>
    </section>
  `;
}

function buildReportRows(type) {
  const search = state.reportFilters.search.toLowerCase();
  const status = state.reportFilters.status;

  if (['Member Registry Report', 'Registry of Members', 'Member Registry as of Date'].includes(type)) {
    const rows = state.members.filter((member) => {
      const text = `${member.id} ${member.fullName} ${member.barangay}`.toLowerCase();
      return text.includes(search) && matchFilter(member.membershipStatus, status);
    });
    return dataTable({
      columns: [
        { key: 'id', label: 'Member ID' },
        { key: 'fullName', label: 'Full Name' },
        { key: 'barangay', label: 'Barangay' },
        { key: 'mobile', label: 'Contact' },
        { key: 'membershipStatus', label: 'Status', render: (row) => statusBadge(row.membershipStatus) },
        { key: 'shareCapital', label: 'Share Capital', render: (row) => formatCurrency(row.shareCapital) },
      ],
      rows,
    });
  }

  if (['Loan Application Report', 'Loan Register', 'Loan Releases'].includes(type)) {
    const rows = state.loanApplications.filter((loan) => {
      const text = `${loan.id} ${loan.borrowerName} ${loan.memberId}`.toLowerCase();
      return text.includes(search) && matchFilter(loan.status, status);
    });
    return dataTable({
      columns: [
        { key: 'id', label: 'Application Number' },
        { key: 'borrowerName', label: 'Borrower' },
        { key: 'requestedAmount', label: 'Requested Amount', render: (row) => formatCurrency(row.requestedAmount) },
        { key: 'approvedAmount', label: 'Approved Amount', render: (row) => formatCurrency(row.approvedAmount) },
        { key: 'applicationDate', label: 'Date', render: (row) => formatDate(row.applicationDate) },
        { key: 'status', label: 'Status', render: (row) => statusBadge(row.status) },
      ],
      rows,
    });
  }

  if (type === 'Statement of Account') {
    return dataTable({
      columns: [
        { key: 'accountNumber', label: 'Loan Account' },
        { key: 'borrowerName', label: 'Borrower' },
        { key: 'originalAmount', label: 'Principal', render: (row) => formatCurrency(row.originalAmount) },
        { key: 'totalPayable', label: 'Total Payable', render: (row) => formatCurrency(row.totalPayable) },
        { key: 'remainingBalance', label: 'Remaining Balance', render: (row) => formatCurrency(row.remainingBalance) },
        { key: 'nextDueDate', label: 'Next Due Date', render: (row) => formatDate(row.nextDueDate) },
        { key: 'status', label: 'Status', render: (row) => statusBadge(row.status) },
      ],
      rows: state.activeLoans.filter((loan) => `${loan.accountNumber} ${loan.borrowerName}`.toLowerCase().includes(search) && matchFilter(loan.status, status)),
    });
  }

  if (['Collection Report', 'Loan Payments', 'Penalties', 'Processing Fees'].includes(type)) {
    return paymentHistoryTable(state.payments.filter((payment) => `${payment.borrower} ${payment.loanAccount}`.toLowerCase().includes(search)));
  }

  if (['Delinquent Loans Report', 'Delinquent Loans'].includes(type)) {
    return dataTable({
      columns: [
        { key: 'accountNumber', label: 'Loan Account' },
        { key: 'borrowerName', label: 'Borrower' },
        { key: 'remainingBalance', label: 'Remaining Balance', render: (row) => formatCurrency(row.remainingBalance) },
        { key: 'nextDueDate', label: 'Due Date' },
        { key: 'penalties', label: 'Penalty', render: (row) => formatCurrency(row.penalties) },
        { key: 'status', label: 'Status', render: (row) => statusBadge(row.status) },
      ],
      rows: state.activeLoans.filter((loan) => ['Delayed', 'Delinquent', 'Defaulted'].includes(loan.status)),
    });
  }

  if (['Capital Share Report', 'Capital Subscription', 'Paid-Up Share Capital', 'Regular Savings'].includes(type)) {
    return dataTable({
      columns: [
        { key: 'id', label: 'Member ID' },
        { key: 'fullName', label: 'Member' },
        { key: 'shareCapital', label: 'Share Capital', render: (row) => formatCurrency(row.shareCapital) },
        { key: 'shareCapitalDate', label: 'Date Paid', render: (row) => formatDate(row.shareCapitalDate) },
        { key: 'shareCapitalOr', label: 'OR Number' },
      ],
      rows: state.members,
    });
  }

  if (['Time Deposit Report', 'Time Deposits'].includes(type)) {
    return dataTable({
      columns: [
        { key: 'id', label: 'Member ID' },
        { key: 'fullName', label: 'Member' },
        { key: 'timeDeposit', label: 'Time Deposit', render: (row) => formatCurrency(row.timeDeposit) },
        { key: 'timeDepositDate', label: 'Date Paid', render: (row) => formatDate(row.timeDepositDate) },
        { key: 'timeDepositOr', label: 'OR Number' },
      ],
      rows: state.members,
    });
  }

  if (['Demographics Report', 'Membership by Type', 'Members by Barangay', 'Members by Sex', 'Members by Civil Status', 'Members by Age Group', 'Members by Profession', 'Members by Education', 'Members by Income Classification', 'Members by Specialization'].includes(type)) {
    const rows = [
      ...groupRows(state.members, 'gender').map((row) => ({ type: 'Gender', ...row })),
      ...groupRows(state.members, 'civilStatus').map((row) => ({ type: 'Civil Status', ...row })),
      ...groupRows(state.members, 'businessType', 'Employment').map((row) => ({ type: 'Employment Type', ...row })),
    ];
    return dataTable({
      columns: [
        { key: 'type', label: 'Group' },
        { key: 'label', label: 'Category' },
        { key: 'value', label: 'Count' },
      ],
      rows,
    });
  }

  const totalReceivables = state.activeLoans.reduce((sum, loan) => sum + loan.remainingBalance, 0);
  const totalCollections = state.payments.reduce((sum, payment) => sum + payment.amountPaid, 0);
  const totalShareCapital = state.members.reduce((sum, member) => sum + member.shareCapital, 0);
  const totalTimeDeposit = state.members.reduce((sum, member) => sum + member.timeDeposit, 0);
  return dataTable({
    columns: [
      { key: 'label', label: 'Financial Item' },
      { key: 'value', label: 'Amount', render: (row) => formatCurrency(row.value) },
    ],
    rows: [
      { label: 'Total Loan Receivables', value: totalReceivables },
      { label: 'Total Collections', value: totalCollections },
      { label: 'Total Share Capital', value: totalShareCapital },
      { label: 'Total Time Deposit', value: totalTimeDeposit },
    ],
  });
}

function createBlankMember() {
  const next = state.members.length + 1001;
  return {
    id: `M-${next}`,
    lastName: '',
    firstName: '',
    middleName: '',
    extension: '',
    fullName: '',
    initials: '',
    birthDate: '',
    birthPlace: '',
    gender: 'Female',
    civilStatus: 'Single',
    tin: '',
    citizenship: 'Filipino',
    religion: '',
    education: '',
    averageMonthlyIncome: 0,
    presentAddress: '',
    permanentAddress: '',
    houseNumber: '',
    barangay: '',
    city: 'Vigan City',
    province: 'Ilocos Sur',
    zip: '2700',
    yearsOfStay: 0,
    houseStatus: 'Fully Owned House',
    mobile: '',
    telephone: '',
    email: '',
    facebook: '',
    emergencyContact: '',
    emergencyNumber: '',
    fatherName: '',
    motherName: '',
    completeMotherName: '',
    spouseName: '',
    spouseOccupation: '',
    dependents: 0,
    occupation: '',
    employerName: '',
    employerAddress: '',
    employmentStatus: 'Permanent',
    yearsInService: 0,
    monthlySalary: 0,
    employerContact: '',
    businessType: '',
    monthlyIncome: 0,
    yearsInOperation: 0,
    ownsLand: 'No',
    landlordName: '',
    farmlandSize: '',
    farmLocation: '',
    incomePerCrop: 0,
    livestock: '',
    incomePerYear: 0,
    otherIncome: '',
    monthlyPension: 0,
    membershipStatus: 'Pending',
    membershipType: 'Regular',
    dateAccepted: '',
    boardResolution: '',
    evaluation: 'Not Approved',
    pmesCompleted: 'No',
    pmesDate: '',
    pmesConductedBy: '',
    membershipFeePaid: 'No',
    membershipFeeAmount: 0,
    membershipFeeDate: '',
    membershipFeeOr: '',
    shareCapital: 0,
    shareValue: 100,
    sharesSubscribed: 0,
    amountSubscribed: 0,
    paidUpShareCapital: 0,
    unpaidSubscriptionBalance: 0,
    initialSharePaymentDate: '',
    capitalOrNumber: '',
    authorizedSharePercentage: 0,
    proposedAuthorizedSharePercentage: 0,
    shareCapitalDate: '',
    shareCapitalOr: '',
    timeDeposit: 0,
    timeDepositDate: '',
    timeDepositOr: '',
    collectedBy: '',
    certifiedBy: '',
    dateCertified: '',
    remarks: '',
    specialization: '',
    regularSavings: 0,
    timeDeposits: 0,
    accountsReceivable: 0,
    outstandingLoanBalance: 0,
    totalCapitalShare: 0,
    totalDividends: 0,
    totalPatronageRefund: 0,
    coMaker: 'No',
    investorGuarantor: 'No',
    activeLoanCount: 0,
  };
}

function createBlankLoanApplication() {
  const memberParam = new URLSearchParams((state.route.split('?')[1] || '').trim()).get('member');
  const member = state.members.find((item) => item.id === memberParam) || state.members[0] || createBlankMember();
  const next = String(state.loanApplications.length + 1).padStart(3, '0');
  return {
    id: `APP-2026-${next}`,
    accountNumber: '',
    memberId: member.id,
    borrowerName: member.fullName,
    requestedAmount: 0,
    approvedAmount: 0,
    applicationDate: new Date().toISOString().slice(0, 10),
    purpose: 'Productive',
    status: 'Draft',
    termMonths: 12,
    installmentType: 'Monthly',
    startDate: '',
    endDate: '',
    installmentAmount: 0,
    paymentMethod: 'Cash',
    coMakerName: '',
    coMakerMemberId: '',
    coMakerContact: '',
    coMakerRelationship: '',
    coMakerAgreement: false,
    coMakerSignatureStatus: 'Pending',
    employerName: member.employerName,
    position: member.occupation,
    monthlySalary: member.monthlySalary,
    payrollValidated: 'No',
    salaryDeductionAuthorized: 'No',
    authorizedSignatory: '',
    dateSigned: '',
    requirements: 'Incomplete',
    receivedBy: '',
    dateReceived: '',
    evaluatedBy: '',
    recommendation: '',
    boardDecision: '',
    disapprovalReason: '',
    remarks: '',
    computation: {
      loanAmount: 0,
      termMonths: 12,
      annualInterestRate: 12,
      collectionFeeRate: 2,
      processingFeeRate: 1,
      previousLoanBalance: 0,
      existingCapitalShare: member.shareCapital,
      additionalCapitalShare: 0,
      savingsDeposit: 0,
      timeDeposit: member.timeDeposit,
      releaseDate: new Date().toISOString().slice(0, 10),
      firstDueDate: '',
    },
  };
}

function groupRows(rows, key, emptyLabel = 'None') {
  const counts = rows.reduce((acc, row) => {
    const value = row[key] || emptyLabel;
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).map(([label, value]) => ({ label, value }));
}

function uniqueValues(rows, key) {
  return [...new Set(rows.map((row) => row[key]).filter(Boolean))].sort();
}

function matchFilter(value, filter) {
  return filter === 'All' || value === filter;
}

function sortRows(rows, sort) {
  return [...rows].sort((a, b) => {
    const aValue = a[sort.key] ?? '';
    const bValue = b[sort.key] ?? '';
    const result = String(aValue).localeCompare(String(bValue), undefined, {
      numeric: true,
      sensitivity: 'base',
    });
    return sort.direction === 'asc' ? result : -result;
  });
}

function notFound(message) {
  return `
    <section class="panel">
      <div class="empty-state">${escapeHtml(message)}</div>
      ${button('Go to Dashboard', '#/dashboard', 'primary')}
    </section>
  `;
}

function getFormValues(form) {
  const values = {};
  new FormData(form).forEach((value, key) => {
    values[key] = value;
  });
  form.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    values[input.name] = input.checked;
  });
  return values;
}

async function updateMemberFromForm(form) {
  preserveMemberFormDraft(form);
  const existingId = form.dataset.memberId;
  const current = existingId ? state.members.find((member) => member.id === existingId) : null;
  const target = state.memberDraft || current || createBlankMember();
  target.fullName = `${target.lastName || ''}, ${target.firstName || ''} ${target.middleName ? `${target.middleName.charAt(0)}.` : ''}`.trim();
  target.initials = `${target.firstName?.charAt(0) || 'N'}${target.lastName?.charAt(0) || 'M'}`.toUpperCase();
  if (!current) {
    state.members.push(target);
  }
  try {
    const saved = await memberService.saveOne(target);
    const stateIndex = state.members.findIndex((member) => member.id === saved.id);
    if (stateIndex >= 0) state.members[stateIndex] = saved;
    state.memberDraft = structuredClone(saved);
    state.memberDraftKey = saved.id;
    state.notice = `${target.fullName || target.id} was saved in Supabase.`;
    location.hash = `#/members/${target.id}`;
  } catch (error) {
    console.error('Supabase member save failed.', error);
    if (!current) {
      state.members = state.members.filter((member) => member !== target);
    }
    const validationDetails = Object.values(error.errors || {}).join(' ');
    const detail = [error.code, validationDetails || error.message].filter(Boolean).join(': ');
    state.notice = `${target.fullName || target.id} was not saved. ${detail || 'Supabase rejected the request.'}`;
    renderShell();
  }
}

function preserveMemberFormDraft(form = document.querySelector('#member-form')) {
  if (!form || !state.memberDraft) return;
  Object.assign(state.memberDraft, getFormValues(form));
  numericMemberFields().forEach((key) => {
    state.memberDraft[key] = toNumber(state.memberDraft[key]);
  });
}

function numericMemberFields() {
  return [
    'averageMonthlyIncome',
    'yearsOfStay',
    'dependents',
    'yearsInService',
    'monthlySalary',
    'monthlyIncome',
    'yearsInOperation',
    'incomePerCrop',
    'incomePerYear',
    'monthlyPension',
    'shareCapital',
    'shareValue',
    'sharesSubscribed',
    'amountSubscribed',
    'paidUpShareCapital',
    'unpaidSubscriptionBalance',
    'authorizedSharePercentage',
    'proposedAuthorizedSharePercentage',
    'membershipFeeAmount',
    'regularSavings',
    'timeDeposits',
    'accountsReceivable',
    'outstandingLoanBalance',
    'totalCapitalShare',
    'totalDividends',
    'totalPatronageRefund',
    'timeDeposit',
    'activeLoanCount',
  ];
}

async function refreshLoanPaymentState() {
  const remote = await loadLoanAndPaymentState();
  state.activeLoans = remote.loans;
  state.payments = remote.payments;
  state.loanApplications = remote.loans.map(remoteLoanToApplication);
}

function remoteLoanToApplication(loan) {
  const raw = loan.raw || {};
  return {
    id: loan.accountNumber,
    dbId: loan.id,
    accountNumber: loan.accountNumber,
    memberId: loan.memberId,
    borrowerName: loan.borrowerName,
    requestedAmount: loan.originalAmount,
    approvedAmount: loan.originalAmount,
    applicationDate: raw.created_at?.slice(0, 10) || loan.releaseDate,
    purpose: '',
    status: loan.status,
    termMonths: loan.termMonths,
    startDate: loan.releaseDate,
    endDate: '',
    installmentAmount: loan.monthlyAmortization,
    paymentMethod: 'Cash',
    remarks: '',
    computation: {
      loanAmount: loan.originalAmount,
      termMonths: loan.termMonths,
      annualInterestRate: loan.originalAmount ? Number(raw.interest_amount || 0) / loan.originalAmount * 100 : 12,
      collectionFeeRate: loan.originalAmount ? Number(raw.collection_fee || 0) / loan.originalAmount * 100 : 2,
      processingFeeRate: loan.originalAmount ? Number(raw.processing_fee || 0) / loan.originalAmount * 100 : 1,
      releaseDate: loan.releaseDate,
      firstDueDate: loan.releaseDate,
      previousLoanBalance: 0,
      existingCapitalShare: 0,
      additionalCapitalShare: 0,
      savingsDeposit: 0,
      timeDeposit: 0,
    },
  };
}

async function updateLoanFromForm(form) {
  const values = getFormValues(form);
  const existingId = form.dataset.applicationId;
  const current = existingId ? state.loanApplications.find((loan) => loan.id === existingId) : null;
  const target = current || createBlankLoanApplication();
  const member = state.members.find((item) => item.id === values.memberId) || state.members[0];

  Object.assign(target, values);
  target.borrowerName = member.fullName;
  ['requestedAmount', 'approvedAmount', 'termMonths', 'installmentAmount', 'monthlySalary'].forEach((key) => {
    target[key] = toNumber(target[key]);
  });
  target.computation = {
    loanAmount: toNumber(values.loanAmount, target.approvedAmount || target.requestedAmount),
    termMonths: toNumber(values.termMonths, target.termMonths || 12),
    annualInterestRate: toNumber(values.annualInterestRate, 12),
    collectionFeeRate: toNumber(values.collectionFeeRate, 2),
    processingFeeRate: toNumber(values.processingFeeRate, 1),
    previousLoanBalance: toNumber(values.previousLoanBalance),
    existingCapitalShare: toNumber(values.existingCapitalShare, member.shareCapital),
    additionalCapitalShare: toNumber(values.additionalCapitalShare),
    savingsDeposit: toNumber(values.savingsDeposit),
    timeDeposit: toNumber(values.timeDeposit, member.timeDeposit),
    releaseDate: values.releaseDate || new Date().toISOString().slice(0, 10),
    firstDueDate: values.firstDueDate || values.startDate || '',
  };

  const payload = {
    member_id: member.id,
    voucher_no: values.id || target.id,
    loan_year: (target.computation.releaseDate || '').slice(0, 4),
    loan_amount: target.computation.loanAmount,
    loan_terms: target.computation.termMonths,
    interest_rate: target.computation.annualInterestRate / 100,
    collection_fee_rate: target.computation.collectionFeeRate / 100,
    processing_fee_rate: target.computation.processingFeeRate / 100,
    loan_released: target.computation.releaseDate,
    status: target.status === 'Completed' ? 'Paid' : target.status,
  };

  try {
    const saved = current?.dbId ? await loanService.update(current.dbId, payload) : await loanService.create(payload);
    await refreshLoanPaymentState();
    const routeId = saved.voucher_no || saved.id;
    state.notice = `${routeId} was saved in Supabase.`;
    location.hash = `#/loan-applications/${routeId}`;
  } catch (error) {
    console.error('Supabase loan save failed.', error);
    state.notice = error.message || 'Loan could not be saved.';
    renderShell();
  }
}

async function recordPayment(form) {
  const values = getFormValues(form);
  const loan = state.activeLoans.find((item) => item.accountNumber === values.loanAccount);
  if (!loan) return;
  try {
    const result = await paymentService.create({
      loan_id: loan.id,
      member_id: loan.memberId,
      payment_date: values.paymentDate,
      amount_paid: toNumber(values.amountPaid),
      penalty: toNumber(values.penalty),
      payment_method: values.paymentMethod,
      or_number: values.orNumber,
      encoded_by: 'Staff',
      remarks: values.remarks,
    });
    await refreshLoanPaymentState();
    state.notice = `Payment recorded for ${loan.borrowerName}. Remaining balance is now ${formatCurrency(result.loan.loan_receivable)}.`;
    location.hash = '#/payments/history';
  } catch (error) {
    console.error('Supabase payment save failed.', error);
    state.notice = error.message || 'Payment could not be recorded.';
    renderShell();
  }
}

function openConfirm(config) {
  state.confirm = config;
  renderShell();
}

function closeConfirm() {
  state.confirm = null;
  renderShell();
}

function approveLoan(id) {
  openConfirm({
    title: 'Approve Loan Application',
    message: `Approve ${id}? This will update the application status to Approved.`,
    confirmLabel: 'Approve',
    onConfirm: () => {
      const item = state.loanApplications.find((loan) => loan.id === id);
      if (item) {
        item.status = 'Approved';
        item.approvedAmount = item.approvedAmount || item.requestedAmount;
        item.computation.loanAmount = item.approvedAmount;
        state.notice = `${id} was approved.`;
      }
    },
  });
}

function rejectLoan(id) {
  openConfirm({
    title: 'Reject Loan Application',
    message: `Reject ${id}? Staff can still edit the application details later.`,
    confirmLabel: 'Reject',
    danger: true,
    onConfirm: () => {
      const item = state.loanApplications.find((loan) => loan.id === id);
      if (item) {
        item.status = 'Disapproved';
        item.disapprovalReason = item.disapprovalReason || 'Incomplete requirements.';
        state.notice = `${id} was marked Disapproved.`;
      }
    },
  });
}

function handleInput(event) {
  const memberForm = event.target.closest('#member-form');
  if (memberForm && event.target.name && state.memberDraft) {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    state.memberDraft[event.target.name] = numericMemberFields().includes(event.target.name)
      ? toNumber(value)
      : value;
    return;
  }

  const filterGroup = event.target.closest('[data-filter-group]');
  if (filterGroup && event.target.name) {
    state[filterGroup.dataset.filterGroup][event.target.name] = event.target.value;
    renderShell();
    return;
  }

  const themeForm = event.target.closest('[data-theme-form]');
  if (themeForm && event.target.name) {
    state.themeDraft[event.target.name] = event.target.value;
    applyTheme(state.themeDraft);
    renderShell();
  }
}

async function handleClick(event) {
  const actionElement = event.target.closest('[data-action]');
  const sortHeader = event.target.closest('[data-sort]');
  if (sortHeader) {
    handleSort(sortHeader.dataset.sort);
    return;
  }
  if (!actionElement) return;

  const action = actionElement.dataset.action;
  if (action !== 'set-member-tab' && action !== 'set-loan-step') {
    event.preventDefault();
  }

  if (action === 'toggle-menu') {
    document.querySelector('#sidebar')?.classList.toggle('open');
  }
  if (action === 'set-member-tab') {
    preserveMemberFormDraft();
    state.memberTab = actionElement.dataset.tab;
    renderShell();
  }
  if (action === 'set-loan-step') {
    state.loanStep = Number(actionElement.dataset.step);
    renderShell();
  }
  if (action === 'save-member') {
    await updateMemberFromForm(document.querySelector('#member-form'));
  }
  if (action === 'save-loan-draft') {
    await updateLoanFromForm(document.querySelector('#loan-form'));
  }
  if (action === 'approve-loan') {
    approveLoan(actionElement.dataset.id);
  }
  if (action === 'reject-loan') {
    rejectLoan(actionElement.dataset.id);
  }
  if (action === 'record-payment') {
    await recordPayment(document.querySelector('#payment-form'));
  }
  if (action === 'print-page') {
    window.print();
  }
  if (action === 'refresh-page') {
    state.notice = 'Dashboard and local records refreshed.';
    renderShell();
  }
  if (action === 'clear-filters') {
    state.memberFilters = { search: '', status: 'All', barangay: 'All', gender: 'All', civilStatus: 'All', membershipType: 'All', specialization: 'All' };
    state.loanFilters = { search: '', status: 'All' };
    state.activeLoanFilters = { search: '', status: 'All' };
    state.reportFilters = { type: reportTypes[0], search: '', status: 'All', from: '2026-01-01', to: '2026-12-31' };
    state.notice = 'Filters cleared.';
    renderShell();
  }
  if (action === 'placeholder-export') {
    state.notice = actionElement.dataset.message || 'This button is a placeholder for backend export.';
    renderShell();
  }
  if (action === 'apply-preset') {
    const preset = themePresets[Number(actionElement.dataset.index)];
    state.themeDraft = structuredClone(preset.theme);
    applyTheme(state.themeDraft);
    state.notice = `${preset.name} preset applied. Click Save Theme to keep it.`;
    renderShell();
  }
  if (action === 'save-theme') {
    state.theme = structuredClone(state.themeDraft);
    localStorage.setItem('sacada-theme', JSON.stringify(state.theme));
    applyTheme(state.theme);
    state.notice = 'Theme colors saved in this browser.';
    renderShell();
  }
  if (action === 'reset-theme') {
    openConfirm({
      title: 'Reset Theme Colors',
      message: 'Reset the system colors back to SACADA Default?',
      confirmLabel: 'Reset Theme',
      danger: true,
      onConfirm: () => {
        state.theme = structuredClone(defaultTheme);
        state.themeDraft = structuredClone(defaultTheme);
        localStorage.removeItem('sacada-theme');
        applyTheme(state.theme);
        state.notice = 'Theme colors were reset to SACADA Default.';
      },
    });
  }
  if (action === 'close-confirm') {
    closeConfirm();
  }
  if (action === 'confirm-action') {
    const callback = state.confirm?.onConfirm;
    state.confirm = null;
    callback?.();
    renderShell();
  }
}

function handleSort(key) {
  const active = activeNavId();
  const sortKey = active === 'members' ? 'members' : active === 'applications' ? 'applications' : 'activeLoans';
  const current = state.sort[sortKey];
  state.sort[sortKey] = {
    key,
    direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
  };
  renderShell();
}

window.addEventListener('hashchange', () => {
  state.route = location.hash || '#/dashboard';
  state.scrollTopOnRender = true;
  renderShell();
});

document.addEventListener('input', handleInput);
document.addEventListener('change', (event) => {
  if (event.target.name === 'loanAccount' && event.target.closest('#payment-form')) {
    location.hash = `#/payments?loan=${event.target.value}`;
  }
});
document.addEventListener('click', handleClick);

applyTheme(state.theme);
if (!location.hash) {
  location.hash = '#/dashboard';
} else {
  state.scrollTopOnRender = true;
  renderShell();
}
