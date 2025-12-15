import { getAdStatistics, getSlotStatistics } from '../api/statistics';
import type { AdStatistics, StatisticsFilters } from '../../src/types';

const statisticsRepository = {
  async getStatistics(filters: StatisticsFilters): Promise<AdStatistics> {
    return getAdStatistics(filters);
  },

  async getStatisticsForAd(adId: string, dateFrom?: string, dateTo?: string): Promise<AdStatistics> {
    return getAdStatistics({ ad_id: adId, date_from: dateFrom, date_to: dateTo });
  },

  async getSlotStatistics(slotId: string, days?: number): Promise<AdStatistics> {
    return getSlotStatistics(slotId, days);
  },
};

export default statisticsRepository;
