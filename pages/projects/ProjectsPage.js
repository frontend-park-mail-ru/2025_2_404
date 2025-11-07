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
    const pageContainer = document.querySelector('.projects-page'); 
    if (!pageContainer) return;
    pageContainer.addEventListener('click', (e) => {
      const target = e.target;
      if (target.closest('#new-campaign-btn')) {
        router.navigate('/projects/create');
        return;
      }
      const deleteBtn = target.closest('.btn-delete');
      if (deleteBtn) {
        e.stopPropagation();
        const adId = deleteBtn.dataset.id;
        this.showDeleteModal(adId);
        return;
      }
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
      const ads = await adsRepository.getAll();
      const projectsListContainer = document.querySelector('.projects-list');
      if (!projectsListContainer) return;
      
      const templateString = `
        {{#each projects}}
          <div class="project-card" data-id="{{this.id}}">
            <div class="card-header">
              <h3>{{this.title}}</h3>
              <div class="card-actions">
                <button class="btn btn-delete" data-id="{{this.id}}">Удалить</button>
              </div>
            </div>
            <div class="card-meta">
              <span class="meta-item">{{this.domain}}</span>
            </div>
          </div>
        {{else}}
          <p style="text-align:center; padding:20px;">У вас пока нет проектов.</p>
        {{/each}}
      `;
      const template = Handlebars.compile(templateString);
      projectsListContainer.innerHTML = template({ projects: ads });
    } catch (err) {
      console.error('Ошибка при обновлении списка:', err);
    }
  }
}