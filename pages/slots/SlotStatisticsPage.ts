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
    document.getElementById('stats-retry-btn')?.addEventListener('click', () => {
      this.loadStatistics();
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
      this.statistics = await statisticsRepository.getSlotStatistics(this.slotId, this.currentPeriod);
      const hasData = this.statistics && 
        (this.statistics.total_impressions > 0 || 
         this.statistics.total_clicks > 0 ||
         (this.statistics.daily_stats && this.statistics.daily_stats.length > 0));

      if (!hasData) {
        this.showMessage('Данных для показа пока нет. Статистика появится после первых показов рекламы.', false);
        return;
      }

      this.hideMessage();
      this.updateTotals();
      this.updateChart();
    } catch (err) {
      console.error('Ошибка при загрузке статистики:', err);
      this.showMessage('Ошибка сервера. Пожалуйста, попробуйте зайти позже.', true);
    }
  }

  private updateTotals(): void {
    if (!this.statistics) return;

    const impressionsEl = document.getElementById('total-impressions');
    const clicksEl = document.getElementById('total-clicks');
    const spentEl = document.getElementById('total-spent');

    if (impressionsEl) {
      impressionsEl.textContent = this.statistics.total_impressions.toLocaleString('ru-RU');
    }
    if (clicksEl) {
      clicksEl.textContent = this.statistics.total_clicks.toLocaleString('ru-RU');
    }
    if (spentEl) {
      const spent = (this.statistics.total_clicks + this.statistics.total_impressions) * 3;
      spentEl.textContent = spent.toLocaleString('ru-RU') + ' ₽';
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

    const { daily_stats } = this.statistics;
    const labels = daily_stats.map((d, i) => i.toString());
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
      spent: {
        data: daily_stats.map(d => d.spent),
        label: 'Траты (₽)',
        color: '#F59E0B',
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
