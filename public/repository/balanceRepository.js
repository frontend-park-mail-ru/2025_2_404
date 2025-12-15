import { http } from '../api/http.js';

class BalanceRepository {
  async getBalanceAndTransactions() {
    try {
      const res = await http.get('/api/balance');
      if (!res || !res.data) {
          return { balance: 0, transactions: [] };
      }

      const balance = res.data.balance || 0;
      const rawPayments = res.data.payments || [];
      const transactions = rawPayments.map(p => {
        const amount = p.amount || 0;
        const isPositive = amount > 0; 
        let description = 'Операция';
        if (p.payment_method === 'yooKassa') {
            description = 'Пополнение счета (ЮKassa)';
        } 
        else if (p.ad_title) {
            description = `Списание по «${p.ad_title}»`;
        }
        else if (amount < 0) {
             description = 'Списание со счета';
        }
        else if (isPositive) {
            description = 'Пополнение счета';
        }

        const dateStr = p.created_at || p.date || new Date().toISOString();
        const dateObj = new Date(dateStr);

        return {
          id: p.ID, 
          date: dateStr,
          description: description,
          amount: Math.abs(amount), 
          type: isPositive ? 'positive' : 'negative',
          time: dateObj.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'}),
          status: p.status
        };
      });

      transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

      return { balance, transactions };
    } catch (err) {
      console.error('Ошибка загрузки баланса:', err);
      return { balance: 0, transactions: [] };
    }
  }

  async createPayment(amount) {
    const payload = {
      amount: parseInt(amount, 10),
      payment_method: 'yooKassa',
      return_url: `${window.location.origin}/balance`
    };
    return await http.post('/api/balance/payment', payload);
  }
  async subtractBalance(amount) {
    const payload = { subtract_amount: parseInt(amount, 10) };
    return await http.post('/api/balance/subtract', payload);
  }
}

export const balanceRepository = new BalanceRepository();
export default balanceRepository;