export default class ProjectDetailPage {
  constructor(router, projectId) {
    this.projectId = projectId;
  }
  render() {
    return `
      <div style="text-align: center; padding: 80px;">
          <h1>Рекламная кампания №${this.projectId}</h1>
          <a href="/projects">Вернуться ко всем проектам</a>
      </div>
    `;
  }
}