/**
 * Formats a number as Brazilian reais with the thousands dot and the decimal comma.
 * 10000 -> "R$ 10.000,00", 1030000 -> "R$ 1.030.000,00", 27.9 -> "R$ 27,90"
 *
 * Built by hand instead of toLocaleString so the output is identical in every
 * runtime (browser, Bun, Node without full ICU) and stays testable.
 */
export function formatBRL(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'N/A';

  const rounded = Math.abs(value).toFixed(2);
  const negative = value < 0 && Number(rounded) > 0;
  const [int, dec] = rounded.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${negative ? '-' : ''}R$ ${grouped},${dec}`;
}

/**
 * Same grouping, rounded to whole reais: 10000 -> "R$ 10.000".
 * Used where decimals would only crowd the space (chart axis labels).
 */
export function formatBRLShort(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'N/A';

  const rounded = Math.abs(value).toFixed(0);
  const negative = value < 0 && Number(rounded) > 0;
  const grouped = rounded.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${negative ? '-' : ''}R$ ${grouped}`;
}

