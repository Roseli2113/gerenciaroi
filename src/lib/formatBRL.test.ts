import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatBRL, formatBRLShort } from './formatBRL.ts';

test('adds the thousands dot to the budget column', () => {
  assert.equal(formatBRL(10000), 'R$ 10.000,00');
  assert.equal(formatBRL(1000000), 'R$ 1.000.000,00');
  assert.equal(formatBRL(1030000), 'R$ 1.030.000,00');
});

test('keeps two decimals with a comma under one thousand', () => {
  assert.equal(formatBRL(0), 'R$ 0,00');
  assert.equal(formatBRL(27.9), 'R$ 27,90');
  assert.equal(formatBRL(147), 'R$ 147,00');
  assert.equal(formatBRL(999.999), 'R$ 1.000,00');
});

test('groups every thousand block', () => {
  assert.equal(formatBRL(1234567.89), 'R$ 1.234.567,89');
  assert.equal(formatBRL(-1234.5), '-R$ 1.234,50');
  assert.equal(formatBRL(-0.001), 'R$ 0,00');
});

test('shows N/A when there is no value', () => {
  assert.equal(formatBRL(null), 'N/A');
  assert.equal(formatBRL(undefined), 'N/A');
  assert.equal(formatBRL(NaN), 'N/A');
});

test('chart axis labels group thousands without decimals', () => {
  assert.equal(formatBRLShort(10000), 'R$ 10.000');
  assert.equal(formatBRLShort(1030000), 'R$ 1.030.000');
  assert.equal(formatBRLShort(27.9), 'R$ 28');
  assert.equal(formatBRLShort(null), 'N/A');
});
