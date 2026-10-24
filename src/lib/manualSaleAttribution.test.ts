import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveManualCampaign } from './manualSaleAttribution';

describe('Per-sale campaign assignment', () => {
  const selected = '120258473371340779';
  const original = '120258453980860779';
  it('explicit assignment replaces original campaign UTMs and campaign ID', () => {
    const sale = { id: 'sale-1', campaign_id: original, raw_data: { tracking: { utm_campaign: `Original|${original}`, utm_content: 'Ad|120258453980860780' } } };
    const before = JSON.stringify(sale);
    assert.equal(resolveManualCampaign(sale, new Map([[sale.id, selected]]), null), selected);
    assert.equal(JSON.stringify(sale), before);
  });
  it('explicit assignment replaces traffic fallback rather than adding another sale', () => {
    assert.equal(resolveManualCampaign({ id: 'sale-1' }, new Map([['sale-1', original]]), selected), original);
  });
  it('does not move other sales', () => {
    assert.equal(resolveManualCampaign({ id: 'sale-2', campaign_id: original }, new Map([['sale-1', selected]]), selected), null);
  });
  it('removing an override restores the original automatic path', () => {
    assert.equal(resolveManualCampaign({ id: 'sale-1', campaign_id: original }, new Map(), selected), null);
    assert.equal(resolveManualCampaign({ id: 'sale-2' }, new Map(), selected), selected);
  });
});