import { DBService } from '../../services/DataBaseService.js';
import { listAds, getAdById, createAd, updateAd, deleteAd } from '../../public/api/ads.js';

const adsRepository = {
  async getAll() {
    try {
      const freshAds = await listAds();
      await DBService.saveAllAds(freshAds.map(ad => ({ ...ad, timestamp: new Date().toISOString() })));

      return freshAds;

    } catch (error) {
      console.warn("Сеть недоступна. Загружаем данные из локального хранилища.");
      
      const localData = await DBService.getAllAds();

      if (localData && localData.length > 0) {
        return localData;
      } else {
        throw new Error("Вы в офлайн-режиме, и для этой страницы нет сохраненных данных.");
      }
    }
  },
  async getById(id) {
    try {
      const freshAd = await getAdById(id);
      await DBService.saveAd({ ...freshAd, timestamp: new Date().toISOString() });
      
      return freshAd;
    } catch (error) {
      console.warn(`Сеть недоступна для объявления ID=${id}. Ищем в локальном хранилище.`);
      
      const localAd = await DBService.getAdById(id);

      if (localAd) {
        return localAd;
      } else {
        throw new Error("Вы в офлайн-режиме, и для этого объявления нет сохраненных данных.");
      }
    }
  },

  async create(formData) {
    if (!navigator.onLine) {
      throw new Error("Offline mode: Cannot create ad.");
    }
    return await createAd(formData);
  },

  async update(id, formData) {
    if (!navigator.onLine) {
      throw new Error("Offline mode: Cannot update ad.");
    }
    return await updateAd(id, formData);
  },

  async delete(adId) {
    if (!navigator.onLine) {
      throw new Error("Offline mode: Cannot delete ad.");
    }
    return await deleteAd(adId);
  },
};

export default adsRepository;