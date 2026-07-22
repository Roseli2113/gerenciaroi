import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformFees, normalizePlatform } from '@/hooks/usePlatformFees';

interface TrackingData {
  utm_source?: string;
  utm_campaign?: string;
  utm_medium?: string;
  utm_content?: string;
  utm_term?: string;
  campaign_id?: string | number;
  [key: string]: unknown;
}

interface RawData {
  tracking?: TrackingData;
  utm_source?: string;
  utm_campaign?: string;
  utm_medium?: string;
  utm_content?: string;
  [key: string]: unknown;
}

export interface AttributionMetrics {
  sales: number;
  revenue: number;
  refundedSales: number;
  declinedSales: number;
}

export interface SalesAttribution {
  byCampaignId: Map<string, AttributionMetrics>;
  byAdSetId: Map<string, AttributionMetrics>;
  byAdId: Map<string, AttributionMetrics>;
  byCampaignName: Map<string, AttributionMetrics>;
  byAdSetName: Map<string, AttributionMetrics>;
  byAdName: Map<string, AttributionMetrics>;
}

const emptyMetrics = (): AttributionMetrics => ({
  sales: 0,
  revenue: 0,
  refundedSales: 0,
  declinedSales: 0,
});

/**
 * Extracts the ID from a UTM value in the format "Name|ID".
 * Returns null if the value doesn't contain a pipe separator or is empty.
 */
function extractIdFromUtm(utmValue: string | null | undefined): string | null {
  if (!utmValue) return null;
  const parts = utmValue.split('|');
  if (parts.length >= 2) {
    const id = parts[parts.length - 1].trim();
    return id || null;
  }
  return null;
}

export function normalizeAttributionName(value: string | null | undefined): string | null {
  if (!value) return null;

  const rawName = value.split('|')[0]?.replace(/\+/g, ' ').trim();
  if (!rawName) return null;

  try {
    return decodeURIComponent(rawName).trim().replace(/\s+/g, ' ').toLowerCase() || null;
  } catch {
    return rawName.trim().replace(/\s+/g, ' ').toLowerCase() || null;
  }
}

function getTracking(raw: RawData): TrackingData {
  // Check nested tracking object first, then top-level
  if (raw.tracking && typeof raw.tracking === 'object') {
    return raw.tracking;
  }
  return raw;
}

export function useSalesAttribution(startDate?: Date, endDate?: Date) {
  const { user } = useAuth();
  const { feeMap } = usePlatformFees();
  const [attribution, setAttribution] = useState<SalesAttribution>({
    byCampaignId: new Map(),
    byAdSetId: new Map(),
    byAdId: new Map(),
    byCampaignName: new Map(),
    byAdSetName: new Map(),
    byAdName: new Map(),
  });
  const [loading, setLoading] = useState(false);

  const fetchAttribution = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const fromDate = startDate || new Date();
      if (!startDate) {
        fromDate.setHours(0, 0, 0, 0);
      }

      let query = supabase
        .from('sales')
        .select('amount, status, raw_data, campaign_id, platform')
        .eq('user_id', user.id)
        .gte('created_at', fromDate.toISOString());

      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data: sales, error } = await query;

      if (error) throw error;

      const byCampaignId = new Map<string, AttributionMetrics>();
      const byAdSetId = new Map<string, AttributionMetrics>();
      const byAdId = new Map<string, AttributionMetrics>();
      const byCampaignName = new Map<string, AttributionMetrics>();
      const byAdSetName = new Map<string, AttributionMetrics>();
      const byAdName = new Map<string, AttributionMetrics>();

      for (const sale of sales || []) {
        const raw = sale.raw_data as RawData | null;
        if (!raw) continue;

        const tracking = getTracking(raw);
        let campaignId = extractIdFromUtm(tracking.utm_campaign);
        const adSetId = extractIdFromUtm(tracking.utm_medium);
        const adId = extractIdFromUtm(tracking.utm_content);
        const campaignName = normalizeAttributionName(tracking.utm_campaign);
        const adSetName = normalizeAttributionName(tracking.utm_medium);
        const adName = normalizeAttributionName(tracking.utm_content);

        // Fallback: try tracking.campaign_id if it looks like a Meta ID (10+ digits)
        if (!campaignId && tracking.campaign_id) {
          const cid = String(tracking.campaign_id);
          if (cid.length > 8) campaignId = cid;
        }

        // Also try the campaign_id column directly from the sale record
        if (!campaignId && (sale as Record<string, unknown>).campaign_id) {
          campaignId = String((sale as Record<string, unknown>).campaign_id);
        }

        const rawAmount = Number(sale.amount) || 0;
        const platformKey = normalizePlatform((sale as Record<string, unknown>).platform as string | null);
        const fees = feeMap.get(platformKey);
        const productInfo = ((raw as { product?: { type?: string; price?: number } })?.product) || {};
        const productType = String(productInfo.type || '').toLowerCase();
        const isBump = productType === 'bump';
        const bumpPrice = Number(productInfo.price) || 0;
        let feePerSale = 0;
        if (isBump) {
          feePerSale = (fees?.fee_per_orderbump || 0);
          if (rawAmount > bumpPrice) feePerSale += (fees?.fee_per_sale || 0);
        } else {
          feePerSale = (fees?.fee_per_sale || 0);
        }
        const amount = Math.max(0, rawAmount - feePerSale);
        const isApproved = sale.status === 'approved' || sale.status === 'paid';
        const isRefunded = sale.status === 'refunded' || sale.status === 'chargedback';
        const isDeclined = sale.status === 'cancelled' || sale.status === 'declined';

        const addToMap = (map: Map<string, AttributionMetrics>, id: string | null) => {
          if (!id) return;
          const existing = map.get(id) || emptyMetrics();
          if (isApproved) {
            existing.sales += 1;
            existing.revenue += amount;
          } else if (isRefunded) {
            existing.refundedSales += 1;
          } else if (isDeclined) {
            existing.declinedSales += 1;
          }
          map.set(id, existing);
        };

        addToMap(byCampaignId, campaignId);
        addToMap(byAdSetId, adSetId);
        addToMap(byAdId, adId);
        addToMap(byCampaignName, campaignName);
        addToMap(byAdSetName, adSetName);
        addToMap(byAdName, adName);
      }

      setAttribution({ byCampaignId, byAdSetId, byAdId, byCampaignName, byAdSetName, byAdName });
    } catch (err) {
      console.error('Error fetching sales attribution:', err);
    } finally {
      setLoading(false);
    }
  }, [user, startDate, endDate, feeMap]);

  useEffect(() => {
    fetchAttribution();
  }, [fetchAttribution]);

  return { attribution, loading, refreshAttribution: fetchAttribution };
}
