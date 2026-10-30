interface FinancialAttribution {
  sales: number;
  revenue: number;
  refundedSales: number;
  declinedSales: number;
}

/** Revenue per real amount spent, the same ratio the Campaigns column shows. */
export function roiRatio(revenue: number, spent: number): number | null {
  return spent > 0 ? revenue / spent : null;
}

/** Pixel purchases are never a substitute for attributed customer sales. */
export function campaignFinancials(spent: number, attribution: FinancialAttribution) {
  const { sales, revenue, refundedSales, declinedSales } = attribution;
  const roi = roiRatio(revenue, spent);
  return {
    sales,
    revenue,
    profit: revenue - spent,
    cpa: sales > 0 ? spent / sales : null,
    roi,
    roas: roi,
    margin: revenue > 0 ? ((revenue - spent) / revenue) * 100 : null,
    refundedSales,
    declinedSales,
  };
}