import { http } from './http.js';

function normalizeImageUrl(ad, image) {
  const BACKEND_SERVER_BASE = 'http://89.208.230.119:8080';
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
  const res = await http.get('/ads/');
  const ads = res.data?.ads || [];
  return ads.map((ad) => ({
    id: ad.add_id,
    title: ad.title,
    description: ad.content,
    domain: ad.target_url || '',
    image_url: normalizeImageUrl(ad, ad.image), 
  }));
}

export async function getAdById(ad_id) {
  const res = await http.get(`/ads/${ad_id}`);
  const ad = res.data?.ad || {};
  const image = res.data?.image || null; 
  return {
    id: ad.add_id,
    title: ad.title,
    description: ad.content,
    domain: ad.target_url,
    budget: ad.amount_for_ad,
    image_url: normalizeImageUrl(ad, image),
  };
}

export async function deleteAd(adId) {
  return http.delete(`/ads/${adId}`);
}

export async function createAd(formData) {
  return http.post('/ads/', formData);
}

export async function updateAd(adId, formData) {
  return http.put(`/ads/${adId}`, formData);
}