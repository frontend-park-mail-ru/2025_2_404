import ConfirmationModal from '../components/ConfirmationModal';
import adsRepository from '../../public/repository/adsRepository';
import statisticsRepository from '../../public/repository/statisticsRepository';
import { validateAdForm } from '../../public/utils/ValidateAdForm';
import type { HandlebarsTemplateDelegate, PageComponent, Ad, AdStatistics } from '../../src/types';
import type Router from '../../services/Router';
import { Chart, registerables } from 'chart.js';

// Регистрируем все компоненты Chart.js
Chart.register(...registerables);

let routerInstance: Router | null = null;

export function setProjectDetailRouter(r: Router): void {
  routerInstance = r;
}

export default class ProjectDetailPage implements PageComponent {
  projectId: string;
  template: HandlebarsTemplateDelegate | null = null;
  project: Ad | null = null;
  selectedFile: File | null = null;
  toggleEditMode: (show: boolean) => void;
  togglePreview: (show: boolean) => void;
  
  // Графики
  private impressionsClicksChart: Chart | null = null;
  private ctrChart: Chart | null = null;
  private financeChart: Chart | null = null;
  private currentStatistics: AdStatistics | null = null;

  constructor(_routerInstance: Router, projectId: string) {
    this.projectId = projectId;
    this.toggleEditMode = this._toggleEditMode.bind(this);
    this.togglePreview = this._togglePreview.bind(this);
  }

  private _togglePreview(show: boolean): void {
    const formCard = document.getElementById('ads-edit-mode');
    const previewCard = document.getElementById('ads-preview-card');

    if (formCard && previewCard) {
      if (show) {
        formCard.classList.add('is-preview-hidden');
        previewCard.classList.add('is-active');
      } else {
        formCard.classList.remove('is-preview-hidden');
        previewCard.classList.remove('is-active');
      }
    }
  }

  private _toggleEditMode(show: boolean): void {
    const viewMode = document.getElementById('ads-view-mode');
    const editMode = document.getElementById('ads-edit-mode');

    if (viewMode && editMode) {
      if (show) {
        viewMode.classList.add('is-hidden');
        editMode.classList.add('is-active');
      } else {
        viewMode.classList.remove('is-hidden');
        editMode.classList.remove('is-active');
      }
    }
  }

  async loadTemplate(): Promise<void> {
    if (this.template) return;
    try {
      const response = await fetch('/pages/projects/ProjectDetailPage.hbs');
      if (!response.ok) throw new Error('Не удалось загрузить шаблон ProjectDetailPage');
      this.template = Handlebars.compile(await response.text());
    } catch (error) {
      console.error(error);
      this.template = Handlebars.compile('<h1>Ошибка загрузки шаблона</h1>');
    }
  }

  async render(): Promise<string> {
    await this.loadTemplate();
    try {
      const projectData = await adsRepository.getById(this.projectId);
      if (!projectData) throw new Error('Нет данных об объявлении');

      const DEFAULT_IMG = '/public/assets/default.jpg';
      let imageUrl = projectData.image_url || '';

      if (!imageUrl) {
        imageUrl = DEFAULT_IMG;
      } else if (
        !imageUrl.startsWith('data:image') &&
        !imageUrl.startsWith('http') &&
        !imageUrl.startsWith('/')
      ) {
        imageUrl = `data:image/jpeg;base64,${imageUrl}`;
      }

      this.project = { ...projectData, image_url: imageUrl };

      return this.template ? this.template({
        project: this.project,
        isNew: false,
        lastUpdated: !navigator.onLine && this.project.timestamp ? this.project.timestamp : null,
      }) : '';
    } catch (err) {
      console.error(`Ошибка при рендеринге проекта ID ${this.projectId}:`, err);
      return this.template ? this.template({ error: (err as Error).message || 'Не удалось загрузить проект' }) : '';
    }
  }

  attachEvents(): void {
    document.querySelector('#back-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      routerInstance?.navigate('/projects');
    });

    document.querySelector('#ads-edit-btn')?.addEventListener('click', () => {
      this.toggleEditMode(true);
    });

    document.querySelector('#ads-back-btn')?.addEventListener('click', () => {
      this.toggleEditMode(false);
    });

    document.querySelector('#view-back-btn')?.addEventListener('click', () => {
      routerInstance?.navigate('/projects');
    });

    document.querySelector('#view-delete-btn')?.addEventListener('click', () => {
      this.handleDelete();
    });

    document.querySelector('#delete-btn')?.addEventListener('click', () => {
      this.handleDelete();
    });

    document.querySelector('#preview-toggle-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.togglePreview(true);
    });

    document.querySelector('#preview-back-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.togglePreview(false);
    });

    const editBtn = document.querySelector('#edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        const titleEl = document.getElementById('title-input') as HTMLInputElement | null;
        const descEl = document.getElementById('desc-input') as HTMLTextAreaElement | null;
        const siteEl = document.getElementById('site-input') as HTMLInputElement | null;
        const budgetEl = document.getElementById('budget-input') as HTMLInputElement | null;

        const title = titleEl?.value.trim() || '';
        const desc = descEl?.value.trim() || '';
        const site = siteEl?.value.trim() || '';
        const budget = budgetEl?.value.trim() || '';
        const imgFile = this.selectedFile;

        document.querySelectorAll('.error-message').forEach((el) => el.remove());
        document.querySelectorAll('.input--error').forEach((el) =>
          el.classList.remove('input--error')
        );

        const errors = validateAdForm({ title, description: desc, domain: site, budget, file: imgFile });

        const fieldMap: Record<string, string> = {
          title: 'title-input',
          description: 'desc-input',
          domain: 'site-input',
          budget: 'budget-input',
          image: 'img-file',
        };

        if (Object.keys(errors).length > 0) {
          for (const [key, msg] of Object.entries(errors)) {
            const input = document.getElementById(fieldMap[key]);
            if (input && msg) {
              input.classList.add('input--error');
              const err = document.createElement('small');
              err.textContent = msg;
              err.classList.add('error-message');
              input.insertAdjacentElement('afterend', err);
            }
          }
          console.warn('Ошибки валидации:', errors);
          return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', desc);
        formData.append('target_url', site);
        formData.append('budget', budget);
        if (imgFile) {
          formData.append('image', imgFile);
        }

        try {
          await adsRepository.update(this.projectId, formData);
          new ConfirmationModal({
            message: 'Изменения сохранены!',
            onConfirm: () => routerInstance?.navigate('/projects'),
          }).show();
        } catch (err) {
          console.error('Ошибка при обновлении:', err);
        }
      });
    }

    const titleInput = document.querySelector('#title-input') as HTMLInputElement | null;
    const descInput = document.querySelector('#desc-input') as HTMLTextAreaElement | null;
    const imgInput = document.getElementById('img-file') as HTMLInputElement | null;
    const previewTitle = document.querySelector('.ads__preview-card h4');
    const previewDesc = document.querySelector('.ads__preview-card p');
    const previewImg = document.querySelector('.ads__preview-image') as HTMLImageElement | null;

    titleInput?.addEventListener('input', () => {
      if (previewTitle) previewTitle.textContent = titleInput.value || 'Без названия';
    });

    descInput?.addEventListener('input', () => {
      if (previewDesc) previewDesc.textContent = descInput.value || 'Без описания';
    });

    imgInput?.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        this.selectedFile = file;
        const reader = new FileReader();
        reader.onload = (event) => {
          if (previewImg && event.target?.result) previewImg.src = event.target.result as string;
        };
        reader.readAsDataURL(file);
      }
    });

    // Инициализация статистики
    this.attachStatsEvents();
    this.loadStatistics(30);
  }

  handleDelete(): void {
    if (!this.project) return;
    const modal = new ConfirmationModal({
      message: `Вы уверены, что хотите удалить "${this.project.title}"?`,
      onConfirm: async () => {
        try {
          await adsRepository.delete(this.projectId);
          routerInstance?.navigate('/projects');
        } catch (err) {
          console.error('Ошибка при удалении:', err);
        }
      },
    });
    modal.show();
  }

  // === Методы для статистики ===

  async loadStatistics(days: number = 30): Promise<void> {
    try {
      const dateTo = new Date().toISOString().split('T')[0];
      const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // projectId - это UUID строка
      this.currentStatistics = await statisticsRepository.getStatisticsForAd(
        this.projectId,
        dateFrom,
        dateTo
      );
      
      this.updateSummaryCards();
      this.renderCharts();
      this.renderTable();
    } catch (err) {
      console.error('Ошибка при загрузке статистики:', err);
    }
  }

  private updateSummaryCards(): void {
    if (!this.currentStatistics) return;

    const formatNumber = (num: number): string => {
      return num.toLocaleString('ru-RU');
    };

    const impressionsEl = document.getElementById('total-impressions');
    const clicksEl = document.getElementById('total-clicks');
    const ctrEl = document.getElementById('total-ctr');
    const spentEl = document.getElementById('total-spent');
    const earnedEl = document.getElementById('total-earned');

    if (impressionsEl) impressionsEl.textContent = formatNumber(this.currentStatistics.total_impressions);
    if (clicksEl) clicksEl.textContent = formatNumber(this.currentStatistics.total_clicks);
    if (ctrEl) ctrEl.textContent = `${this.currentStatistics.total_ctr}%`;
    if (spentEl) spentEl.textContent = `${formatNumber(this.currentStatistics.total_spent)}₽`;
    if (earnedEl) earnedEl.textContent = `${formatNumber(this.currentStatistics.total_earned)}₽`;
  }

  private renderCharts(): void {
    if (!this.currentStatistics) return;

    const { daily_stats } = this.currentStatistics;
    const labels = daily_stats.map(d => this.formatDate(d.date));
    
    // Уничтожаем старые графики
    this.destroyCharts();

    // График показов и кликов
    const impressionsClicksCanvas = document.getElementById('impressions-clicks-chart') as HTMLCanvasElement;
    if (impressionsClicksCanvas) {
      this.impressionsClicksChart = new Chart(impressionsClicksCanvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Показы',
              data: daily_stats.map(d => d.impressions),
              backgroundColor: 'rgba(124, 84, 232, 0.7)',
              borderColor: 'rgba(124, 84, 232, 1)',
              borderWidth: 1,
            },
            {
              label: 'Клики',
              data: daily_stats.map(d => d.clicks),
              backgroundColor: 'rgba(255, 115, 175, 0.7)',
              borderColor: 'rgba(255, 115, 175, 1)',
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
            },
          },
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    }

    // График CTR
    const ctrCanvas = document.getElementById('ctr-chart') as HTMLCanvasElement;
    if (ctrCanvas) {
      this.ctrChart = new Chart(ctrCanvas, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'CTR (%)',
              data: daily_stats.map(d => d.ctr),
              borderColor: 'rgba(76, 175, 80, 1)',
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              fill: true,
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => `${value}%`,
              },
            },
          },
        },
      });
    }

    // График финансов
    const financeCanvas = document.getElementById('finance-chart') as HTMLCanvasElement;
    if (financeCanvas) {
      this.financeChart = new Chart(financeCanvas, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Списано (₽)',
              data: daily_stats.map(d => d.spent),
              borderColor: 'rgba(244, 67, 54, 1)',
              backgroundColor: 'rgba(244, 67, 54, 0.1)',
              fill: false,
              tension: 0.4,
            },
            {
              label: 'Заработано (₽)',
              data: daily_stats.map(d => d.earned),
              borderColor: 'rgba(76, 175, 80, 1)',
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              fill: false,
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => `${value}₽`,
              },
            },
          },
        },
      });
    }
  }

  private renderTable(): void {
    if (!this.currentStatistics) return;

    const tbody = document.getElementById('stats-table-body');
    if (!tbody) return;

    const { daily_stats } = this.currentStatistics;

    if (daily_stats.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="stats__table-empty">Нет данных за выбранный период</td></tr>';
      return;
    }

    // Сортируем по убыванию даты (новые сверху)
    const sortedStats = [...daily_stats].reverse();

    tbody.innerHTML = sortedStats.map(stat => `
      <tr>
        <td>${this.formatDate(stat.date)}</td>
        <td>${stat.impressions.toLocaleString('ru-RU')}</td>
        <td>${stat.clicks.toLocaleString('ru-RU')}</td>
        <td>${stat.ctr}%</td>
        <td>${stat.spent.toLocaleString('ru-RU')}₽</td>
        <td>${stat.earned.toLocaleString('ru-RU')}₽</td>
      </tr>
    `).join('');
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
  }

  private destroyCharts(): void {
    if (this.impressionsClicksChart) {
      this.impressionsClicksChart.destroy();
      this.impressionsClicksChart = null;
    }
    if (this.ctrChart) {
      this.ctrChart.destroy();
      this.ctrChart = null;
    }
    if (this.financeChart) {
      this.financeChart.destroy();
      this.financeChart = null;
    }
  }

  private attachStatsEvents(): void {
    const periodSelect = document.getElementById('stats-period') as HTMLSelectElement;
    if (periodSelect) {
      periodSelect.addEventListener('change', () => {
        const days = parseInt(periodSelect.value);
        this.loadStatistics(days);
      });
    }
  }
}
