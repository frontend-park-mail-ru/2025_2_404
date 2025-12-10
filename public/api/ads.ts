import { http } from './http';
import type { Ad } from '../../src/types';

// URL для загрузки изображений напрямую с бэкенда
// const BACKEND_SERVER_BASE = 'http://localhost:8080';
const BACKEND_SERVER_BASE = 'https://adnet.website/api';

interface AdApiResponse {
  add_id: number;
  title: string;
  content: string;
  target_url?: string;
  amount_for_ad?: number;
  img_bin?: string;
  image?: string;
}

interface ListAdsResponse {
  data?: {
    ads?: AdApiResponse[];
  };
}

interface GetAdResponse {
  data?: {
    ad?: AdApiResponse;
    image?: string;
  };
}

function normalizeImageUrl(ad: AdApiResponse | null, image: string | null): string {
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

export async function listAds(): Promise<Ad[]> {
  const res = await http.get<ListAdsResponse>('/ads/');
  const ads = res.data?.ads || [];
  return ads.map((ad) => ({
    id: ad.add_id,
    title: ad.title,
    description: ad.content,
    domain: ad.target_url || '',
    image_url: normalizeImageUrl(ad, ad.image || null),
  }));
}

export async function getAdById(ad_id: number | string): Promise<Ad> {
  const res = await http.get<GetAdResponse>(`/ads/${ad_id}`);
  const ad = res.data?.ad || {} as AdApiResponse;
  const image = res.data?.image || null;
  return {
    id: ad.add_id,
    title: ad.title,
    description: ad.content,
    domain: ad.target_url || '',
    budget: ad.amount_for_ad,
    image_url: normalizeImageUrl(ad, image),
  };
}

export async function deleteAd(adId: number | string): Promise<void> {
  await http.delete(`/ads/${adId}`);
}

export async function createAd(formData: FormData): Promise<unknown> {
  return http.post('/ads/', formData);
}

export async function updateAd(adId: number | string, formData: FormData): Promise<unknown> {
  return http.put(`/ads/${adId}`, formData);
}
