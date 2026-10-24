import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveTrafficFallback } from './trafficAttribution';

const trafficCampaign = '120258473371340779';

describe('Traffic campaign fallback for old and future sales', () => {
  it('assigns old and future sales without UTMs to the requested campaign', () => {
    for (const created_at of ['2026-09-01', '2026-10-25']) {
      const sale = { created_at, raw_data: null };
      assert.equal(resolveTrafficFallback(sale, trafficCampaign), trafficCampaign);
    }
  });
  it('assigns facebook / paid-social with no campaign or ad UTM', () => {
    assert.equal(resolveTrafficFallback({ raw_data: { tracking: { utm_source: 'facebook', utm_medium: 'paid-social', utm_campaign: '-', utm_content: '-' } } }, trafficCampaign), trafficCampaign);
  });
  it('preserves campaign UTMs even if the Meta ID is missing', () => {
    assert.equal(resolveTrafficFallback({ raw_data: { tracking: { utm_campaign: 'Other campaign' } } }, trafficCampaign), null);
  });
  it('preserves an existing campaign ID', () => {
    assert.equal(resolveTrafficFallback({ campaign_id: '120258453980860779' }, trafficCampaign), null);
  });
  it('preserves nested campaign and ad identifiers', () => {
    for (const tracking of [{ utm_campaign: 'Other|120258453980860779' }, { utm_content: 'Ad|120258453980860780' }, { utm_medium: 'Set|120258453980860781' }]) {
      assert.equal(resolveTrafficFallback({ raw_data: { metadata: { utm_params: tracking } } }, trafficCampaign), null);
    }
  });
  it('does not apply to accounts without a configured fallback', () => {
    assert.equal(resolveTrafficFallback({ raw_data: {} }, null), null);
  });
  it('never fabricates UTMs or edits the original sale', () => {
    const sale = { raw_data: { tracking: { utm_source: 'facebook' } } };
    const before = JSON.stringify(sale);
    resolveTrafficFallback(sale, trafficCampaign);
    assert.equal(JSON.stringify(sale), before);
  });
});