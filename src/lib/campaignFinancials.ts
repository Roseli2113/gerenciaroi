interface FinancialAttribution {
  sales: number;
  revenue: number;
  refundedSales: number;
  declinedSales: number;
}

/** Pixel purchases are never a substitute for attributed customer sales. */
export function campaignFinancials(spent: number, attribution: FinancialAttribution) {
  const { sales, revenue, refundedSales, declinedSales } = attribution;
  return {
    sales,
    revenue,
    profit: revenue - spent,
    cpa: sales > 0 ? spent / sales : null,
    roi: spent > 0 ? revenue / spent : null,
    roas: spent > 0 ? revenue / spent : null,
    margin: revenue > 0 ? ((revenue - spent) / revenue) * 100 : null,
    refundedSales,
    declinedSales,
  };
}