export const PLAN_PRICES: Record<string, number> = { starter: 27.9, profissional: 67, enterprise: 147 };

const DAY = 24 * 60 * 60 * 1000;

function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  const day = r.getDate();
  r.setMonth(r.getMonth() + n);
  if (r.getDate() !== day) r.setDate(0);
  return r;
}

/** Next due date: admin-set date wins; otherwise monthly anniversary of the last payment (or signup) after `now`. */
export function nextDueDate(opts: { nextDueAt?: string | null; lastPaidAt?: string | null; createdAt: string; now?: Date }): Date {
  if (opts.nextDueAt) return new Date(opts.nextDueAt);
  const now = opts.now ?? new Date();
  const anchor = new Date(opts.lastPaidAt || opts.createdAt);
  let n = 1;
  let next = addMonths(anchor, n);
  while (next <= now) next = addMonths(anchor, ++n);
  return next;
}

/** Whole days until `due` (negative = overdue), comparing calendar days. */
export function daysUntil(due: Date, now: Date = new Date()): number {
  const a = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
  const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((a - b) / DAY);
}

/** Price the user pays: admin custom price overrides the plan price, regardless of plan. */
export function effectivePrice(plan: string | null | undefined, customPrice: number | null | undefined): number | null {
  if (customPrice !== null && customPrice !== undefined) return Number(customPrice);
  return plan && PLAN_PRICES[plan] !== undefined ? PLAN_PRICES[plan] : null;
}
