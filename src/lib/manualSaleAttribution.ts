import { resolveTrafficFallback } from './trafficAttribution';

/** Explicit overrides replace every automatic path. */
export function resolveManualCampaign(
  sale: { id: string; campaign_id?: string | null; raw_data?: unknown },
  overrides: ReadonlyMap<string, string>,
  fallbackCampaignId: string | null,
): string | null {
  return overrides.get(sale.id) ?? resolveTrafficFallback(sale, fallbackCampaignId);
}

export interface ManualHierarchy {
  campaign_id: string;
  adset_id?: string | null;
  ad_id?: string | null;
}

export function manualTargets(assignment: ManualHierarchy) {
  return { campaignId: assignment.campaign_id, adSetId: assignment.adset_id ?? null,
    adId: assignment.adset_id ? assignment.ad_id ?? null : null };
}

export function assignmentChildren(
  campaignId: string, adSetId: string,
  adSets: { id: string; campaignId: string | null }[],
  ads: { id: string; adsetId: string | null }[],
) {
  const sets = adSets.filter(s => s.campaignId === campaignId);
  return { adSets: sets, ads: sets.some(s => s.id === adSetId) ? ads.filter(a => a.adsetId === adSetId) : [] };
}