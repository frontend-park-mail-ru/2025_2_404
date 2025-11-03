import { router } from '../../main.js';

export default class ProjectsPage {
  constructor() {
    this.template = null;
  }

  async loadTemplate() {
    if (this.template) return;
    const response = await fetch('/pages/projects/ProjectsPage.hbs');
    if (!response.ok) throw new Error('Не удалось загрузить шаблон проектов');
    this.template = Handlebars.compile(await response.text());
  }
  getMockProjects() {
    return [
      {
        id: '1889448216939767582',
        date: '05.10.2025',
        statusText: 'Остановлено',
        statusClass: 'stopped',
        domain: 'chat.deepseek.com'
      },
      {
        id: '1889448216939767583',
        date: '06.10.2025',
        statusText: 'Активно',
        statusClass: 'active',
        domain: 'google.com'
      }
    ];
  }

  async render() {
    await this.loadTemplate();

    const projectsData = this.getMockProjects();
    return this.template({ projects: projectsData });
  }

  attachEvents() {
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
      card.addEventListener('click', (e) => {
        const projectId = card.dataset.id;
        if (projectId) {
        }
      });
    });
  }
}