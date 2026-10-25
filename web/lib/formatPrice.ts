/** Formats a course/product price with its currency (IQD has no decimals). */
export function formatPrice(price: number | undefined | null, currency: string = 'USD'): string {
  const value = Number(price ?? 0);
  const cur = (currency || 'USD').toUpperCase();
  if (cur === 'IQD') return `${Math.round(value).toLocaleString('en-US')} IQD`;
  const symbol: Record<string, string> = { USD: '$', EUR: '€', TRY: '₺' };
  return `${symbol[cur] ?? cur + ' '}${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
