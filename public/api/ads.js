import { http } from './http1.js';

function normalizeImageUrl(ad, image, img_type) {
  const BACKEND_SERVER_BASE = 'https://adnet.website/api';
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
  const ads = Array.isArray(res) ? res : (res.data || []);

  return ads.map((ad) => ({
    id: ad.id || ad.add_id, 
    title: ad.title,
    description: ad.content,
    domain: ad.targeturl || ad.target_url || '', 
    image_url: normalizeImageUrl(ad, ad.image), 
  }));
}

export async function getAdById(ad_id) {
  const res = await http.get(`/ads/${ad_id}`);
  
  const ad = res.data?.ad || {};
  const imageBase64 = res.data?.imageData?.image_data || null; 
  const imageType = res.data?.imageData?.image_type || 'image/jpeg';

  return {
    id: ad.id,
    title: ad.title,
    description: ad.content,
    domain: ad.targeturl || '',
    budget: ad.budget,
    image_url: normalizeImageUrl(ad, imageBase64, imageType),
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