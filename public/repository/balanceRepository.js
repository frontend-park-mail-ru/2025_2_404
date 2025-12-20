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
  let description = 'Операция';
  let type = 'positive'; 

  if (p.payment_method === 'ad_subtract') {
    type = 'negative';
    description = 'Списание по рекламной кампании';
  } 
  else if (p.payment_method === 'yooKassa') {
    type = 'positive';
    description = 'Пополнение счета (ЮKassa)';
  }
  else if (p.payment_method === 'ad_plus') {
    type = 'positive';
    description = 'Возврат по рекламной кампании';
  }
    else if (p.payment_method === 'subtract_balance') {
    type = 'negative';
    description = 'Вывод средств';
  }
  else if (amount < 0) {
    type = 'negative';
    description = 'Списание со счета';
  }
  else {
    type = 'positive';
    description = 'Пополнение счета';
  }

  const dateStr = p.created_at || p.date || new Date().toISOString();
  const dateObj = new Date(dateStr);

  return {
    id: p.ID, 
    date: dateStr,
    description: description,
    amount: Math.abs(amount),
    type: type,
    time: dateObj.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'}),
    status: p.status
  };
});

      transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

      return { balance, transactions };
    } catch (err) {
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