import { http } from '../api/http1.js'; // Убедитесь, что путь до http1.js верный

// ВАЖНО: Это адрес вашего БЭКЕНДА, откуда будут грузиться баннеры
const BASE = "https://localhost:8080/api"; 

class SlotsRepository {

  async getAll() {
    try {
      // Запрос без слеша в конце
      const res = await http.get('/slots'); 
      
      if (!res) return [];

      // Безопасное чтение массива
      const slotsData = res.data || [];
      const list = Array.isArray(slotsData) ? slotsData : [];

      return list.map(slot => ({
        id: slot.link || slot.id, // Сервер может возвращать id или link
        title: slot.slot_name,
        status: slot.status === 'active' ? 'active' : 'paused',
        createdAt: slot.created_at || new Date().toISOString(),
        displayNumber: 0 
      }));
    } catch (err) {
      console.error('Ошибка загрузки слотов:', err);
      return [];
    }
  }

async getById(id) {
    try {
      const res = await http.get(`/slots/${id}`);
      
      // ИСПРАВЛЕНИЕ: Если сервер не ответил или вернул null -> выходим
      if (!res) {
          console.error(`Слот с id=${id} не найден (пустой ответ)`);
          return null;
      }

      // Универсальное чтение
      const slot = res.data || res;

      // Если после всех попыток slot пустой
      if (!slot) return null;

      return {
        id: slot.link || slot.id,
        title: slot.slot_name,
        minPrice: slot.min_cost_adv,
        format: slot.format_of_banner,
        bgColor: slot.back_color,
        textColor: slot.text_color,
        status: slot.status,
        createdAt: slot.created_at
      };
    } catch (err) {
      console.error('Ошибка загрузки слота:', err);
      return null;
    }
  }

  async create(slotData) {
    const payload = {
      slot_name: slotData.title,
      min_cost_adv: Number(slotData.minPrice),
      format_of_banner: slotData.format,
      status: slotData.status,
      back_color: slotData.bgColor,
      text_color: slotData.textColor
    };

    try {
      // 1. Отправляем запрос
      const res = await http.post('/slots', payload);
      
      // 2. Достаем ID (ищем везде)
      const newId = res.id || res.data?.id || res.body?.id;

      if (!newId) {
          // Если ID нет, но запрос прошел - пробуем fallback, но лучше выкинуть ошибку
          throw new Error("Сервер не вернул ID слота");
      }
      
      // 3. Генерируем код, используя полученный ID
      const { code, link } = this._generateArtifacts(newId, payload.format_of_banner);

      return {
        success: true,
        // Собираем объект, который ждет страница
        slot: { id: newId, ...slotData },
        integrationCode: code,
        feedLink: link
      };
    } catch (err) {
      console.error('Ошибка создания:', err);
      throw err;
    }
  }

  async update(id, slotData) {
    const payload = {
      slot_name: slotData.title,
      min_cost_adv: Number(slotData.minPrice),
      format_of_banner: slotData.format,
      status: slotData.status,
      back_color: slotData.bgColor,
      text_color: slotData.textColor
    };

    try {
      await http.put(`/slots/${id}`, payload);
      return { id, ...slotData };
    } catch (err) {
      console.error('Ошибка обновления:', err);
      throw err;
    }
  }

  async delete(id) {
    try {
      await http.delete(`/slots/${id}`);
      return true;
    } catch (err) {
      console.error('Ошибка удаления:', err);
      throw err;
    }
  }

  async getIntegrationCode(id, format) {
      const { code } = this._generateArtifacts(id, format);
      return Promise.resolve(code);
  }

  // Генератор HTML кода iframe
  _generateArtifacts(uuid, format) {
      // Ссылка ведет на бэкенд (8080) /slots/serving/{uuid}
      // ВАЖНО: Путь должен совпадать с тем, что в slot_handler.go (ServeSlot)
      const iframeSrc = `${BASE}/slots/serving/${uuid}`;
      
      let w = '300';
      let h = '250';
      if (format === 'horizontal') { w = '320'; h = '100'; }
      if (format === 'vertical')   { w = '240'; h = '400'; }

      const code = `<iframe src="${iframeSrc}" width="${w}" height="${h}" frameborder="0" scrolling="no" style="border:none; overflow:hidden;"></iframe>`;
      const link = iframeSrc; 
      
      return { code, link };
  }
}

export const slotsRepository = new SlotsRepository();
export default slotsRepository;