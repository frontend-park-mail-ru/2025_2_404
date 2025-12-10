import { http } from './http';
import type { Ad } from '../../src/types';

// URL для загрузки изображений напрямую с бэкенда
const BACKEND_SERVER_BASE = 'https://adnet.website/api';

interface AdApiResponse {
  id?: number;
  add_id?: number;
  title: string;
  content: string;
  target_url?: string;
  targeturl?: string;
  amount_for_ad?: number;
  img_bin?: string;
  image?: string;
}

interface GetAdResponse {
  data?: {
    ad?: AdApiResponse;
    imageData?: {
      image_data?: string;
      image_type?: string;
    };
  };
}

function normalizeImageUrl(ad: AdApiResponse | null, image: string | null, imgType: string = 'image/jpeg'): string {
  if (typeof image === 'string') {
    const v = image.trim();
    if (v.startsWith('/9j/') || v.startsWith('iVBOR')) {
      return `data:${imgType};base64,${v}`;
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

export async function listAds(): Promise<Ad[]> {
  const res = await http.get<AdApiResponse[] | { data?: AdApiResponse[] }>('/ads');
  
  // Сервер может вернуть массив напрямую или в обёртке data
  const ads = Array.isArray(res) ? res : ((res as any).data || []);
  
  return ads.map((ad: AdApiResponse) => ({
    id: ad.id || ad.add_id,
    title: ad.title,
    description: ad.content,
    // Сервер может вернуть targeturl или target_url
    domain: ad.targeturl || ad.target_url || '',
    image_url: normalizeImageUrl(ad, ad.image || null),
  }));
}

export async function getAdById(ad_id: number | string): Promise<Ad> {
  const res = await http.get<GetAdResponse>(`/ads/${ad_id}`);
  
  const ad = res.data?.ad || {} as AdApiResponse;
  const imageBase64 = res.data?.imageData?.image_data || null;
  const imageType = res.data?.imageData?.image_type || 'image/jpeg';

  return {
    id: ad.id || ad.add_id || 0,
    title: ad.title,
    description: ad.content,
    domain: ad.targeturl || ad.target_url || '',
    budget: ad.amount_for_ad,
    image_url: normalizeImageUrl(ad, imageBase64, imageType),
  };
}

export async function deleteAd(adId: number | string): Promise<void> {
  await http.delete(`/ads/${adId}`);
}

export async function createAd(formData: FormData): Promise<unknown> {
  return http.post('/ads', formData);
}

export async function updateAd(adId: number | string, formData: FormData): Promise<unknown> {
  return http.put(`/ads/${adId}`, formData);
}
