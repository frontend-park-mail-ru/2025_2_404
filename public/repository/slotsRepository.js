import { http, BASE } from '../api/http1.js';

class SlotsRepository {

  /**
   * 1. Получить список слотов
   * Бэк: GET /slots/ (или просто GET /)
   */
async getAll() {
    try {
      // ИСПРАВЛЕНИЕ 1: Убрали слеш (на всякий случай, если еще не убрали)
      const res = await http.get('/slots'); 
      
      // ИСПРАВЛЕНИЕ 2: Проверяем, что ответ вообще пришел
      if (!res) {
          console.warn("Сервер вернул пустой ответ для слотов");
          return [];
      }

      // ИСПРАВЛЕНИЕ 3: Безопасное чтение
      // Сначала проверяем, есть ли body/data, иначе берем сам res
      const slotsData = res.slots || res.data?.slots || res.body?.slots || res; 
      
      // Проверка, что это массив
      const list = Array.isArray(slotsData) ? slotsData : [];

      return list.map(slot => ({
        id: slot.link,                    
        title: slot.slot_name,
        status: slot.status === 'active' ? 'active' : 'paused', 
        createdAt: slot.created_at || new Date().toISOString(), 
        displayNumber: 0 
      }));
    } catch (err) {
      console.error('Ошибка загрузки слотов:', err);
      // Если сервер лежит (504), возвращаем пустой список, чтобы сайт не падал
      return [];
    }
  }

  /**
   * 2. Получить один слот
   * Бэк: GET /{uuid}
   */
  async getById(id) {
    try {
      const res = await http.get(`/slots/${id}`);
      const slot = res.body || res.data || res;

      return {
        id: slot.link,
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

  /**
   * 3. Создать слот
   * Бэк: POST / (c полями slot_name, back_color и т.д.)
   */
  async create(slotData) {
    const payload = {
      slot_name: slotData.title,
      min_cost_adv: Number(slotData.minPrice),
      format_of_banner: slotData.format,
      status: slotData.status,     // "active" или "paused"
      back_color: slotData.bgColor,
      text_color: slotData.textColor
    };

    try {
      const res = await http.post('/slots', payload);
      
      // Бэкенд должен вернуть созданный объект. Берем оттуда link (UUID).
      // Если структура ответа сложная (например { body: {...} }), поправь здесь.
      const createdSlot = res.body || res.data || res; 
      
      // Генерируем код iframe сразу
      const { code, link } = this._generateArtifacts(createdSlot.link, payload.format_of_banner);

      return {
        success: true,
        slot: { id: createdSlot.link, ...slotData },
        integrationCode: code,
        feedLink: link
      };
    } catch (err) {
      console.error('Ошибка создания:', err);
      throw err;
    }
  }

  /**
   * 4. Обновить слот
   * Бэк: PUT /{uuid}
   */
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

  /**
   * 5. Удалить слот
   * Бэк: DELETE /{uuid}
   */
  async delete(id) {
    try {
      await http.delete(`/slots/${id}`);
      return true;
    } catch (err) {
      console.error('Ошибка удаления:', err);
      throw err;
    }
  }

  /**
   * 6. Получить код (Локальная генерация)
   */
  async getIntegrationCode(id, format) {
      const { code } = this._generateArtifacts(id, format);
      return Promise.resolve(code);
  }

  /**
   * Вспомогательный метод для генерации строки Iframe
   */
  _generateArtifacts(uuid, format) {
      // ИСПРАВЛЕНО: Путь теперь /serving/ (без /ads)
      const iframeSrc = `${BASE}/serving/${uuid}`;
      
      let w = '300';
      let h = '250';
      if (format === 'horizontal') { w = '320'; h = '100'; }
      if (format === 'vertical')   { w = '240'; h = '400'; }

      const code = `<iframe src="${iframeSrc}" width="${w}" height="${h}" frameborder="0" scrolling="no" style="border:none; overflow:hidden;"></iframe>`;
      const link = `${BASE}/serving/${uuid}`; // Если прямая ссылка ведет туда же
      
      return { code, link };
  }
}

export const slotsRepository = new SlotsRepository();
export default slotsRepository;