import { http } from '../api/http1.js';

class BalanceRepository {
  // GET /balance
  async getBalanceAndTransactions() {
    try {
      const res = await http.get('/balance');
      
      // Структура ответа: { data: { balance: 100, payments: [...] }, message: "..." }
      if (!res || !res.data) {
          return { balance: 0, transactions: [] };
      }

      const balance = res.data.balance || 0;
      // Берем массив из res.data.payments
      const rawPayments = res.data.payments || [];
      
      // Преобразуем данные с бэкенда в формат для фронтенда
      const transactions = rawPayments.map(p => {
        const amount = p.amount || 0;
        
        // --- 1. Определение типа операции (Пополнение или Списание) ---
        // Если amount > 0 -> Пополнение. Если < 0 -> Списание.
        // Если с бэка приходят всегда положительные числа, нужна доп. логика (например, по type)
        const isPositive = amount > 0; 
        
        // --- 2. Формирование описания ---
        let description = 'Операция';

        // Если это пополнение через ЮКассу
        if (p.payment_method === 'yooKassa') {
            description = 'Пополнение счета (ЮKassa)';
        } 
        // Если есть название объявления (для списаний за рекламу)
        else if (p.ad_title) {
            description = `Списание по «${p.ad_title}»`;
        }
        // Если это вывод средств (обычно amount < 0)
        else if (amount < 0) {
             description = 'Списание со счета'; // Или 'Вывод средств', если есть такой статус
        }
        // Дефолтное для положительных
        else if (isPositive) {
            description = 'Пополнение счета';
        }

        // --- 3. Работа с датой ---
        // В вашем JSON примере ДАТЫ НЕТ. Используем created_at, если добавят, или текущую дату как заглушку.
        // ПОПРОСИТЕ БЭКЕНД ДОБАВИТЬ ПОЛЕ "created_at"!
        const dateStr = p.created_at || p.date || new Date().toISOString();
        const dateObj = new Date(dateStr);

        return {
          id: p.ID, // Бэк возвращает ID большими буквами
          date: dateStr,
          description: description,
          amount: Math.abs(amount), // Для отображения берем модуль числа
          type: isPositive ? 'positive' : 'negative', // Класс для цвета (зеленый/красный)
          time: dateObj.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'}),
          status: p.status // Можно использовать для показа статуса (succeeded/pending)
        };
      });

      // Сортируем: новые сверху (если даты одинаковые, порядок может сбиться)
      transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

      return { balance, transactions };
    } catch (err) {
      console.error('Ошибка загрузки баланса:', err);
      // Возвращаем нули, чтобы страница не падала
      return { balance: 0, transactions: [] };
    }
  }

  // POST /balance/payment
  async createPayment(amount) {
    const payload = {
      amount: parseInt(amount, 10),
      payment_method: 'yooKassa',
      return_url: `${window.location.origin}/balance`
    };
    return await http.post('/balance/payment', payload);
  }

  // Остальные методы (subtractBalance и т.д.) оставляем без изменений...
  async subtractBalance(amount) {
    const payload = { subtract_amount: parseInt(amount, 10) };
    return await http.post('/balance/subtract', payload);
  }
}

export const balanceRepository = new BalanceRepository();
export default balanceRepository;