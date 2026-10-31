import { describe, expect, test } from 'bun:test';
import { claimSaleNotification } from './saleNotificationDedup';

describe('one notification per sale', () => {
  const storage = () => {
    const values = new Map<string, string>();
    return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
  };
  test('realtime, push and remounted listeners claim the same sale only once', () => {
    const store = storage();
    expect([1, 2, 3].filter(() => claimSaleNotification(store, 'owner', 'sale-1'))).toHaveLength(1);
  });
  test('different sales each get one notification', () => {
    const store = storage();
    expect(claimSaleNotification(store, 'owner', 'sale-1')).toBe(true);
    expect(claimSaleNotification(store, 'owner', 'sale-2')).toBe(true);
  });
  test('notification claims are scoped to the owner', () => {
    const store = storage();
    expect(claimSaleNotification(store, 'owner-1', 'sale-1')).toBe(true);
    expect(claimSaleNotification(store, 'owner-2', 'sale-1')).toBe(true);
  });
});