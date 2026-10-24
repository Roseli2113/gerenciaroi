import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveManualCampaign, manualTargets, assignmentChildren } from './manualSaleAttribution';

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
  it('attributes to only the explicitly chosen hierarchy levels', () => {
    assert.deepEqual(manualTargets({ campaign_id: selected }), { campaignId: selected, adSetId: null, adId: null });
    assert.deepEqual(manualTargets({ campaign_id: selected, adset_id: '120258453980860781', ad_id: '120258453980860780' }),
      { campaignId: selected, adSetId: '120258453980860781', adId: '120258453980860780' });
  });
  it('filters sets by campaign and ads by the selected set', () => {
    const sets = [{ id: 'set-1', campaignId: selected }, { id: 'set-2', campaignId: original }];
    const ads = [{ id: 'ad-1', adsetId: 'set-1' }, { id: 'ad-2', adsetId: 'set-2' }];
    assert.deepEqual(assignmentChildren(selected, 'set-1', sets, ads), { adSets: [sets[0]], ads: [ads[0]] });
    assert.deepEqual(assignmentChildren(selected, 'set-2', sets, ads).ads, []);
  });
});