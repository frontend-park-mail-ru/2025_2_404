import { http } from '../api/http1.js';

class BalanceRepository {
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
  async addBalance(amount) {
    const payload = {
      add_amount: parseInt(amount, 10)
    };
    return await http.post('/balance/add', payload);
  }
  async subtractBalance(amount) {
    const payload = {
        subtract_amount: parseInt(amount, 10)
    };
    return await http.post('/balance/subtract', payload);
  }
}

export const balanceRepository = new BalanceRepository();
export default balanceRepository;