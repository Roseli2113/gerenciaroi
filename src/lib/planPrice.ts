// Single source of truth for how plan prices are shown in the UI (pt-BR).
// Integer prices stay clean ("67"), prices with cents show two decimals ("27,90").
export function formatPlanPrice(price: number): string {
  if (!Number.isFinite(price)) return '0';
  return Number.isInteger(price) ? String(price) : price.toFixed(2).replace('.', ',');
}
