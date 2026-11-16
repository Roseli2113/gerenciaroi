import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { feeInputValue, normalizeFeeInput } from './feeInput';

describe('Platform fee input display', () => {
  it('shows two decimals for a value saved as 0.5', () => {
    assert.equal(feeInputValue(0.5), '0.50');
  });

  it('keeps whole amounts at two decimals', () => {
    assert.equal(feeInputValue(10), '10.00');
    assert.equal(feeInputValue(0), '0.00');
  });

  it('does not lose cents', () => {
    assert.equal(feeInputValue(27.9), '27.90');
    assert.equal(feeInputValue('0.07'), '0.07');
  });

  it('falls back to 0.00 when the stored value is unusable', () => {
    assert.equal(feeInputValue(null), '0.00');
    assert.equal(feeInputValue(undefined), '0.00');
    assert.equal(feeInputValue('abc'), '0.00');
  });

  it('pads a typed 0,5 to 0.50', () => {
    assert.equal(normalizeFeeInput('0,5'), '0.50');
  });

  it('pads a typed 0.5 to 0.50', () => {
    assert.equal(normalizeFeeInput('0.5'), '0.50');
  });

  it('keeps a value that already has cents', () => {
    assert.equal(normalizeFeeInput('0.50'), '0.50');
    assert.equal(normalizeFeeInput('27.90'), '27.90');
  });

  it('resets empty, negative or invalid entries to 0.00', () => {
    assert.equal(normalizeFeeInput(''), '0.00');
    assert.equal(normalizeFeeInput('  '), '0.00');
    assert.equal(normalizeFeeInput('-3'), '0.00');
    assert.equal(normalizeFeeInput('abc'), '0.00');
  });
});
