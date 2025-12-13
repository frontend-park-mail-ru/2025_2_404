import statisticsRepository from '../../public/repository/statisticsRepository';
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
    
    // Мок данных слота (замени на реальный API когда будет готов)
    this.slot = {
      id: this.slotId,
      name: `Слот №${this.slotId.slice(-4) || '1'}`,
      status: 'Активен',
      statusClass: 'active',
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
      this.loadStatistics();
    });

    // Загружаем статистику сразу
    this.loadStatistics();
  }

  async loadStatistics(): Promise<void> {
    try {
      const dateTo = new Date().toISOString().split('T')[0];
      const dateFrom = new Date(Date.now() - this.currentPeriod * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      this.statistics = await statisticsRepository.getStatisticsForAd(this.slotId, dateFrom, dateTo);
      
      this.updateTotals();
      this.updateChart();
    } catch (err) {
      console.error('Ошибка при загрузке статистики:', err);
    }
  }

  private updateTotals(): void {
    if (!this.statistics) return;

    const impressionsEl = document.getElementById('total-impressions');
    const clicksEl = document.getElementById('total-clicks');

    if (impressionsEl) {
      impressionsEl.textContent = this.statistics.total_impressions.toLocaleString('ru-RU');
    }
    if (clicksEl) {
      clicksEl.textContent = this.statistics.total_clicks.toLocaleString('ru-RU');
    }
  }

  private updateChart(): void {
    if (!this.statistics) return;

    const canvas = document.getElementById('main-chart') as HTMLCanvasElement;
    if (!canvas) return;

    // Уничтожаем старый график
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    const { daily_stats } = this.statistics;
    const labels = daily_stats.map((d, i) => i.toString());
    
    // Метрики соответствуют бэкенду: slot_event хранит только impression и click
    const dataMap: Record<string, { data: number[]; label: string; color: string }> = {
      impressions: {
        data: daily_stats.map(d => d.impressions),
        label: 'Показы',
        color: '#7C54E8',
      },
      clicks: {
        data: daily_stats.map(d => d.clicks),
        label: 'Клики',
        color: '#FF73AF',
      },
      ctr: {
        data: daily_stats.map(d => d.ctr),
        label: 'CTR (%)',
        color: '#4CAF50',
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
            display: false,
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
