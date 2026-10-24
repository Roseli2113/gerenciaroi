const missingValues = new Set(['', '-', 'null', 'undefined', 'organic', 'organico', 'orgânico', '(not set)']);

function meaningful(value: unknown): boolean {
  if (typeof value !== 'string' && typeof value !== 'number') return false;
  return !missingValues.has(String(value).trim().toLowerCase());
}

/** Source/medium labels alone do not identify a campaign or an ad. */
export function hasCampaignTracking(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false;
  const stack: unknown[] = [raw];
  const seen = new Set<object>();
  while (stack.length) {
    const current = stack.pop();
    if (!current || typeof current !== 'object' || seen.has(current)) continue;
    seen.add(current);
    for (const [key, value] of Object.entries(current)) {
      if (['utm_campaign', 'utm_content', 'campaign_id', 'adset_id', 'ad_id'].includes(key) && meaningful(value)) return true;
      if (key === 'utm_medium' && meaningful(value) && typeof value === 'string' && /\|\s*\d{9,25}\s*$/.test(value)) return true;
      if (value && typeof value === 'object') stack.push(value);
    }
  }
  return false;
}

export function resolveTrafficFallback(
  sale: { campaign_id?: string | null; raw_data?: unknown },
  campaignId: string | null,
): string | null {
  if (!campaignId || meaningful(sale.campaign_id) || hasCampaignTracking(sale.raw_data)) return null;
  return campaignId;
}