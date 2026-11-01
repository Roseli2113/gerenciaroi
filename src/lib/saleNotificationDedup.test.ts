import { describe, it as test } from 'node:test';
import assert from 'node:assert/strict';
import { claimSaleNotification } from './saleNotificationDedup';

describe('one notification per sale', () => {
  const storage = () => {
    const values = new Map<string, string>();
    return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
  };
  test('realtime, push and remounted listeners claim the same sale only once', () => {
    const store = storage();
    assert.equal([1, 2, 3].filter(() => claimSaleNotification(store, 'owner', 'sale-1')).length, 1);
  });
  test('different sales each get one notification', () => {
    const store = storage();
    assert.equal(claimSaleNotification(store, 'owner', 'sale-1'), true);
    assert.equal(claimSaleNotification(store, 'owner', 'sale-2'), true);
  });
  test('notification claims are scoped to the owner', () => {
    const store = storage();
    assert.equal(claimSaleNotification(store, 'owner-1', 'sale-1'), true);
    assert.equal(claimSaleNotification(store, 'owner-2', 'sale-1'), true);
  });
});