import { formatCurrency, formatDate } from './calculations.js';

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function slug(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function statusBadge(status) {
  const clean = status || 'N/A';
  return `<span class="status-badge status-${slug(clean)}">${escapeHtml(clean)}</span>`;
}

export function button(label, href, variant = 'secondary', attrs = '') {
  const tag = href ? 'a' : 'button';
  const hrefAttr = href ? ` href="${href}"` : ' type="button"';
  return `<${tag}${hrefAttr} class="button ${variant}" ${attrs}>${escapeHtml(label)}</${tag}>`;
}

export function statCard(label, value, helper = '') {
  return `
    <article class="stat-card">
      <div class="label">${escapeHtml(label)}</div>
      <div class="value">${escapeHtml(value)}</div>
      ${helper ? `<div class="helper">${escapeHtml(helper)}</div>` : ''}
    </article>
  `;
}

export function panel(title, body, subtitle = '') {
  return `
    <section class="panel">
      <div class="panel-title">
        <div>
          <h3>${escapeHtml(title)}</h3>
          ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
        </div>
      </div>
      ${body}
    </section>
  `;
}

export function formSection(title, helper, body) {
  return `
    <section class="form-section">
      <h4>${escapeHtml(title)}</h4>
      ${helper ? `<p class="section-helper">${escapeHtml(helper)}</p>` : ''}
      ${body}
    </section>
  `;
}

export function field(label, name, value = '', options = {}) {
  const {
    type = 'text',
    helper = '',
    choices = [],
    placeholder = '',
    rows = 3,
    attrs = '',
  } = options;

  const safeValue = escapeHtml(value);
  const id = escapeHtml(name);
  let control = '';

  if (type === 'select') {
    control = `
      <select id="${id}" name="${escapeHtml(name)}" ${attrs}>
        ${choices
          .map(
            (choice) =>
              `<option value="${escapeHtml(choice)}" ${String(choice) === String(value) ? 'selected' : ''}>${escapeHtml(choice)}</option>`,
          )
          .join('')}
      </select>
    `;
  } else if (type === 'textarea') {
    control = `<textarea id="${id}" name="${escapeHtml(name)}" rows="${rows}" placeholder="${escapeHtml(placeholder)}" ${attrs}>${safeValue}</textarea>`;
  } else if (type === 'checkbox') {
    control = `<input id="${id}" type="checkbox" name="${escapeHtml(name)}" ${value ? 'checked' : ''} ${attrs} />`;
  } else {
    control = `<input id="${id}" type="${escapeHtml(type)}" name="${escapeHtml(name)}" value="${safeValue}" placeholder="${escapeHtml(placeholder)}" ${attrs} />`;
  }

  return `
    <div class="field">
      <label for="${id}">${escapeHtml(label)}</label>
      ${control}
      ${helper ? `<small>${escapeHtml(helper)}</small>` : ''}
    </div>
  `;
}

export function dataTable({ columns, rows, emptyText = 'No records found.' }) {
  if (!rows.length) {
    return `<div class="table-wrap"><div class="empty-state">${escapeHtml(emptyText)}</div></div>`;
  }

  const headers = columns
    .map((column) => {
      const sortAttr = column.sortable ? ` data-sort="${escapeHtml(column.key)}"` : '';
      return `<th class="${column.sortable ? 'sortable' : ''}"${sortAttr}>${escapeHtml(column.label)}${column.sortable ? ' Sort' : ''}</th>`;
    })
    .join('');

  const body = rows
    .map(
      (row) => `
        <tr>
          ${columns
            .map((column) => {
              const raw = row[column.key];
              const value = column.render ? column.render(row) : escapeHtml(raw ?? '');
              return `<td>${value}</td>`;
            })
            .join('')}
        </tr>
      `,
    )
    .join('');

  return `
    <div class="table-wrap">
      <table>
        <thead><tr>${headers}</tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  `;
}

export function summaryCard(title, rows) {
  return `
    <div class="summary-card">
      <h4>${escapeHtml(title)}</h4>
      <dl class="summary-list">
        ${rows
          .map(
            ([label, value]) => `
              <div class="summary-row">
                <span>${escapeHtml(label)}</span>
                <strong>${escapeHtml(value)}</strong>
              </div>
            `,
          )
          .join('')}
      </dl>
    </div>
  `;
}

export function barChart(rows) {
  if (!rows.length || rows.every((row) => !row.value)) {
    return '<div class="empty-state">No records yet.</div>';
  }

  const max = Math.max(...rows.map((row) => row.value), 1);
  return `
    <div class="bar-list">
      ${rows
        .map(
          (row) => `
            <div class="bar-row">
              <div class="bar-label"><span>${escapeHtml(row.label)}</span><span>${escapeHtml(row.display ?? row.value)}</span></div>
              <div class="bar-track"><div class="bar-fill" style="width: ${(row.value / max) * 100}%"></div></div>
            </div>
          `,
        )
        .join('')}
    </div>
  `;
}

export function miniColumnChart(rows) {
  if (!rows.length || rows.every((row) => !row.value)) {
    return '<div class="empty-state">No monthly data yet.</div>';
  }

  const max = Math.max(...rows.map((row) => row.value), 1);
  return `
    <div class="mini-chart">
      ${rows
        .map(
          (row) => `
            <div class="mini-col">
              <div class="mini-bar" style="height: ${Math.max(14, (row.value / max) * 150)}px" title="${escapeHtml(row.label)} ${escapeHtml(row.display ?? row.value)}"></div>
              <div class="mini-label">${escapeHtml(row.label)}</div>
            </div>
          `,
        )
        .join('')}
    </div>
  `;
}

export function computationOutputs(computed) {
  const rows = [
    ['Principal Loan Amount', formatCurrency(computed.loanAmount)],
    ['Total Interest / Collection Charge', formatCurrency(computed.totalInterest)],
    ['Total Amount Payable', formatCurrency(computed.totalPayable)],
    ['Monthly Amortization', formatCurrency(computed.monthlyAmortization)],
    ['Processing Fee', formatCurrency(computed.processingFee)],
    ['Previous Loan Balance Deduction', formatCurrency(computed.previousLoanBalance)],
    ['Additional Capital Share', formatCurrency(computed.additionalCapitalShare)],
    ['Net Take Home Amount', formatCurrency(computed.netTakeHome)],
    ['Ending Loan Balance', formatCurrency(computed.endingLoanBalance)],
    ['Existing Capital Share', formatCurrency(computed.existingCapitalShare)],
    ['Savings Deposit', formatCurrency(computed.savingsDeposit)],
    ['Time Deposit', formatCurrency(computed.timeDeposit)],
  ];

  return `
    <div class="computed-grid">
      ${rows
        .map(
          ([label, value]) => `
            <div class="computed-item">
              <span>${escapeHtml(label)}</span>
              <strong>${escapeHtml(value)}</strong>
            </div>
          `,
        )
        .join('')}
    </div>
  `;
}

export function amortizationTable(schedule) {
  return dataTable({
    columns: [
      { key: 'month', label: 'Month Number' },
      { key: 'dueDate', label: 'Due Date', render: (row) => formatDate(row.dueDate) },
      { key: 'totalPayable', label: 'Total Amount Payable', render: (row) => formatCurrency(row.totalPayable) },
      { key: 'monthlyAmortization', label: 'Monthly Amortization', render: (row) => formatCurrency(row.monthlyAmortization) },
      { key: 'principalPortion', label: 'Principal Portion', render: (row) => formatCurrency(row.principalPortion) },
      { key: 'interestPortion', label: 'Interest / Collection Charge', render: (row) => formatCurrency(row.interestPortion) },
      { key: 'endingBalance', label: 'Ending Loan Balance', render: (row) => formatCurrency(row.endingBalance) },
      { key: 'status', label: 'Payment Status', render: (row) => statusBadge(row.status) },
    ],
    rows: schedule,
  });
}
