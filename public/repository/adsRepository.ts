import { DBService } from '../../services/DataBaseService';
import { listAds, getAdById, createAd, updateAd, deleteAd } from '../api/ads';
import { http } from '../api/http'; 
import type { Ad } from '../../src/types';

const adsRepository = {
  async getAll(): Promise<Ad[]> {
    try {
      const freshAds = await listAds();
      const list = Array.isArray(freshAds) ? freshAds : (freshAds as any).data || [];
      
      if (!Array.isArray(list)) {
         console.warn("API не вернул массив объявлений", freshAds);
         return [];
      }

      await DBService.saveAllAds(list.map((ad: any) => ({ ...ad, timestamp: new Date().toISOString() })));
      return list;
    } catch (error) {
      console.warn("Ошибка загрузки, пробуем кэш...", error);
      const localData = await DBService.getAllAds();
      return localData || [];
    }
  },

  async getById(id: number | string): Promise<Ad | null> {
    try {
      const freshAd = await getAdById(id);
      if (!freshAd) throw new Error("Объявление не найдено на сервере");
      await DBService.saveAd({ ...freshAd, timestamp: new Date().toISOString() });
      return freshAd;
    } catch (error) {
      console.warn(`Ошибка сети ID=${id}, ищем в кэше.`);
      return await DBService.getAdById(id) || null;
    }
  },

  async create(formData: FormData): Promise<unknown> {
    if (!navigator.onLine) throw new Error("Offline mode");
    return await createAd(formData);
  },

  async update(id: number | string, formData: FormData): Promise<unknown> {
    if (!navigator.onLine) throw new Error("Offline mode");
    return await updateAd(id, formData);
  },
  async addBudget(id: number | string, amount: number): Promise<unknown> {
    if (!navigator.onLine) throw new Error("Offline mode");
    const formData = new FormData();
    formData.append('budget', String(amount)); 
    return await http.put(`/api/ads/${id}/addBudget`, formData);
  },

  async delete(adId: number | string): Promise<void> {
    if (!navigator.onLine) throw new Error("Offline mode");
    return await deleteAd(adId);
  },
};

export default adsRepository;