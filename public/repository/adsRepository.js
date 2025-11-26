import { DBService } from '../../services/DataBaseService.js';
import { listAds, getAdById, createAd, updateAd, deleteAd } from '../../public/api/ads.js';

const adsRepository = {
  async getAll() {
    try {
      const freshAds = await listAds();
      
      // ИСПРАВЛЕНИЕ 1: Проверяем, что freshAds это массив, перед тем как делать map
      // Если пришла ошибка или null, мы искусственно вызываем ошибку, чтобы уйти в catch
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
        // ИСПРАВЛЕНИЕ 2: Не выбрасываем ошибку, а возвращаем пустой массив.
        // Это позволит странице отрисоваться (пустой), а не упасть с красной ошибкой.
        console.warn("Данных нет ни на сервере, ни в кэше.");
        return []; 
      }
    }
  },

  async getById(id) {
    try {
      const freshAd = await getAdById(id);
      
      // Проверка на пустоту
      if (!freshAd) throw new Error("Объявление не найдено на сервере");

      await DBService.saveAd({ ...freshAd, timestamp: new Date().toISOString() });
      
      return freshAd;
    } catch (error) {
      console.warn(`Сеть недоступна для объявления ID=${id}. Ищем в локальном хранилище.`);
      
      const localAd = await DBService.getAdById(id);

      if (localAd) {
        return localAd;
      } else {
        // ИСПРАВЛЕНИЕ 3: Возвращаем null вместо ошибки.
        // Компонент страницы должен проверить: if (!ad) { показать "Объявление не найдено" }
        return null; 
      }
    }
  },

  async create(formData) {
    // Здесь проверку onLine можно оставить, но лучше попробовать отправить запрос
    // и если упадет — обработать ошибку. Но пока оставим как есть.
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