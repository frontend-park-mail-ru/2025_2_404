import { http } from './http.js';

/**
 * Получить список всех объявлений
 */
export async function listAds() {
  const res = await http.get('/ads/');
  const ads = res.data?.ads || [];

  return ads.map(ad => ({
    id: ad.add_id,
    title: ad.title,
    description: ad.content,
    image: ad.img_bin || 'https://via.placeholder.com/300x200?text=Нет+изображения',
    domain: ad.target_url || '',
    date: '',
    statusText: 'Активно',
    statusClass: 'active',
  }));
}

/**
 * Получить одно объявление по ID
 */
export async function getAdById(ad_id) {
  const res = await http.get(`/ads/${ad_id}`);
  const ad = res.data?.ad || {};

  return {
    id: ad.add_id,
    title: ad.title,
    description: ad.content,
    image: ad.img_bin || 'https://via.placeholder.com/300x200?text=Нет+изображения',
    domain: ad.target_url || '',
  };
}

/**
 * Создать новое объявление
 */
export async function createAd(adData) {
  const cleanData = { ...adData };
  delete cleanData.id;
  delete cleanData.client_id;
  delete cleanData.budget;

  return http.post('/ads/', cleanData);
}

/**
 * Обновить существующее объявление
 */
export async function updateAd(ad_id, adData) {
  const cleanData = { ...adData };
  delete cleanData.id;
  delete cleanData.client_id;
  delete cleanData.budget;

  return http.put(`/ads/${ad_id}`, cleanData);
}

/**
 * Удалить объявление
 */
export async function deleteAd(adId) {
  return http.delete(`/ads/${adId}`);
}
