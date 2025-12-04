import ConfirmationModal from '../components/ConfirmationModal';
import adsRepository from '../../public/repository/adsRepository';
import { listAds } from '../../public/api/ads';
import type { HandlebarsTemplateDelegate, PageComponent, Ad } from '../../src/types';
import type Router from '../../services/Router';

let routerInstance: Router | null = null;

export function setProjectsRouter(r: Router): void {
  routerInstance = r;
}

export default class ProjectsPage implements PageComponent {
  template: HandlebarsTemplateDelegate | null = null;

  constructor() {}

  async loadTemplate(): Promise<void> {
    if (this.template) return;
    try {
      const response = await fetch('/pages/projects/ProjectsPage.hbs');
      if (!response.ok) throw new Error('Не удалось загрузить шаблон проектов');
      this.template = Handlebars.compile(await response.text());
    } catch (error) {
      console.error(error);
      this.template = Handlebars.compile('<h1>Ошибка загрузки шаблона</h1>');
    }
  }

  async render(): Promise<string> {
    await this.loadTemplate();

    try {
      const ads = await adsRepository.getAll();
      const lastUpdated = ads.find(ad => ad.timestamp)?.timestamp;

      return this.template ? this.template({ projects: ads, lastUpdated: lastUpdated }) : '';
    } catch (err) {
      return this.template ? this.template({ error: (err as Error).message }) : '';
    }
  }

  attachEvents(): void {
    const newCampaignBtn = document.querySelector('#new-campaign-btn');
    newCampaignBtn?.addEventListener('click', () => {
      routerInstance?.navigate('/projects/create');
    });

    document.querySelectorAll('.projects__card').forEach(card => {
      card.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.closest('.btn-delete')) return;
        const projectId = (card as HTMLElement).dataset.id;
        if (projectId) routerInstance?.navigate(`/projects/${projectId}`);
      });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const adId = (btn as HTMLElement).dataset.id;
        if (adId) this.showDeleteModal(adId);
      });
    });
  }

  showDeleteModal(adId: string): void {
    const modal = new ConfirmationModal({
      message: 'Вы уверены, что хотите удалить это объявление?',
      onConfirm: async () => {
        try {
          await adsRepository.delete(adId);
          await this.refreshList();
        } catch (err) {
          console.error('Ошибка при удалении через репозиторий:', err);
        }
      },
    });
    modal.show();
  }

  async refreshList(): Promise<void> {
    try {
      const ads = await listAds();
      const projectsListContainer = document.querySelector('.projects__list');

      if (!projectsListContainer) return;

      if (ads.length === 0) {
        projectsListContainer.innerHTML = `<p style="text-align:center; padding:20px;">У вас пока нет проектов</p>`;
        return;
      }

      projectsListContainer.innerHTML = ads
        .map(
          (ad: Ad) => `
          <div class="projects__card" data-id="${ad.id}">
            <div class="projects__card-title">
               ${ad.title}
            </div>
            <div class="projects__card-meta">
              <span class="meta-item">${ad.domain}</span>
            </div>
          </div>
        `
        )
        .join('');
    } catch (err) {
      console.error('Ошибка при обновлении списка:', err);
    }
  }
}
