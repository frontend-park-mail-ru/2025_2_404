import adsRepository from '../../public/repository/adsRepository';
import type { HandlebarsTemplateDelegate, PageComponent } from '../../src/types';
import type Router from '../../services/Router';

let routerInstance: Router | null = null;

export function setProjectsRouter(r: Router): void {
  routerInstance = r;
}

// Динамический импорт slotsRepository (JS файл из новой ветки)
async function getSlotsRepository(): Promise<{
  getAll: () => Promise<unknown[]>;
}> {
  const module = await import('../../public/repository/slotsRepository.js');
  return module.default;
}

interface Item {
  id?: number | string;
  title?: string;
  name?: string;
  status?: string;
  created_at?: string;
  displayNumber?: number;
  [key: string]: unknown;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  pages: number[];
}

export default class ProjectsPage implements PageComponent {
  template: HandlebarsTemplateDelegate | null = null;
  activeTab: string;
  items: Item[] = [];
  allItems: Item[] = [];
  currentPage = 1;
  itemsPerPage = 5;

  constructor() {
    this.activeTab = localStorage.getItem('projects_tab') || 'slots';
  }

  async loadTemplate(): Promise<void> {
    if (this.template) return;
    Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a == b);
    Handlebars.registerHelper('gt', (a: number, b: number) => a > b);
    Handlebars.registerHelper('add', (a: number, b: number) => a + b);
    Handlebars.registerHelper('sub', (a: number, b: number) => a - b);
    
    Handlebars.registerHelper('formatDate', (dateStr: string) => {
      return dateStr ? new Date(dateStr).toLocaleDateString('ru-RU') : "06.06.2026";
    });

    try {
      const response = await fetch('/pages/projects/ProjectsPage.hbs');
      if (!response.ok) throw new Error('Error loading template');
      this.template = Handlebars.compile(await response.text());
    } catch (error) {
      console.error(error);
    }
  }

  async fetchData(): Promise<void> {
    try {
      if (this.activeTab === 'ads') {
        const ads = await adsRepository.getAll();
        this.allItems = (ads as Item[]).map((item, index) => ({
          ...item,
          status: 'active',
          displayNumber: index + 1
        }));
      } else {
        const slotsRepository = await getSlotsRepository();
        const slots = await slotsRepository.getAll();
        this.allItems = (slots as Item[]).map((item, index) => ({
          ...item,
          displayNumber: index + 1
        }));
      }
    } catch (err) {
      console.error(err);
      this.allItems = [];
    }
  }

  getPaginationData(): { visibleItems: Item[]; pagination: PaginationData } {
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

    return this.template ? this.template({
      items: visibleItems,
      activeTab: this.activeTab,
      pagination: pagination
    }) : '';
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

      document.querySelectorAll('.dropdown-option').forEach(option => {
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
        const target = e.target as Node;
        if (!trigger.contains(target)) {
          menu.classList.remove('show');
          arrow?.classList.remove('rotate');
        }
      });
    }

    document.getElementById('create-btn')?.addEventListener('click', () => {
      const path = this.activeTab === 'ads' ? '/projects/create' : '/slots/create';
      routerInstance?.navigate(path);
    });

    document.querySelectorAll('.project-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = (card as HTMLElement).dataset.id;
        if (this.activeTab === 'ads') {
          routerInstance?.navigate(`/projects/${id}`);
        } else {
          routerInstance?.navigate(`/slots/${id}`);
        }
      });
    });

    document.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const button = btn as HTMLButtonElement;
        if (button.hasAttribute('disabled') || button.classList.contains('active')) return;
        const newPage = parseInt(button.dataset.page || '1', 10);
        if (newPage && newPage > 0) {
          this.currentPage = newPage;
          await this.rerender();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });
  }
}
