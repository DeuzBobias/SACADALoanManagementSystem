export const MONEY_SCALE = 2;

export function toFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function roundMoney(value) {
  return Math.round((toFiniteNumber(value) + Number.EPSILON) * 100) / 100;
}

export function nonNegativeMoney(value, field = 'amount') {
  const amount = roundMoney(value);
  if (amount < 0) throw new Error(`${field} cannot be negative.`);
  return amount;
}

export function sumMoney(rows, key) {
  return roundMoney(rows.reduce((total, row) => total + toFiniteNumber(row?.[key]), 0));
}

export function allocateMoney(total, count) {
  const amount = nonNegativeMoney(total);
  const parts = Math.max(0, Math.trunc(toFiniteNumber(count)));
  if (!parts) return [];
  const base = Math.floor((amount * 100) / parts);
  let remainder = Math.round(amount * 100) - base * parts;
  return Array.from({ length: parts }, () => {
    const cents = base + (remainder-- > 0 ? 1 : 0);
    return cents / 100;
  });
}
