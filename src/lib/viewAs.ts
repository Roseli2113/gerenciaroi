import { supabase } from '@/integrations/supabase/client';

/** Admin "view as user" mode: the admin stays signed in, the app shows the target's data read-only. */
const KEY = 'admin-view-as:v1';
export type ViewAs = { userId: string; email: string | null; name: string | null };

export function getViewAs(): ViewAs | null {
  try { const raw = sessionStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
export function startViewAs(v: ViewAs) { sessionStorage.setItem(KEY, JSON.stringify(v)); window.location.href = '/'; }
export function stopViewAs() { sessionStorage.removeItem(KEY); window.location.href = '/admin'; }

export const VIEW_ONLY_MESSAGE = 'Modo visualização: não é possível alterar dados do usuário.';
const READ_ONLY_FUNCTIONS = new Set(['meta-ads', 'admin-user-panel']);

/** Allowed in view mode: only Facebook read actions ("get-*"). */
export function isAllowedInViewMode(fn: string, body: unknown): boolean {
  if (!READ_ONLY_FUNCTIONS.has(fn)) return false;
  if (fn === 'admin-user-panel') return true;
  const action = (body as { action?: unknown } | null)?.action;
  return typeof action === 'string' && action.startsWith('get-');
}

function blocked(): any {
  const result = { data: null, error: { message: VIEW_ONLY_MESSAGE }, count: null, status: 403, statusText: 'Forbidden' };
  const proxy: any = new Proxy(function () {}, {
    get: (_t, prop) => prop === 'then' ? (res: any, rej: any) => Promise.resolve(result).then(res, rej) : () => proxy,
    apply: () => proxy,
  });
  return proxy;
}

let installed = false;
/** Blocks every write while viewing as a user, so maintenance views never change their data. */
export function installViewAsGuard() {
  if (installed || !getViewAs()) return;
  installed = true;
  const sb: any = supabase;
  const origFrom = sb.from.bind(sb);
  sb.from = (table: string) => {
    const qb = origFrom(table);
    for (const m of ['insert', 'update', 'upsert', 'delete']) qb[m] = () => blocked();
    return qb;
  };
  sb.rpc = () => blocked();
  const origInvoke = sb.functions.invoke.bind(sb.functions);
  sb.functions.invoke = (fn: string, opts?: { body?: unknown }) =>
    isAllowedInViewMode(fn, opts?.body) ? origInvoke(fn, opts) : Promise.resolve({ data: null, error: new Error(VIEW_ONLY_MESSAGE) });
}
