import { resolveTrafficFallback } from './trafficAttribution';

/** Explicit overrides replace every automatic path; callers aggregate only at campaign level. */
export function resolveManualCampaign(
  sale: { id: string; campaign_id?: string | null; raw_data?: unknown },
  overrides: ReadonlyMap<string, string>,
  fallbackCampaignId: string | null,
): string | null {
  return overrides.get(sale.id) ?? resolveTrafficFallback(sale, fallbackCampaignId);
}