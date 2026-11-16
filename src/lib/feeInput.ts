// Platform fee values are stored as numbers (0.5) but must always be shown with
// two decimals (0.50) so the saved value looks exactly like what was typed.

/** Format a stored fee for display in the fee inputs. */
export function feeInputValue(value: number | string | null | undefined): string {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? '').replace(',', '.'));
  if (!Number.isFinite(n)) return '0.00';
  return n.toFixed(2);
}

/** Normalize what the user typed (or a pasted comma value) into a 2-decimal string. */
export function normalizeFeeInput(raw: string): string {
  const trimmed = (raw || '').trim();
  if (trimmed === '') return '0.00';
  const n = parseFloat(trimmed.replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) return '0.00';
  return n.toFixed(2);
}
