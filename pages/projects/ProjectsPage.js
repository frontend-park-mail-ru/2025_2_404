import { router } from '../../main.js';

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

  render() {
    if (!this.template) return 'Загрузка...';

    const projectsData = this.getMockProjects();
    return this.template({ projects: projectsData });
  }

  attachEvents() {
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
      card.addEventListener('click', () => {
        const projectId = card.dataset.id;
        if (projectId) {
          router.navigate(`/projects/${projectId}`);
        }
      });
    });
  }
}