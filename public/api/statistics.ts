import { http } from './http';
import { getMockStatistics } from './statisticsMock';
import type { AdStatistics, StatisticsFilters, SlotEvent, DailyStats } from '../../src/types';

// Флаг для использования моков (установить false когда бэкенд будет готов)
const USE_MOCKS = true;

/**
 * Получить статистику для рекламной кампании
 * 
 * Структура данных на бэкенде (таблица slot_event):
 * - slot_id: UUID слота
 * - ad_detail_id: UUID рекламы  
 * - event_type: "impression" | "click"
 * - created_time: timestamp
 * 
 * Ожидаемый формат от бэкенда (когда будет реализован):
 * 
 * Вариант 1 - агрегированные данные:
 * {
 *   ad_id: "uuid-string",
 *   total_impressions: number,
 *   total_clicks: number,
 *   total_ctr: number,
 *   total_spent: number,
 *   total_earned: number,
 *   daily_stats: [
 *     { date: "2024-01-15", impressions: 150, clicks: 12, ctr: 8.0, spent: 60, earned: 42 }
 *   ]
 * }
 * 
 * Вариант 2 - сырые события (как в slot_event):
 * [
 *   { slot_id: "uuid", ad_detail_id: "uuid", event_type: "impression", created_time: "2024-01-15T10:30:00Z" },
 *   { slot_id: "uuid", ad_detail_id: "uuid", event_type: "click", created_time: "2024-01-15T10:35:00Z" }
 * ]
 * В этом случае используй aggregateEventsToStats() для агрегации на фронте.
 */
export async function getAdStatistics(filters: StatisticsFilters): Promise<AdStatistics> {
  if (USE_MOCKS) {
    // Имитация задержки сети
    await new Promise(resolve => setTimeout(resolve, 300));
    return getMockStatistics(filters.ad_id, filters.date_from, filters.date_to);
  }

  // Реальный запрос к бэкенду (когда эндпоинт будет готов)
  const params = new URLSearchParams();
  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);
  
  const queryString = params.toString();
  const url = `/ads/${filters.ad_id}/statistics${queryString ? `?${queryString}` : ''}`;
  
  return http.get<AdStatistics>(url);
}

/**
 * Агрегация сырых событий из slot_event в статистику
 * Используй если бэкенд отдаёт сырые события вместо агрегированных данных
 */
export function aggregateEventsToStats(events: SlotEvent[], adId: string, costPerClick: number = 5): AdStatistics {
  const dailyMap = new Map<string, { impressions: number; clicks: number }>();

  for (const event of events) {
    const dateKey = event.created_time.split('T')[0];
    
    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, { impressions: 0, clicks: 0 });
    }

    const day = dailyMap.get(dateKey)!;
    if (event.event_type === 'impression') {
      day.impressions++;
    } else {
      day.clicks++;
    }
  }

  const dailyStats: DailyStats[] = [];
  const sortedDates = Array.from(dailyMap.keys()).sort();
  
  for (const date of sortedDates) {
    const { impressions, clicks } = dailyMap.get(date)!;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const spent = clicks * costPerClick;
    const earned = clicks * (costPerClick * 0.7);

    dailyStats.push({
      date,
      impressions,
      clicks,
      ctr: Math.round(ctr * 100) / 100,
      spent,
      earned: Math.round(earned * 100) / 100,
    });
  }

  const totalImpressions = dailyStats.reduce((sum, d) => sum + d.impressions, 0);
  const totalClicks = dailyStats.reduce((sum, d) => sum + d.clicks, 0);
  const totalSpent = dailyStats.reduce((sum, d) => sum + d.spent, 0);
  const totalEarned = dailyStats.reduce((sum, d) => sum + d.earned, 0);

  return {
    ad_id: adId,
    total_impressions: totalImpressions,
    total_clicks: totalClicks,
    total_ctr: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0,
    total_spent: Math.round(totalSpent * 100) / 100,
    total_earned: Math.round(totalEarned * 100) / 100,
    daily_stats: dailyStats,
  };
}
