export function formatCurrency(
  amount: number,
  currency = 'GBP',
  locale = 'en-GB'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatPence(pence: number, currency = 'GBP', locale = 'en-GB'): string {
  return formatCurrency(pence / 100, currency, locale);
}
