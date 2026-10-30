import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { campaignFinancials, roiRatio } from './campaignFinancials';

const empty = { sales: 0, revenue: 0, refundedSales: 0, declinedSales: 0 };

describe('Campaign sales must come from actual attribution', () => {
  it('removes the six false purchases from the pre-scale campaign', () => {
    const meta = { sales: 6, revenue: 40, spent: 16.90 };
    const result = { ...meta, ...campaignFinancials(meta.spent, empty) };
    assert.equal(result.sales, 0);
    assert.equal(result.revenue, 0);
    assert.equal(result.profit, -16.90);
    assert.equal(result.cpa, null);
    assert.equal(result.roi, 0);
  });
  it('removes the two false purchases from the creative-test campaign', () => {
    const meta = { sales: 2, revenue: 10, spent: 9.93 };
    const result = { ...meta, ...campaignFinancials(meta.spent, empty) };
    assert.equal(result.sales, 0);
    assert.equal(result.revenue, 0);
    assert.equal(result.profit, -9.93);
  });
  it('retains real sales and manual traffic attribution instead of Meta totals', () => {
    const result = campaignFinancials(1, { ...empty, sales: 9, revenue: 68.99 });
    assert.equal(result.sales, 9);
    assert.equal(result.revenue, 68.99);
    assert.equal(result.profit, 67.99);
  });
});

describe('ROI is a ratio everywhere, never a percentage', () => {
  it('shows 1.85 on the dashboard card, like the Campaigns column', () => {
    const roi = roiRatio(185, 100);
    assert.equal(roi, 1.85);
    assert.equal(roi?.toFixed(2), '1.85');
  });
  it('matches the campaign table for the same revenue and spend', () => {
    const table = campaignFinancials(100, { ...empty, sales: 3, revenue: 185.70 });
    assert.equal(roiRatio(185.70, 100), table.roi);
  });
  it('has no ROI while nothing has been spent', () => {
    assert.equal(roiRatio(120, 0), null);
  });
});