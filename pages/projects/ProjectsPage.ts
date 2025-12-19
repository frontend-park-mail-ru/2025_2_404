import adsRepository from '../../public/repository/adsRepository';
import slotsRepository from '../../public/repository/slotsRepository';
import type { HandlebarsTemplateDelegate, PageComponent } from '../../src/types';
import type Router from '../../services/Router';

let routerInstance: Router | null = null;

export function setProjectsRouter(r: Router): void {
  routerInstance = r;
}

interface ProjectItem {
  id: string | number;
  title?: string;
  status?: string;
  createdAt?: string;
  displayNumber?: number;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  pages: number[];
}

export default class ProjectsPage implements PageComponent {
  template: HandlebarsTemplateDelegate | null = null;
  activeTab: string;
  items: ProjectItem[];
  allItems: ProjectItem[];
  currentPage: number;
  itemsPerPage: number;

  constructor() {
    this.template = null;
    this.activeTab = localStorage.getItem('projects_tab') || 'slots';
    this.items = [];
    this.allItems = [];
    this.currentPage = 1;
    this.itemsPerPage = 5;
  }

  async loadTemplate(): Promise<void> {
    if (this.template) return;
    Handlebars.registerHelper('eq', (...args: unknown[]) => args[0] == args[1]);
    Handlebars.registerHelper('gt', (...args: unknown[]) => (args[0] as number) > (args[1] as number));
    Handlebars.registerHelper('add', (...args: unknown[]) => (args[0] as number) + (args[1] as number));
    Handlebars.registerHelper('sub', (...args: unknown[]) => (args[0] as number) - (args[1] as number));

    Handlebars.registerHelper('formatDate', (...args: unknown[]) => {
      const dateStr = args[0] as string;
      return dateStr ? new Date(dateStr).toLocaleDateString('ru-RU') : '06.06.2026';
    });

    try {
      const response = await fetch('/pages/projects/ProjectsPage.hbs');
      if (!response.ok) throw new Error('Error loading template');
      this.template = Handlebars.compile(await response.text());
    } catch (error) {
      console.error(error);
    }
  }

// В файле ProjectsPage.ts

// ProjectsPage.ts

  async fetchData(): Promise<void> {
    try {
      if (this.activeTab === 'ads') {
        // 1. Получаем "сырой" ответ. Используем any, чтобы TS не мешал отладке
        const response: any = await adsRepository.getAll();
        console.log('Ответ от сервера (Ads):', response);

        // 2. Извлекаем массив.
        // Если пришло { data: [...] }, берем response.data.
        // Если пришел сразу массив [...], берем response.
        const adsList = Array.isArray(response) ? response : (response.data || []);

        // 3. Маппим данные
        this.allItems = adsList.map((item: any, index: number) => ({
          ...item,
          // Принудительно ищем поле даты в разных вариантах написания
          createdAt: item.createdAt || item.created_at || item.timestamp,
          status: item.status || 'non-active', 
          displayNumber: index + 1
        }));
        
        console.log('Обработанные данные (Ads):', this.allItems); // Проверьте это в консоли

      } else {
        // Аналогично для слотов
        const response: any = await slotsRepository.getAll();
        const slotsList = Array.isArray(response) ? response : (response.data || []);
        
        this.allItems = slotsList.map((item: any, index: number) => ({
          ...item,
          createdAt: item.createdAt || item.created_at || item.created_time,
          displayNumber: index + 1
        }));
      }
    } catch (err) {
      console.error('Ошибка при загрузке данных:', err);
      this.allItems = [];
    }
  }

  getPaginationData(): { visibleItems: ProjectItem[]; pagination: PaginationData } {
    const totalItems = this.allItems.length;
    const totalPages = Math.ceil(totalItems / this.itemsPerPage);
    if (this.currentPage > totalPages && totalPages > 0) {
      this.currentPage = totalPages;
    }
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const visibleItems = this.allItems.slice(startIndex, endIndex);
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    return {
      visibleItems,
      pagination: {
        currentPage: this.currentPage,
        totalPages,
        pages
      }
    };
  }

  async render(): Promise<string> {
    await this.loadTemplate();
    if (this.allItems.length === 0) {
      await this.fetchData();
    }

    const { visibleItems, pagination } = this.getPaginationData();

    return this.template
      ? this.template({
          items: visibleItems,
          activeTab: this.activeTab,
          pagination: pagination
        })
      : '';
  }

  async rerender(): Promise<void> {
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = await this.render();
      this.attachEvents();
    }
  }

  attachEvents(): void {
    const trigger = document.getElementById('title-dropdown-trigger');
    const menu = document.getElementById('title-dropdown-menu');
    const arrow = document.querySelector('.dropdown-arrow');

    if (trigger && menu) {
      trigger.addEventListener('click', () => {
        menu.classList.toggle('show');
        arrow?.classList.toggle('rotate');
      });

      document.querySelectorAll('.dropdown-option').forEach((option) => {
        option.addEventListener('click', async (e) => {
          const target = e.target as HTMLElement;
          const newType = target.dataset.type;
          if (newType && newType !== this.activeTab) {
            this.activeTab = newType;
            localStorage.setItem('projects_tab', newType);
            this.currentPage = 1;
            this.allItems = [];

            await this.rerender();
          }
        });
      });

      document.addEventListener('click', (e) => {
        if (!trigger.contains(e.target as Node)) {
          menu.classList.remove('show');
          arrow?.classList.remove('rotate');
        }
      });
    }

    document.getElementById('create-btn')?.addEventListener('click', () => {
      const path = this.activeTab === 'ads' ? '/projects/create' : '/slots/create';
      routerInstance?.navigate(path);
    });

    document.querySelectorAll('.project-card').forEach((card) => {
      card.addEventListener('click', () => {
        const id = (card as HTMLElement).dataset.id;
        if (this.activeTab === 'ads') {
          routerInstance?.navigate(`/projects/${id}`);
        } else {
          routerInstance?.navigate(`/slots/${id}`);
        }
      });
    });

    document.querySelectorAll('.page-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (btn.hasAttribute('disabled') || btn.classList.contains('active')) return;
        const newPage = parseInt((btn as HTMLElement).dataset.page || '0', 10);
        if (newPage && newPage > 0) {
          this.currentPage = newPage;
          await this.rerender();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });
  }
}
