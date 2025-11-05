// ads.js
import { BASE, http } from './http.js';

/**
 * Преобразует поля от сервера в корректный URL для отображения изображения
 */
function normalizeImageUrl(ad, image) {
  // если сервер передал base64-строку
  if (image && typeof image === 'string') {
    const v = image.trim();

    // JPEG → обычно /9j/, PNG → iVBOR
    if (v.startsWith('/9j/') || v.startsWith('iVBOR')) {
      return `data:image/jpeg;base64,${v}`;
    }
    if (v.startsWith('data:image')) {
      return v;
    }
  }

  // иначе пробуем img_bin (путь)
  if (ad.img_bin) {
    const clean = String(ad.img_bin).replace(/^\/?ad\//, 'ad/');
    return `http://localhost:8000/${clean}`;
  }

  // fallback
  return 'https://via.placeholder.com/300x200?text=Нет+изображения';
}

/**
 * Получить список объявлений
 */
export async function listAds() {
  const res = await http.get('/ads/');
  const ads = res.data?.ads || [];

  return ads.map((ad) => ({
    id: ad.add_id,
    title: ad.title,
    description: ad.content,
    domain: ad.target_url || '',
    image_url: normalizeImageUrl(ad, ad.image), // на случай если image есть в списке
  }));
}

/**
 * Получить конкретное объявление
 */
export async function getAdById(ad_id) {
  const res = await http.get(`/ads/${ad_id}`);
  const ad = res.data?.ad || {};
  const image = res.data?.image || null; // ← base64 строка из корня data

  return {
    id: ad.add_id,
    title: ad.title,
    description: ad.content,
    domain: ad.target_url,
    budget: ad.amount_for_ad,
    image_url: normalizeImageUrl(ad, image), // ← ключевой момент
  };
}

/**
 * Удаление объявления
 */
export async function deleteAd(adId) {
  return http.delete(`/ads/${adId}`);
}
