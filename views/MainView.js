import MainPage from '../pages/main/MainPage.js';
import { listAds } from '../public/api/ads.js';

export default class MainAdvertisementView {
  constructor() {
    this.mainPage = new MainPage();
  }

  async render() {
    await this.mainPage.loadTemplate();
    const app = document.getElementById('app');
    app.innerHTML = this.mainPage.render();

    await this.loadAndRenderAds();
  }

  clear() {
    const app = document.getElementById('app');
    if (app) app.innerHTML = '';
  }

  async loadAndRenderAds() {
    const box = document.getElementById('ads-list');
    if (!box) return;

    box.innerHTML = '<div style="opacity:.6">Загружаем объявления…</div>';

    try {
      const ads = await listAds();
      if (!Array.isArray(ads) || ads.length === 0) {
        box.innerHTML = '<div style="opacity:.6">Пока нет объявлений</div>';
        return;
      }

      box.innerHTML = ads.map(ad => `
        <div class="promo-card">
          <div class="card-content">
            ${ad.file_path ? `<img src="${escapeHtml(ad.file_path)}" class="promo-image">` : ''}
            <div class="promo-text">
              <h2>${escapeHtml(ad.title)}</h2>
              <p>${escapeHtml(ad.text)}</p>
            </div>
          </div>
        </div>
      `).join('');
    } catch (e) {
      console.warn('GET /ads error:', e);
      box.innerHTML = '<div style="color:red">Не удалось загрузить объявления</div>';
    }
  }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
