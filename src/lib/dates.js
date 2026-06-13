const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function isIsoDate(value) {
  if (!DATE_PATTERN.test(String(value || ''))) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function parseIsoDate(value) {
  return isIsoDate(value) ? new Date(`${value}T00:00:00Z`) : null;
}

export function addMonthsIso(value, months) {
  const date = parseIsoDate(value);
  if (!date) return '';
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + Number(months || 0));
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.toISOString().slice(0, 10);
}

export function elapsedWholeMonths(startValue, endValue = todayIso()) {
  const start = parseIsoDate(startValue);
  const end = parseIsoDate(endValue);
  if (!start || !end || end < start) return 0;
  let months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12;
  months += end.getUTCMonth() - start.getUTCMonth();
  if (end.getUTCDate() < start.getUTCDate()) months -= 1;
  return Math.max(0, months);
}

export function monthsBetween(startValue, endValue) {
  const start = parseIsoDate(startValue);
  const end = parseIsoDate(endValue);
  if (!start || !end || end <= start) return 0;
  const days = Math.ceil((end - start) / 86400000);
  return days / 365.25 * 12;
}
