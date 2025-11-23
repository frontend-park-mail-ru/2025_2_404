import { DBService } from '../../services/DataBaseService.js';
import { listAds, getAdById, createAd, updateAd, deleteAd } from '../../public/api/ads.js';

const adsRepository = {
  async getAll() {
    try {
      // Всегда пытаемся получить свежие данные с сервера
      const freshAds = await listAds();
      
      // Сохраняем в IndexedDB для офлайн использования
      try {
        await DBService.saveAllAds(freshAds.map(ad => ({ 
          ...ad, 
          timestamp: new Date().toISOString() 
        })));
      } catch (dbError) {
        console.warn("Не удалось сохранить в IndexedDB:", dbError);
      }
      
      return freshAds;

    } catch (error) {
      console.warn("Сеть недоступна. Загружаем данные из локального хранилища:", error);
      
      try {
        const localData = await DBService.getAllAds();
        if (localData && localData.length > 0) {
          console.log("Используем локальные данные:", localData.length, "объявлений");
          return localData;
        } else {
          throw new Error("Нет сохраненных данных для офлайн режима");
        }
      } catch (dbError) {
        console.error("Ошибка доступа к IndexedDB:", dbError);
        throw new Error("Не удалось загрузить данные");
      }
    }
  },

  async getById(id) {
    try {
      const freshAd = await getAdById(id);
      
      try {
        await DBService.saveAd({ 
          ...freshAd, 
          timestamp: new Date().toISOString() 
        });
      } catch (dbError) {
        console.warn("Не удалось сохранить в IndexedDB:", dbError);
      }
      
      return freshAd;
    } catch (error) {
      console.warn(`Сеть недоступна для объявления ID=${id}. Ищем в локальном хранилище:`, error);
      
      try {
        const localAd = await DBService.getAdById(id);
        if (localAd) {
          console.log("Используем локальную версию объявления");
          return localAd;
        } else {
          throw new Error("Объявление не найдено в локальном хранилище");
        }
      } catch (dbError) {
        console.error("Ошибка доступа к IndexedDB:", dbError);
        throw new Error("Не удалось загрузить данные объявления");
      }
    }
  },

  async create(formData) {
    // Для операций записи всегда требуется интернет
    if (!navigator.onLine) {
      throw new Error("Для создания объявления требуется подключение к интернету");
    }
    return await createAd(formData);
  },

  async update(id, formData) {
    if (!navigator.onLine) {
      throw new Error("Для обновления объявления требуется подключение к интернету");
    }
    return await updateAd(id, formData);
  },

  async delete(adId) {
    if (!navigator.onLine) {
      throw new Error("Для удаления объявления требуется подключение к интернету");
    }
    return await deleteAd(adId);
  },
};

export default adsRepository;