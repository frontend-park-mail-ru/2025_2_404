import { router } from '../../main.js';
import adsRepository from '../../public/repository/adsRepository.js';
import slotsRepository from '../../public/repository/slotsRepository.js';

export default class ProjectsPage {
  constructor() {
    this.template = null;
    this.activeTab = localStorage.getItem('projects_tab') || 'slots';
    this.items = []; // В вашем коде было this.items или this.allItems, проверьте соответствие
    this.allItems = [];
    this.currentPage = 1;
    this.itemsPerPage = 5;
  }

  async loadTemplate() {
    if (this.template) return;
    Handlebars.registerHelper('eq', (a, b) => a == b);
    Handlebars.registerHelper('gt', (a, b) => a > b);
    Handlebars.registerHelper('add', (a, b) => a + b);
    Handlebars.registerHelper('sub', (a, b) => a - b);
    
    Handlebars.registerHelper('formatDate', (dateStr) => {
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

  async fetchData() {
    try {
      if (this.activeTab === 'ads') {
        let ads = await adsRepository.getAll();
        // Мапим объявления, добавляем статус и ПОРЯДКОВЫЙ НОМЕР
        this.allItems = ads.map((item, index) => ({
            ...item, 
            status: 'active',
            displayNumber: index + 1 // 1, 2, 3...
        })); 
      } else {
        let slots = await slotsRepository.getAll();
        // Мапим слоты, добавляем ПОРЯДКОВЫЙ НОМЕР
        this.allItems = slots.map((item, index) => ({
            ...item,
            displayNumber: index + 1 // 1, 2, 3...
        }));
      }
    } catch (err) {
      console.error(err);
      this.allItems = [];
    }
  }

  getPaginationData() {
    const totalItems = this.allItems.length;
    const totalPages = Math.ceil(totalItems / this.itemsPerPage);
    if (this.currentPage > totalPages && totalPages > 0) {
        this.currentPage = totalPages;
    }
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const visibleItems = this.allItems.slice(startIndex, endIndex);
    const pages = [];
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

  async render() {
    await this.loadTemplate();
    if (this.allItems.length === 0) {
        await this.fetchData();
    }

    const { visibleItems, pagination } = this.getPaginationData();

    return this.template({ 
        items: visibleItems, 
        activeTab: this.activeTab,
        pagination: pagination
    });
  }
  async rerender() {
      const app = document.getElementById('app');
      app.innerHTML = await this.render();
      this.attachEvents();
  }

  attachEvents() {
    const trigger = document.getElementById('title-dropdown-trigger');
    const menu = document.getElementById('title-dropdown-menu');
    const arrow = document.querySelector('.dropdown-arrow');
    if (trigger && menu) {
        trigger.addEventListener('click', () => {
            menu.classList.toggle('show');
            arrow.classList.toggle('rotate');
        });

        document.querySelectorAll('.dropdown-option').forEach(option => {
            option.addEventListener('click', async (e) => {
                const newType = e.target.dataset.type;
                if (newType !== this.activeTab) {
                    this.activeTab = newType;
                    localStorage.setItem('projects_tab', newType);
                    this.currentPage = 1;
                    this.allItems = []; 
                    
                    await this.rerender();
                }
            });
        });

        document.addEventListener('click', (e) => {
            if (!trigger.contains(e.target)) {
                menu.classList.remove('show');
                arrow.classList.remove('rotate');
            }
        });
    }
    document.getElementById('create-btn')?.addEventListener('click', () => {
        const path = this.activeTab === 'ads' ? '/projects/create' : '/slots/create';
        router.navigate(path);
    });
    document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.id;
            if (this.activeTab === 'ads') {
                router.navigate(`/projects/${id}`);
            } else {
                router.navigate(`/slots/${id}`);
            }
        });
    });
    document.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (btn.hasAttribute('disabled') || btn.classList.contains('active')) return;
            const newPage = parseInt(btn.dataset.page, 10);
            if (newPage && newPage > 0) {
                this.currentPage = newPage;
                await this.rerender();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });
  }
}