import { router } from '../../main.js';
import ConfirmationModal from '../components/ConfirmationModal.js';
import adsRepository from '../../public/repository/adsRepository.js';

export default class ProjectsPage {
  constructor() {
    this.template = null;
  }

  async loadTemplate() {
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

  async render() {
    await this.loadTemplate();

    try {
      const ads = await adsRepository.getAll();
      const lastUpdated = ads.find(ad => ad.timestamp)?.timestamp;
      
      return this.template({ projects: ads, lastUpdated: lastUpdated });
    } catch (err) {
      return this.template({ error: err.message });
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
        const adId = deleteBtn.dataset.id;
        this.showDeleteModal(adId);
        return;
      });
      const projectCard = target.closest('.project-card');
      if (projectCard) {
        const projectId = projectCard.dataset.id;
        if (projectId) {
          router.navigate(`/projects/${projectId}`);
        }
      }
    });
  }

  showDeleteModal(adId) {
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
