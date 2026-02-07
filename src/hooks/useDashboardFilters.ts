import { useState, useMemo } from 'react';
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export type PeriodKey = 'today' | 'yesterday' | '7days' | '30days' | 'thisMonth' | 'lastMonth';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export function getDateRange(period: PeriodKey): DateRange {
  const now = new Date();

  switch (period) {
    case 'today':
      return { startDate: startOfDay(now), endDate: endOfDay(now) };
    case 'yesterday': {
      const yesterday = subDays(now, 1);
      return { startDate: startOfDay(yesterday), endDate: endOfDay(yesterday) };
    }
    case '7days':
      return { startDate: startOfDay(subDays(now, 6)), endDate: endOfDay(now) };
    case '30days':
      return { startDate: startOfDay(subDays(now, 29)), endDate: endOfDay(now) };
    case 'thisMonth':
      return { startDate: startOfMonth(now), endDate: endOfDay(now) };
    case 'lastMonth': {
      const lastMonth = subMonths(now, 1);
      return { startDate: startOfMonth(lastMonth), endDate: endOfMonth(lastMonth) };
    }
    default:
      return { startDate: startOfDay(now), endDate: endOfDay(now) };
  }
}

export function useDashboardFilters() {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('today');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');

  const dateRange = useMemo(() => getDateRange(selectedPeriod), [selectedPeriod]);

  return {
    selectedPeriod,
    setSelectedPeriod,
    selectedAccount,
    setSelectedAccount,
    selectedCampaign,
    setSelectedCampaign,
    selectedProduct,
    setSelectedProduct,
    dateRange,
  };
}
