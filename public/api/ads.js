import { http } from './http1.js';

function normalizeImageUrl(ad, image) {
  const BACKEND_SERVER_BASE = 'http://localhost:8080';
  if (typeof image === 'string') {
    const v = image.trim();
    if (v.startsWith('/9j/') || v.startsWith('iVBOR')) {
      return `data:image/jpeg;base64,${v}`;
    }
    if (v.startsWith('data:image')) {
      return v;
    }
  }

  if (ad && ad.img_bin) {
    const cleanPath = String(ad.img_bin).replace(/^\/?/, ''); 
    return `${BACKEND_SERVER_BASE}/${cleanPath}`;
  }
  return '/public/assets/default.jpg';
}

export async function listAds() {
  const res = await http.get('/ads');

  // 1. Получаем массив. 
  // Судя по скриншоту, сервер присылает массив сразу, без обертки "data" или "ads".
  // Но оставим проверки на всякий случай.
  let ads = Array.isArray(res) ? res : (res.ads || res.data?.ads || []);

  return ads.map((ad) => ({
    // ИСПРАВЛЕНИЕ 1: Сервер шлет "id", а не "add_id"
    id: ad.id || ad.add_id, 
    
    title: ad.title,
    description: ad.content,
    
    // ИСПРАВЛЕНИЕ 2: Сервер шлет "targeturl", а не "target_url"
    domain: ad.targeturl || ad.target_url || '', 
    
    image_url: normalizeImageUrl(ad, ad.image), 
  }));
}

export async function getAdById(ad_id) {
  const res = await http.get(`/ads/${ad_id}`);
  
  // Сервер может вернуть объект напрямую или в обертке
  const ad = res.ad || res.data?.ad || res || {};
  const image = res.image || res.data?.image || ad.image || null; 

  return {
    // И здесь тоже исправляем поля под ответ сервера
    id: ad.id || ad.add_id,
    title: ad.title,
    description: ad.content,
    domain: ad.targeturl || ad.target_url,
    budget: ad.amount_for_ad,
    image_url: normalizeImageUrl(ad, image),
  };
}

export async function deleteAd(adId) {
  return http.delete(`/ads/${adId}`);
}

export async function createAd(formData) {
  return http.post('/ads', formData);
}

export async function updateAd(adId, formData) {
  return http.put(`/ads/${adId}`, formData);
}