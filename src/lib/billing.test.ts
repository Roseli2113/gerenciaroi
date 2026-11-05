import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextDueDate, daysUntil, effectivePrice } from './billing';

test('Monster user with custom price 27.90 pays 27.90', () => {
  assert.equal(effectivePrice('enterprise', 27.9), 27.9);
});
test('without custom price, Monster pays 147', () => {
  assert.equal(effectivePrice('enterprise', null), 147);
});
test('admin-set due date wins', () => {
  assert.equal(nextDueDate({ nextDueAt: '2026-12-01T12:00:00Z', createdAt: '2026-01-01T12:00:00Z' }).toISOString(), '2026-12-01T12:00:00.000Z');
});
test('due date is one month after last payment', () => {
  const d = nextDueDate({ lastPaidAt: '2026-11-01T12:00:00', createdAt: '2026-01-15T12:00:00', now: new Date('2026-11-05T12:00:00') });
  assert.equal(daysUntil(d, new Date('2026-11-05T12:00:00')), 26);
});
test('overdue gives negative days', () => {
  assert.equal(daysUntil(new Date('2026-11-03T12:00:00'), new Date('2026-11-05T12:00:00')), -2);
});
import { paymentStatus } from './billing';
test('paid and not yet due is Pago', () => { assert.equal(paymentStatus('2026-11-01T00:00:00Z', 26), 'pago'); });
test('overdue is Pendente', () => { assert.equal(paymentStatus('2026-10-01T00:00:00Z', -2), 'pendente'); });
test('no payment received is Pendente', () => { assert.equal(paymentStatus(null, 10), 'pendente'); });
