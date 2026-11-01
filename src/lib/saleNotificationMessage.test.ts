import { describe, it as test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSaleNotification, salePrefsFromProfile } from '../../supabase/functions/_shared/saleNotificationMessage';

const sale = { status: 'approved', amount: 5, customer_name: 'José Silva' };

describe('sale alert customer name', () => {
  test('hiding the customer name removes it from the alert', () => {
    const prefs = salePrefsFromProfile({ sale_notif_customer_name: 'hide' });
    const { body } = buildSaleNotification(sale, prefs);
    assert.equal(body, 'Valor: R$ 5.00');
  });

  test('showing the customer name includes it in the alert', () => {
    const prefs = salePrefsFromProfile({ sale_notif_customer_name: 'show' });
    assert.equal(buildSaleNotification(sale, prefs).body, 'Valor: R$ 5.00 • Cliente: José Silva');
  });

  test('a hidden name never leaks as the fallback text', () => {
    const prefs = salePrefsFromProfile({ sale_notif_customer_name: 'hide', sale_notif_sale_value: 'hide' });
    assert.equal(buildSaleNotification(sale, prefs).body, 'Venda recebida!');
  });
});
