import { listAds, deleteAd } from '../../public/api/ads.js';
import { router } from '../../main.js';
import ConfirmationModal from '../components/ConfirmationModal.js';

export default class ProjectsPage {
  constructor() {
    this.template = null;
  }

  async loadTemplate() {
    const response = await fetch('/pages/projects/ProjectsPage.hbs');
    if (!response.ok) throw new Error('Не удалось загрузить шаблон проектов');
    const templateText = await response.text();
    this.template = Handlebars.compile(templateText);
  }

  async render() {
    if (!this.template) return 'Загрузка...';

    try {
      const ads = await listAds();
      return this.template({ projects: ads });
    } catch (err) {
      console.error('Ошибка при загрузке проектов:', err);
      return `<div style="padding: 40px; text-align:center">
        <h2>Не удалось загрузить проекты</h2>
        <p>${err.body?.message || err.statusText || 'Ошибка сервера'}</p>
      </div>`;
    }
  }

  attachEvents() {
    // Навигация на создание
    const newCampaignBtn = document.querySelector('#new-campaign-btn');
    newCampaignBtn?.addEventListener('click', () => {
      router.navigate('/projects/create');
    });

    // Навигация на карточку
    document.querySelectorAll('.projects__card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-delete')) return; 
        const projectId = card.dataset.id;
        if (projectId) router.navigate(`/projects/${projectId}`);
      });
    });

    // Удаление через ConfirmationModal
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const adId = btn.dataset.id;

        const modal = new ConfirmationModal({
          message: 'Удалить это объявление?',
          onConfirm: async () => {
            try {
              await deleteAd(adId);
              await this.refreshList();
            } catch (err) {
              console.error('Ошибка при удалении:', err);
            }
          },
          onCancel: () => {
            console.log('Удаление отменено');
          },
        });

        modal.show();
      });
    });
  }

  /**
   * Обновляет список объявлений без перезагрузки страницы
   */
  async refreshList() {
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
          (ad) => `
          <div class="projects__card" data-id="${ad.id}">
            <div class="projects__card-title">
               ${ad.title} 
            </div>
            <div class="projects__card-meta">
              <span class="status ${ad.statusClass}">${ad.statusText}</span>
              <span class="meta-item">${ad.domain}</span>
            </div>
          </div>
        `
        )
        .join('');

      // заново навесить события на новые кнопки
      this.attachEvents();
    } catch (err) {
      console.error('Ошибка при обновлении списка:', err);
    }
  }
}
