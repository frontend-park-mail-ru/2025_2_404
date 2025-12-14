import { DBService } from '../../services/DataBaseService.js';
import { listAds, getAdById, createAd, updateAd, deleteAd } from '../../public/api/ads.js';

const adsRepository = {
  async getAll() {
    try {
      const freshAds = await listAds();
      if (!Array.isArray(freshAds)) {
        throw new Error("Ответ сервера не является массивом");
      }

      await DBService.saveAllAds(freshAds.map(ad => ({ ...ad, timestamp: new Date().toISOString() })));

      return freshAds;

    } catch (error) {
      console.warn("Не удалось загрузить с сервера (или 504). Ищем в локальном хранилище.");
      
      const localData = await DBService.getAllAds();

      if (localData && localData.length > 0) {
        return localData;
      } else {
        console.warn("Данных нет ни на сервере, ни в кэше.");
        return []; 
      }
    }
  },

  async getById(id) {
    try {
      const freshAd = await getAdById(id);
      if (!freshAd) throw new Error("Объявление не найдено на сервере");

      await DBService.saveAd({ ...freshAd, timestamp: new Date().toISOString() });
      
      return freshAd;
    } catch (error) {
      console.warn(`Сеть недоступна для объявления ID=${id}. Ищем в локальном хранилище.`);
      
      const localAd = await DBService.getAdById(id);

      if (localAd) {
        return localAd;
      } else {
        return null; 
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