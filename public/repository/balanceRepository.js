import { http } from '../api/http1.js';

class BalanceRepository {
  // GET /balance
  async getBalanceAndTransactions() {
    try {
      const res = await http.get('/balance');
      if (!res) return { balance: 0, transactions: [] };

      const balance = res.balance || res.data?.balance || 0;
      const transactionsRaw = res.transactions || res.data?.transactions || [];
      
      const transactions = transactionsRaw.map(t => ({
        id: t.id,
        date: t.created_at || t.date || new Date().toISOString(),
        description: t.description || 'Операция',
        amount: t.amount,
        type: (t.amount && String(t.amount).startsWith('-')) ? 'negative' : 'positive',
        time: new Date(t.created_at || t.date).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})
      }));

      return { balance, transactions };
    } catch (err) {
      console.error('Ошибка загрузки баланса:', err);
      throw err;
    }
  }

  // --- ЭТО НУЖНО ДОБАВИТЬ ---
  // POST /balance/payment
  // Создает платежную сессию и возвращает ссылку на оплату
  async createPayment(amount) {
    const payload = {
      // Бэкенд скорее всего ждет 'amount'.
      // Если не заработает, попробуйте 'add_amount', как в методе ниже.
      amount: parseInt(amount, 10) 
    };
    // Ожидаем, что бэк вернет объект вида { "url": "https://yoomoney.ru/..." }
    return await http.post('/balance/payment', payload);
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