// Single message format for sale alerts, shared by the server push and the in-app fallback.
export interface SaleNotificationPrefs {
  sendPending: string;
  sendApproved: string;
  saleValue: string;
  productName: string;
  utmCampaign: string;
  dashboardName: string;
  customerName: string;
}

export interface SaleNotificationSale {
  status?: string | null;
  amount?: number | string | null;
  commission?: number | string | null;
  product_name?: string | null;
  campaign_id?: string | null;
  platform?: string | null;
  customer_name?: string | null;
}

export function salePrefsFromProfile(profile: Record<string, unknown> | null | undefined): SaleNotificationPrefs {
  const p = (profile ?? {}) as Record<string, string | null | undefined>;
  return {
    sendPending: p.sale_notif_send_pending ?? 'disabled',
    sendApproved: p.sale_notif_send_approved ?? 'enabled',
    saleValue: p.sale_notif_sale_value ?? 'total',
    productName: p.sale_notif_product_name ?? 'hide',
    utmCampaign: p.sale_notif_utm_campaign ?? 'hide',
    dashboardName: p.sale_notif_dashboard_name ?? 'hide',
    customerName: p.sale_notif_customer_name ?? 'show',
  };
}

export function shouldNotifyStatus(status: string | null | undefined, prefs: SaleNotificationPrefs): boolean {
  if (status === 'approved') return prefs.sendApproved === 'enabled';
  if (status === 'pending') return prefs.sendPending === 'enabled';
  return false;
}

export function buildSaleNotification(sale: SaleNotificationSale, prefs: SaleNotificationPrefs) {
  const amount = Number(sale.amount || 0);
  const commission = Number(sale.commission || 0);
  const title = sale.status === 'approved' ? '💰 Venda aprovada!' : '⏳ Venda pendente!';
  const parts: string[] = [];
  if (prefs.saleValue !== 'hide') {
    const value = prefs.saleValue === 'net' ? amount - commission : amount;
    parts.push(`Valor: R$ ${value.toFixed(2)}`);
  }
  if (prefs.customerName === 'show' && sale.customer_name) parts.push(`Cliente: ${sale.customer_name}`);
  if (prefs.productName === 'show' && sale.product_name) parts.push(`Produto: ${sale.product_name}`);
  if (prefs.utmCampaign === 'show' && sale.campaign_id) parts.push(`Campanha: ${sale.campaign_id}`);
  if (prefs.dashboardName === 'show' && sale.platform) parts.push(`Dashboard: ${sale.platform}`);
  return { title, body: parts.length > 0 ? parts.join(' • ') : 'Venda recebida!' };
}
