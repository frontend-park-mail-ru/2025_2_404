import statisticsRepository from '../../public/repository/statisticsRepository';
import { slotsRepository } from '../../public/repository/slotsRepository';
import type { HandlebarsTemplateDelegate, PageComponent, AdStatistics, DailyStats } from '../../src/types';
import type Router from '../../services/Router';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

let routerInstance: Router | null = null;

export function setSlotStatisticsRouter(r: Router): void {
  routerInstance = r;
}

interface SlotInfo {
  id: string;
  name: string;
  status: string;
  statusClass: string;
}

export default class SlotStatisticsPage implements PageComponent {
  slotId: string;
  template: HandlebarsTemplateDelegate | null = null;
  slot: SlotInfo | null = null;
  statistics: AdStatistics | null = null;
  chart: Chart | null = null;
  currentMetric: string = 'impressions';
  currentPeriod: number = 30;

  constructor(_routerInstance: Router, slotId: string) {
    this.slotId = slotId;
  }

  async loadTemplate(): Promise<void> {
    if (this.template) return;
    try {
      const response = await fetch('/pages/slots/SlotStatisticsPage.hbs');
      if (!response.ok) throw new Error('Не удалось загрузить шаблон');
      this.template = Handlebars.compile(await response.text());
    } catch (error) {
      console.error(error);
      this.template = Handlebars.compile('<h1>Ошибка загрузки шаблона</h1>');
    }
  }

  async render(): Promise<string> {
    await this.loadTemplate();
    
    // Загружаем реальные данные слота
    const slotData = await slotsRepository.getById(this.slotId);
    
    this.slot = {
      id: this.slotId,
      name: slotData?.title || `Слот №${this.slotId.slice(-4) || '1'}`,
      status: slotData?.status === 'active' ? 'Активен' : 'Приостановлен',
      statusClass: slotData?.status === 'active' ? 'active' : 'paused',
    };

    return this.template ? this.template({ slot: this.slot }) : '';
  }

  attachEvents(): void {
    const metricSelect = document.getElementById('metric-select') as HTMLSelectElement;
    const periodSelect = document.getElementById('period-select') as HTMLSelectElement;

    metricSelect?.addEventListener('change', () => {
      this.currentMetric = metricSelect.value;
      this.updateChart();
    });

    periodSelect?.addEventListener('change', () => {
      this.currentPeriod = parseInt(periodSelect.value);
      // Обновляем отображение с локальной фильтрацией
      this.updateTotals();
      this.updateChart();
    });
    document.getElementById('stats-retry-btn')?.addEventListener('click', () => {
      this.loadStatistics();
    });
    
    // Обработчик для хлебных крошек "Мои слоты"
    document.getElementById('breadcrumb-slots')?.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.setItem('projects_tab', 'slots');
      if (routerInstance) {
        routerInstance.navigate('/projects');
      }
    });
    
    this.loadStatistics();
  }

  private showMessage(message: string, showRetry: boolean = false): void {
    const messageContainer = document.getElementById('stats-message');
    const messageText = document.getElementById('stats-message-text');
    const retryBtn = document.getElementById('stats-retry-btn');
    const content = document.getElementById('stats-content');

    if (messageContainer && messageText) {
      messageContainer.style.display = 'flex';
      messageText.textContent = message;
    }
    if (retryBtn) {
      retryBtn.style.display = showRetry ? 'inline-block' : 'none';
    }
    if (content) {
      content.style.display = 'none';
    }
  }

  private hideMessage(): void {
    const messageContainer = document.getElementById('stats-message');
    const content = document.getElementById('stats-content');

    if (messageContainer) {
      messageContainer.style.display = 'none';
    }
    if (content) {
      content.style.display = 'block';
    }
  }

  async loadStatistics(): Promise<void> {
    try {
      // Загружаем все данные, фильтрация по периоду делается локально
      this.statistics = await statisticsRepository.getSlotStatistics(this.slotId);
      
      const hasData = this.statistics && 
        (this.statistics.total_impressions > 0 || 
         this.statistics.total_clicks > 0 ||
         (this.statistics.daily_stats && this.statistics.daily_stats.length > 0));

      if (!hasData) {
        this.showMessage('Данных для показа пока нет. Статистика появится после первых показов рекламы', false);
        return;
      }

      this.hideMessage();
      this.updateTotals();
      this.updateChart();
    } catch (err) {
      console.error('Ошибка при загрузке статистики:', err);
      this.showMessage('Ошибка сервера. Пожалуйста, попробуйте зайти позже', true);
    }
  }

  private getFilteredStats(): DailyStats[] {
    if (!this.statistics) return [];
    
    const { daily_stats } = this.statistics;
    if (!daily_stats || daily_stats.length === 0) return [];
    
    // Фильтруем по выбранному периоду (на случай если бэкенд не фильтрует)
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    const cutoffDate = new Date();
    cutoffDate.setDate(now.getDate() - this.currentPeriod);
    cutoffDate.setHours(0, 0, 0, 0);
    
    return daily_stats.filter(stat => {
      const statDate = new Date(stat.date);
      return statDate >= cutoffDate && statDate <= now;
    });
  }

  private updateTotals(): void {
    if (!this.statistics) return;

    // Фильтруем данные по периоду
    const stats = this.getFilteredStats();
    
    // Считаем итоги
    const totalImpressions = stats.reduce((sum, d) => sum + d.impressions, 0);
    const totalClicks = stats.reduce((sum, d) => sum + d.clicks, 0);
    const totalEarned = stats.reduce((sum, d) => sum + d.earned, 0);

    const impressionsEl = document.getElementById('total-impressions');
    const clicksEl = document.getElementById('total-clicks');
    const earnedEl = document.getElementById('total-earned');

    if (impressionsEl) {
      impressionsEl.textContent = totalImpressions.toLocaleString('ru-RU');
    }
    if (clicksEl) {
      clicksEl.textContent = totalClicks.toLocaleString('ru-RU');
    }
    if (earnedEl) {
      earnedEl.textContent = totalEarned.toLocaleString('ru-RU') + ' ₽';
    }
  }

  private updateChart(): void {
    if (!this.statistics) return;

    const canvas = document.getElementById('main-chart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    // Фильтруем данные по периоду
    const stats = this.getFilteredStats();
    
    // Форматируем даты для отображения
    const labels = stats.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    });
    
    const dataMap: Record<string, { data: number[]; label: string; color: string }> = {
      impressions: {
        data: stats.map(d => d.impressions),
        label: 'Показы',
        color: '#7C54E8',
      },
      clicks: {
        data: stats.map(d => d.clicks),
        label: 'Клики',
        color: '#FF73AF',
      },
      ctr: {
        data: stats.map(d => d.ctr),
        label: 'CTR (%)',
        color: '#4CAF50',
      },
      earned: {
        data: stats.map(d => d.earned),
        label: 'Заработок (₽)',
        color: '#10B981',
      },
    };

    const selected = dataMap[this.currentMetric] || dataMap.impressions;

    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: selected.label,
          data: selected.data,
          borderColor: selected.color,
          backgroundColor: `${selected.color}20`,
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: selected.color,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#333',
              font: {
                size: 14,
                weight: 'bold',
              },
              usePointStyle: true,
              padding: 20,
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#888',
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: '#E8E8E8',
            },
            ticks: {
              color: '#888',
            },
          },
        },
      },
    });
  }
}
