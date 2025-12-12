import { http } from './http1.js';

function normalizeImageUrl(ad, image, img_type) {
  const BACKEND_SERVER_BASE = 'https://localhost:8080/api';
  if (typeof image === 'string') {
    const v = image.trim();
    if (v.startsWith('/9j/') || v.startsWith('iVBOR')) {
      return `data:${img_type};base64,${v}`;
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
  const ads = Array.isArray(res) ? res : (res.data || []);

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
  
  const ad = res.data?.ad || {};
  const imageBase64 = res.data?.imageData?.image_data || null;  // 1
  const imageType = res.data?.imageData?.image_type || 'image/jpeg';  //2

  return {
    id: ad.id,
    title: ad.title,
    description: ad.content,
    domain: ad.targeturl || '',
    budget: ad.amount_for_ad,
    image_url: normalizeImageUrl(ad, imageBase64, imageType), //3
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