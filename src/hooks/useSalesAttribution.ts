import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TrackingData {
  utm_source?: string;
  utm_campaign?: string;
  utm_medium?: string;
  utm_content?: string;
  utm_term?: string;
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

function getTracking(raw: RawData): TrackingData {
  // Check nested tracking object first, then top-level
  if (raw.tracking && typeof raw.tracking === 'object') {
    return raw.tracking;
  }
  return raw;
}

export function useSalesAttribution() {
  const { user } = useAuth();
  const [attribution, setAttribution] = useState<SalesAttribution>({
    byCampaignId: new Map(),
    byAdSetId: new Map(),
    byAdId: new Map(),
  });
  const [loading, setLoading] = useState(false);

  const fetchAttribution = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch today's sales
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: sales, error } = await supabase
        .from('sales')
        .select('amount, status, raw_data')
        .eq('user_id', user.id)
        .gte('created_at', todayStart.toISOString());

      if (error) throw error;

      const byCampaignId = new Map<string, AttributionMetrics>();
      const byAdSetId = new Map<string, AttributionMetrics>();
      const byAdId = new Map<string, AttributionMetrics>();

      for (const sale of sales || []) {
        const raw = sale.raw_data as RawData | null;
        if (!raw) continue;

        const tracking = getTracking(raw);
        const campaignId = extractIdFromUtm(tracking.utm_campaign);
        const adSetId = extractIdFromUtm(tracking.utm_medium);
        const adId = extractIdFromUtm(tracking.utm_content);

        const amount = Number(sale.amount) || 0;
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
      }

      setAttribution({ byCampaignId, byAdSetId, byAdId });
    } catch (err) {
      console.error('Error fetching sales attribution:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAttribution();
  }, [fetchAttribution]);

  return { attribution, loading, refreshAttribution: fetchAttribution };
}
