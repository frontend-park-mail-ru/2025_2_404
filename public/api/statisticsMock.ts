import type { AdStatistics, DailyStats, SlotEvent } from '../../src/types';

// Генерация фейкового UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Генерация случайных событий (как в БД бэкенда: slot_event таблица)
// Структура: slot_id (UUID), ad_detail_id (UUID), event_type, created_time
function generateMockEvents(adId: string, daysBack: number = 30): SlotEvent[] {
  const events: SlotEvent[] = [];
  const now = new Date();
  
  // Генерируем несколько фиксированных slot_id для реалистичности
  const slotIds = Array.from({ length: 5 }, () => generateUUID());

  for (let d = daysBack; d >= 0; d--) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);

    // Генерируем случайное количество показов (50-200 в день)
    const impressionsCount = Math.floor(Math.random() * 150) + 50;
    
    for (let i = 0; i < impressionsCount; i++) {
      const eventTime = new Date(date);
      eventTime.setHours(Math.floor(Math.random() * 24));
      eventTime.setMinutes(Math.floor(Math.random() * 60));
      
      events.push({
        slot_id: slotIds[Math.floor(Math.random() * slotIds.length)],
        ad_detail_id: adId,
        event_type: 'impression',
        created_time: eventTime.toISOString(),
      });
    }

    // Генерируем клики (5-15% от показов)
    const clickRate = 0.05 + Math.random() * 0.1;
    const clicksCount = Math.floor(impressionsCount * clickRate);
    
    for (let i = 0; i < clicksCount; i++) {
      const eventTime = new Date(date);
      eventTime.setHours(Math.floor(Math.random() * 24));
      eventTime.setMinutes(Math.floor(Math.random() * 60));
      
      events.push({
        slot_id: slotIds[Math.floor(Math.random() * slotIds.length)],
        ad_detail_id: adId,
        event_type: 'click',
        created_time: eventTime.toISOString(),
      });
    }
  }

  return events;
}

// Агрегация событий в дневную статистику
function aggregateEventsToDailyStats(events: SlotEvent[], costPerClick: number = 5): DailyStats[] {
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
  
  // Сортируем по дате
  const sortedDates = Array.from(dailyMap.keys()).sort();
  
  for (const date of sortedDates) {
    const { impressions, clicks } = dailyMap.get(date)!;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const spent = clicks * costPerClick; // Рекламодатель платит за клики
    const earned = clicks * (costPerClick * 0.7); // Площадка получает 70% от клика

    dailyStats.push({
      date,
      impressions,
      clicks,
      ctr: Math.round(ctr * 100) / 100,
      spent,
      earned: Math.round(earned * 100) / 100,
    });
  }

  return dailyStats;
}

// Кэш для хранения сгенерированных данных
const mockDataCache = new Map<string, AdStatistics>();

export function getMockStatistics(adId: string, dateFrom?: string, dateTo?: string): AdStatistics {
  // Проверяем кэш
  if (!mockDataCache.has(adId)) {
    const events = generateMockEvents(adId, 30);
    const dailyStats = aggregateEventsToDailyStats(events);
    
    const totalImpressions = dailyStats.reduce((sum, d) => sum + d.impressions, 0);
    const totalClicks = dailyStats.reduce((sum, d) => sum + d.clicks, 0);
    const totalSpent = dailyStats.reduce((sum, d) => sum + d.spent, 0);
    const totalEarned = dailyStats.reduce((sum, d) => sum + d.earned, 0);
    
    mockDataCache.set(adId, {
      ad_id: adId,
      total_impressions: totalImpressions,
      total_clicks: totalClicks,
      total_ctr: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0,
      total_spent: Math.round(totalSpent * 100) / 100,
      total_earned: Math.round(totalEarned * 100) / 100,
      daily_stats: dailyStats,
    });
  }

  const cached = mockDataCache.get(adId)!;

  // Фильтрация по датам
  if (dateFrom || dateTo) {
    const filteredDaily = cached.daily_stats.filter(d => {
      if (dateFrom && d.date < dateFrom) return false;
      if (dateTo && d.date > dateTo) return false;
      return true;
    });

    const totalImpressions = filteredDaily.reduce((sum, d) => sum + d.impressions, 0);
    const totalClicks = filteredDaily.reduce((sum, d) => sum + d.clicks, 0);
    const totalSpent = filteredDaily.reduce((sum, d) => sum + d.spent, 0);
    const totalEarned = filteredDaily.reduce((sum, d) => sum + d.earned, 0);

    return {
      ad_id: adId,
      total_impressions: totalImpressions,
      total_clicks: totalClicks,
      total_ctr: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0,
      total_spent: Math.round(totalSpent * 100) / 100,
      total_earned: Math.round(totalEarned * 100) / 100,
      daily_stats: filteredDaily,
    };
  }

  return cached;
}

// Получить "сырые" события как в БД бэкенда (таблица slot_event)
// Формат: { slot_id, ad_detail_id, event_type, created_time }
export function getMockRawEvents(adId: string): SlotEvent[] {
  return generateMockEvents(adId, 7); // Последние 7 дней
}
