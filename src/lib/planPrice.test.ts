import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatPlanPrice } from './planPrice';

describe('Plan price display', () => {
  it('shows the Premium price as 27,90', () => {
    assert.equal(formatPlanPrice(27.9), '27,90');
  });

  it('keeps whole prices without decimals', () => {
    assert.equal(formatPlanPrice(67), '67');
    assert.equal(formatPlanPrice(0), '0');
  });
});
