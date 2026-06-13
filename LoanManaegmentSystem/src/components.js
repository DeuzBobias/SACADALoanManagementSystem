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

export function emptyState(title, message, actionHtml = '') {
  return `
    <div class="empty-state">
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(message)}</p>
      ${actionHtml ? `<div class="section-actions">${actionHtml}</div>` : ''}
    </div>
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

export function dashboardSection(title, helper, body) {
  return `
    <section class="dashboard-section">
      <div class="panel-title">
        <div>
          <h3>${escapeHtml(title)}</h3>
          ${helper ? `<p>${escapeHtml(helper)}</p>` : ''}
        </div>
      </div>
      ${body}
    </section>
  `;
}

export function chartCard(title, body, helper = '', detailsHref = '') {
  return `
    <section class="chart-card">
      <div class="panel-title">
        <div>
          <h3>${escapeHtml(title)}</h3>
          ${helper ? `<p>${escapeHtml(helper)}</p>` : ''}
        </div>
        ${detailsHref ? button('View Details', detailsHref, 'secondary small') : ''}
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

export function formActions(actions) {
  return `<div class="section-actions">${actions.join('')}</div>`;
}

export function filterBar(fieldsHtml, actionsHtml = '') {
  return `
    <div class="filter-bar">
      <div class="filter-fields">${fieldsHtml}</div>
      <div class="filter-actions">${actionsHtml}</div>
    </div>
  `;
}

export function yearSelector(value = '2026') {
  return field('Reporting Year', 'year', value, {
    type: 'select',
    choices: ['All Years', '2023', '2024', '2025', '2026'],
  });
}

export function dateRangeFilter(from = '2026-01-01', to = '2026-12-31') {
  return `
    ${field('Date From', 'from', from, { type: 'date' })}
    ${field('Date To', 'to', to, { type: 'date' })}
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

export function columnVisibilityMenu(columns) {
  return `
    <details class="columns-menu">
      <summary class="button secondary small">Columns</summary>
      <div class="columns-menu-panel">
        ${columns
          .map(
            (column) => `
              <label>
                <input type="checkbox" checked disabled />
                ${escapeHtml(column.label)}
              </label>
            `,
          )
          .join('')}
      </div>
    </details>
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

export function currencyDisplay(value) {
  return `<span class="currency">${escapeHtml(formatCurrency(value))}</span>`;
}

export function percentageDisplay(value) {
  return `<span class="percentage">${escapeHtml(Number(value || 0).toFixed(2))}%</span>`;
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

export function horizontalBarChart(rows) {
  return barChart(rows);
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

export function groupedBarChart(rows, series) {
  if (!rows.length) return '<div class="empty-state">No chart data yet.</div>';
  const max = Math.max(
    ...rows.flatMap((row) => series.map((item) => Number(row[item.key] || 0))),
    1,
  );
  return `
    <div class="grouped-chart">
      ${rows
        .map(
          (row) => `
            <div class="grouped-chart-row">
              <div class="grouped-chart-label">${escapeHtml(row.label)}</div>
              <div class="grouped-chart-bars">
                ${series
                  .map(
                    (item, index) => `
                      <span class="grouped-chart-bar" style="height:${Math.max(10, (Number(row[item.key] || 0) / max) * 150)}px; background: var(--chart-${index + 1});" title="${escapeHtml(item.label)} ${escapeHtml(row[item.key] ?? 0)}"></span>
                    `,
                  )
                  .join('')}
              </div>
            </div>
          `,
        )
        .join('')}
    </div>
    <div class="chart-legend">
      ${series
        .map((item, index) => `<span><i style="background: var(--chart-${index + 1});"></i>${escapeHtml(item.label)}</span>`)
        .join('')}
    </div>
  `;
}

export function lineChart(rows, series) {
  if (!rows.length || rows.every((row) => series.every((item) => !Number(row[item.key] || 0)))) {
    return '<div class="empty-state">No trend data yet.</div>';
  }
  const width = 620;
  const height = 220;
  const pad = 34;
  const max = Math.max(...rows.flatMap((row) => series.map((item) => Number(row[item.key] || 0))), 1);
  const step = rows.length > 1 ? (width - pad * 2) / (rows.length - 1) : 0;
  const y = (value) => height - pad - (Number(value || 0) / max) * (height - pad * 2);
  const x = (index) => pad + index * step;

  return `
    <div class="line-chart-wrap">
      <svg class="line-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Trend chart">
        <line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" />
        <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${height - pad}" />
        ${series
          .map((item, seriesIndex) => {
            const points = rows.map((row, index) => `${x(index)},${y(row[item.key])}`).join(' ');
            return `
              <polyline points="${points}" style="stroke: var(--chart-${(seriesIndex % 6) + 1});" />
              ${rows
                .map(
                  (row, index) =>
                    `<circle cx="${x(index)}" cy="${y(row[item.key])}" r="4" style="fill: var(--chart-${(seriesIndex % 6) + 1});"><title>${escapeHtml(row.label)} ${escapeHtml(item.label)}: ${escapeHtml(row[item.key] ?? 0)}</title></circle>`,
                )
                .join('')}
            `;
          })
          .join('')}
        ${rows.map((row, index) => `<text x="${x(index)}" y="${height - 8}" text-anchor="middle">${escapeHtml(row.label)}</text>`).join('')}
      </svg>
      <div class="chart-legend">
        ${series
          .map((item, index) => `<span><i style="background: var(--chart-${(index % 6) + 1});"></i>${escapeHtml(item.label)}</span>`)
          .join('')}
      </div>
    </div>
  `;
}

export function donutChart(rows) {
  if (!rows.length || rows.every((row) => !row.value)) {
    return '<div class="empty-state">No records yet.</div>';
  }
  const total = rows.reduce((sum, row) => sum + Number(row.value || 0), 0);
  let current = 0;
  const stops = rows
    .map((row, index) => {
      const start = current;
      const amount = (Number(row.value || 0) / total) * 100;
      current += amount;
      return `var(--chart-${(index % 6) + 1}) ${start}% ${current}%`;
    })
    .join(', ');
  return `
    <div class="donut-wrap">
      <div class="donut" style="background: conic-gradient(${stops});">
        <span>${escapeHtml(total)}</span>
      </div>
      <div class="chart-legend">
        ${rows
          .map((row, index) => {
            const pct = total ? (Number(row.value || 0) / total) * 100 : 0;
            return `<span title="${escapeHtml(row.tooltip || '')}"><i style="background: var(--chart-${(index % 6) + 1});"></i>${escapeHtml(row.label)}: ${escapeHtml(row.value)} (${pct.toFixed(1)}%)</span>`;
          })
          .join('')}
      </div>
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

export function signatureLine(label, name = '') {
  return `
    <div class="signature-line">
      <span>${escapeHtml(name)}</span>
      <strong>${escapeHtml(label)}</strong>
    </div>
  `;
}

export function printableHeader(title, subtitle = '') {
  return `
    <header class="printable-header">
      <div class="print-logo">SC</div>
      <div>
        <h1>St. Catherine de Alexandria Savings & Credit Cooperative</h1>
        <p>${escapeHtml(subtitle || 'SACADA Office Copy')}</p>
      </div>
      <strong>${escapeHtml(title)}</strong>
    </header>
  `;
}

export function printableFooter(formCode = 'SACADA Frontend Prototype') {
  return `
    <footer class="printable-footer">
      <span>${escapeHtml(formCode)}</span>
      <span>Page <span class="page-number"></span></span>
    </footer>
  `;
}

export function printLayout(title, pages) {
  return `
    <section class="print-actions">
      ${button('Back', '#/forms-printables', 'secondary')}
      ${button('Print Current Page', '', 'primary', 'data-action="print-page"')}
      ${button('Download PDF Placeholder', '', 'secondary', 'data-action="placeholder-export" data-message="Client-side PDF export can be connected later. Use browser print for now."')}
    </section>
    <div class="print-layout" aria-label="${escapeHtml(title)}">
      ${pages
        .map(
          (page, index) => `
            <article class="a4-page">
              ${printableHeader(title, page.subtitle || '')}
              <div class="print-page-body">${page.body}</div>
              ${printableFooter(page.footer || `Form page ${index + 1}`)}
            </article>
          `,
        )
        .join('')}
    </div>
  `;
}
