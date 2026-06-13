export function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

export function formatNumber(value) {
  return new Intl.NumberFormat('en-PH').format(toNumber(value));
}

export function formatDate(value) {
  if (!value) return 'N/A';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);
}

export function addMonths(dateValue, monthOffset) {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  const day = date.getDate();
  date.setMonth(date.getMonth() + monthOffset);
  if (date.getDate() !== day) {
    date.setDate(0);
  }
  return date.toISOString().slice(0, 10);
}

export function calculateLoan(input = {}) {
  const loanAmount = toNumber(input.loanAmount);
  const termMonths = Math.max(1, toNumber(input.termMonths, 12));
  const interestRate = toNumber(input.interestRate ?? input.annualInterestRate, 12) / 100;
  const collectionFeeRate = toNumber(input.collectionFeeRate, 2) / 100;
  const processingFeeRate = toNumber(input.processingFeeRate, 1) / 100;
  const previousLoanBalance = toNumber(input.previousLoanBalance);
  const existingCapitalShare = toNumber(input.existingCapitalShare);
  const additionalCapitalShare = toNumber(input.additionalCapitalShare);
  const savingsDeposit = toNumber(input.savingsDeposit);
  const timeDeposit = toNumber(input.timeDeposit);
  const interestAmount = loanAmount * interestRate;
  const collectionFee = loanAmount * collectionFeeRate;
  const totalInterest = interestAmount + collectionFee;
  const totalPayable = loanAmount + interestAmount + collectionFee;
  const monthlyAmortization = totalPayable / termMonths;
  const processingFee = loanAmount * processingFeeRate;
  const netTakeHome =
    loanAmount - processingFee - previousLoanBalance - additionalCapitalShare;
  const principalPortion = loanAmount / termMonths;
  const interestPortion = totalInterest / termMonths;

  return {
    loanAmount,
    termMonths,
    annualInterestRate: interestRate,
    interestRate,
    collectionFeeRate,
    processingFeeRate,
    previousLoanBalance,
    existingCapitalShare,
    additionalCapitalShare,
    savingsDeposit,
    timeDeposit,
    totalInterest,
    interestAmount,
    collectionFee,
    totalPayable,
    monthlyAmortization,
    processingFee,
    netTakeHome,
    endingLoanBalance: totalPayable,
    principalPortion,
    interestPortion,
    loanReceivable: totalPayable,
  };
}

export function buildAmortizationSchedule(input = {}, paymentStatuses = []) {
  const computed = calculateLoan(input);
  let remaining = computed.totalPayable;
  const firstDueDate = input.firstDueDate || input.releaseDate || new Date().toISOString().slice(0, 10);

  return Array.from({ length: computed.termMonths }, (_, index) => {
    remaining = Math.max(0, remaining - computed.monthlyAmortization);
    return {
      month: index + 1,
      dueDate: addMonths(firstDueDate, index),
      totalPayable: computed.totalPayable,
      monthlyAmortization: computed.monthlyAmortization,
      principalPortion: computed.principalPortion,
      interestPortion: computed.interestPortion,
      endingBalance: remaining,
      status: paymentStatuses[index] || (index === 0 ? 'Pending' : 'Not Due'),
    };
  });
}
