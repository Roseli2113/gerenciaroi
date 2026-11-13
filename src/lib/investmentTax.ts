export const INVESTMENT_TAX_RATE = 0.12;

export function investmentCosts(investment: number) {
  const tax = investment * INVESTMENT_TAX_RATE;
  return { investment, tax, total: investment + tax };
}

interface SpendMetrics {
  spent: number;
  revenue: number;
  sales: number;
  clicks: number;
  impressions: number;
  pageViews: number;
  initiatedCheckout: number;
}

/** Apply only to raw Meta rows; never persist this projection in the Meta cache. */
export function withInvestmentTax<T extends SpendMetrics>(row: T) {
  const { total: spent } = investmentCosts(row.spent);
  const roi = spent > 0 ? row.revenue / spent : null;
  return {
    ...row,
    spent,
    profit: row.revenue - spent,
    cpa: row.sales > 0 ? spent / row.sales : null,
    roi,
    roas: roi,
    margin: row.revenue > 0 ? ((row.revenue - spent) / row.revenue) * 100 : null,
    cpc: row.clicks > 0 ? spent / row.clicks : null,
    cpm: row.impressions > 0 ? spent / row.impressions * 1000 : null,
    cpv: row.pageViews > 0 ? spent / row.pageViews : null,
    costPerInitiatedCheckout: row.initiatedCheckout > 0 ? spent / row.initiatedCheckout : null,
  };
}