import { http } from '../api/http1.js';

class BalanceRepository {
  // GET /balance
  // Получает текущий баланс и список транзакций
  async getBalanceAndTransactions() {
    try {
      // Убираем слеш в конце, чтобы не было редиректа
      const res = await http.get('/balance');
      
      if (!res) return { balance: 0, transactions: [] };

      // Читаем баланс (ищем везде)
      const balance = res.balance || res.data?.balance || 0;
      
      // Читаем транзакции (если сервер их возвращает в этом же запросе)
      // Если сервер возвращает только баланс, транзакции останутся пустыми []
      const transactionsRaw = res.transactions || res.data?.transactions || [];
      
      // Мапим транзакции в формат для фронтенда
      const transactions = transactionsRaw.map(t => ({
        id: t.id,
        date: t.created_at || t.date || new Date().toISOString(),
        description: t.description || 'Операция',
        amount: t.amount, // Предполагаем, что сервер шлет строку "-100" или число
        type: (t.amount && String(t.amount).startsWith('-')) ? 'negative' : 'positive',
        // Форматируем время для отображения
        time: new Date(t.created_at || t.date).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})
      }));

      return { balance, transactions };
    } catch (err) {
      console.error('Ошибка загрузки баланса:', err);
      throw err; // Пробрасываем ошибку, чтобы Page мог взять данные из кэша
    }
  }

  // POST /balance/add
  async addBalance(amount) {
    // Согласно вашей Go-структуре BalanceOp, поле называется add_amount
    const payload = {
      add_amount: parseInt(amount, 10)
    };
    return await http.post('/balance/add', payload);
  }

  // POST /balance/subtract
  async subtractBalance(amount) {
    // Согласно вашей Go-структуре BalanceOp, поле называется subtract_amount
    const payload = {
        subtract_amount: parseInt(amount, 10)
    };
    return await http.post('/balance/subtract', payload);
  }
}

export const balanceRepository = new BalanceRepository();
export default balanceRepository;