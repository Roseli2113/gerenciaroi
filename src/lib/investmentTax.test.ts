import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { investmentCosts, withInvestmentTax } from './investmentTax';
import { campaignFinancials } from './campaignFinancials';

describe('Facebook investment tax', () => {
  it('adds 12% on top of investment: 10,000 becomes 11,200', () => {
    assert.deepEqual(investmentCosts(10000), { investment: 10000, tax: 1200, total: 11200 });
  });
  it('does not charge tax without investment', () => {
    assert.deepEqual(investmentCosts(0), { investment: 0, tax: 0, total: 0 });
  });
  it('calculates financial results using tax-inclusive expenses', () => {
    const row = withInvestmentTax({ spent: 100, revenue: 224, sales: 2, clicks: 10, impressions: 1000, pageViews: 4, initiatedCheckout: 2, budget: 1000 });
    const result = campaignFinancials(row.spent, { sales: 2, revenue: 224, refundedSales: 0, declinedSales: 0 });
    assert.equal(row.spent, 112);
    assert.equal(result.profit, 112);
    assert.equal(result.cpa, 56);
    assert.equal(result.roi, 2);
    assert.equal(row.budget, 1000);
  });
  it('projects fresh and cached raw rows identically without mutating or accumulating tax', () => {
    const raw = { spent: 100, revenue: 224, sales: 2, clicks: 10, impressions: 1000, pageViews: 4, initiatedCheckout: 2 };
    assert.equal(withInvestmentTax(raw).spent, 112);
    assert.equal(withInvestmentTax(JSON.parse(JSON.stringify(raw))).spent, 112);
    assert.equal(raw.spent, 100);
  });
  it('sums tax-inclusive rows without taxing parent totals again', () => {
    const total = [100, 200].reduce((sum, amount) => sum + investmentCosts(amount).total, 0);
    assert.equal(total, 336);
    assert.equal(total, investmentCosts(300).total);
  });
});