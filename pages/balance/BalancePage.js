import AuthService from '../../services/ServiceAuthentification.js';
import { router } from '../../main.js';
import AddFundsModal from '../components/modals/AddFundsModal.js';
import WithdrawModal from '../components/modals/WithdrawModal.js';
import { DBService } from '../../services/DataBaseService.js';

export default class BalancePage {
  constructor() {
    this.template = null;
    this.transactionTemplate = null;
    this.flatpickrInstance = null;
    this.balance = 0;
    this.allTransactions = [];
    this.currentTransactions = [];
    this.selectedDates = null;
    this.currentPage = 1;
    this.itemsPerPage = 5;
  }

  async loadTemplate() {
    if (this.template) return;
    Handlebars.registerHelper('eq', (a, b) => a === b);
    try {
      const response = await fetch('/pages/balance/BalancePage.hbs');
      if (!response.ok) throw new Error('Не удалось загрузить шаблон BalancePage');
      this.template = Handlebars.compile(await response.text());
      
      const transactionTemplateString = `
        {{#each transactionGroups}}
          <div class="history-group">
            <h3>{{this.title}}</h3>
            {{#each this.items}}
              <div class="transaction-item">
                <div class="transaction-details">
                  <span class="description">{{this.description}}</span>
                  <span class="time">{{this.time}}</span>
                </div>
                <span class="transaction-amount {{#if (eq this.type "positive")}}positive{{else}}negative{{/if}}">{{this.amount}} ₽</span>
              </div>
            {{/each}}
          </div>
        {{else}}
          <p style="text-align: center; color: var(--gray-text); margin: 40px 0;">За выбранный период операций не найдено.</p>
        {{/each}}`;
      this.transactionTemplate = Handlebars.compile(transactionTemplateString);
    } catch (error) {
      console.error(error);
      this.template = Handlebars.compile('<h1>Ошибка загрузки страницы баланса</h1>');
    }
  }
  async fetchFromServer() {
    return new Promise(resolve => {
        setTimeout(() => {
            const serverData = {
              balance: Math.floor(20000 + Math.random() * 5000), 
              allTransactions: [
                { id: 1, date: '2025-10-27T12:48:34Z', description: 'Пополнение через СБП', amount: '+25000', type: 'positive' },
                { id: 2, date: '2025-10-26T13:28:35Z', description: 'Оплата Рекламное объявление №1', amount: '-25000', type: 'negative' },
                { id: 3, date: '2025-10-26T10:00:00Z', description: 'Покупка лицензии', amount: '-10000', type: 'negative' },
                { id: 4, date: '2025-09-10T18:00:12Z', description: 'Пополнение баланса', amount: '+50000', type: 'positive' },
              ].map(t => ({...t, time: new Date(t.date).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}))
            };
            resolve(serverData);
        }, 1000);
    });
  }

  async render() {
    if (!AuthService.isAuthenticated()) {
      router.navigate('/');
      return '<div>Доступ запрещен.</div>';
    }
    await this.loadTemplate();
    const cachedBalance = await DBService.getBalance();
    this.balance = cachedBalance;
    return this.template({ balance: this.balance.toLocaleString('ru-RU') });
  }

  async attachEvents() {
    this.initCalendar();
    document.getElementById('reset-filter-btn')?.addEventListener('click', () => this.resetFilter());
    this.attachActionButtons();
    this.balance = await DBService.getBalance();
    this.allTransactions = await DBService.getAllTransactions();
    this.updateDisplay();
    try {
      const serverData = await this.fetchFromServer();
      await DBService.saveBalance(parseInt(serverData.balance, 10));
      await DBService.saveAllTransactions(serverData.allTransactions);
      this.balance = parseInt(serverData.balance, 10);
      this.allTransactions = serverData.allTransactions;
      this.updateDisplay();
    } catch (error) {
      console.warn("Не удалось получить свежие данные с сервера. Работаем с кэшем.", error);
    }
  }
  async attachEvents() {
    this.initCalendar();
    document.getElementById('reset-filter-btn')?.addEventListener('click', () => this.resetFilter());
    this.attachActionButtons();

    try {
      const serverData = await this.fetchFromServer();
      this.balance = serverData.balance;
      this.allTransactions = serverData.allTransactions;
    } catch (error) {
      console.warn(error.message, "Загружаем данные из локального кэша (IndexedDB).");
      this.balance = await DBService.getBalance();
      this.allTransactions = await DBService.getAllTransactions();
    } finally {
      this.updateDisplay();
    }
  }

  attachActionButtons() {
    document.getElementById('add-funds-btn')?.addEventListener('click', () => {
      const modal = new AddFundsModal({
        onConfirm: async (amount) => {
          this.balance += amount;
          const newTransaction = {
            date: new Date().toISOString(),
            description: `Пополнение баланса`,
            time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
            amount: `+${amount.toLocaleString('ru-RU')}`,
            type: 'positive'
          };
          
          await DBService.addTransaction(newTransaction);
          await DBService.saveBalance(this.balance);
          this.allTransactions.unshift(newTransaction);
          this.updateDisplay();
        },
      });
      modal.show();
    });

    document.getElementById('withdraw-btn')?.addEventListener('click', () => {
        const modal = new WithdrawModal({
            balance: this.balance,
            onConfirm: async (amount) => {
                this.balance -= amount;
                const newTransaction = {
                    date: new Date().toISOString(),
                    description: `Вывод средств`,
                    time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
                    amount: `-${amount.toLocaleString('ru-RU')}`,
                    type: 'negative'
                };

                await DBService.addTransaction(newTransaction);
                await DBService.saveBalance(this.balance);
                this.allTransactions.unshift(newTransaction);
                this.updateDisplay();
            },
        });
        modal.show();
    });
  }

  updateDisplay() {
    const balanceAmountEl = document.querySelector('.current-balance .amount');
    if (balanceAmountEl) {
        balanceAmountEl.textContent = `${this.balance.toLocaleString('ru-RU')} ₽`;
    }
    
    this.currentTransactions = this.selectedDates
      ? this.allTransactions.filter(transaction => {
          const transactionDate = new Date(transaction.date);
          transactionDate.setHours(0, 0, 0, 0);
          const startDate = new Date(this.selectedDates[0]);
          startDate.setHours(0, 0, 0, 0);
          const endDate = this.selectedDates.length > 1 ? new Date(this.selectedDates[1]) : startDate;
          endDate.setHours(0, 0, 0, 0);
          return transactionDate >= startDate && transactionDate <= endDate;
        })
      : this.allTransactions;

    this.calculateAndRenderSummary();

    const paginatedItems = this.currentTransactions.slice(
      (this.currentPage - 1) * this.itemsPerPage,
      this.currentPage * this.itemsPerPage
    );

    const groupedData = this.groupTransactionsByDate(paginatedItems);
    this.renderTransactionList(groupedData);
    this.renderPagination();
  }

  calculateAndRenderSummary() {
    let totalSpent = 0;
    let totalEarned = 0;

    this.currentTransactions.forEach(t => {
      if (typeof t.amount !== 'string') {
        console.error("Транзакция без 'amount' или 'amount' не является строкой:", t);
        return; 
      }
      const amountString = t.amount.replace(/[+\s]/g, '');
      const amount = parseInt(amountString, 10);
      
      if (isNaN(amount)) {
          console.error("Не удалось спарсить 'amount' в число:", t);
          return;
      }

      if (t.type === 'negative') {
        totalSpent += Math.abs(amount);
      } else {
        totalEarned += amount;
      }
    });

    const totalTransactionsValue = totalSpent + totalEarned;
    const spentPercentage = totalTransactionsValue > 0 ? (totalSpent / totalTransactionsValue) * 100 : 0;
    const earnedPercentage = totalTransactionsValue > 0 ? (totalEarned / totalTransactionsValue) * 100 : 0;

    document.getElementById('summary-spent').innerText = `${totalSpent.toLocaleString('ru-RU')} ₽`;
    document.getElementById('summary-earned').innerText = `${totalEarned.toLocaleString('ru-RU')} ₽`;
    document.getElementById('spent-progress').style.width = `${spentPercentage}%`;
    document.getElementById('earned-progress').style.width = `${earnedPercentage}%`;

    const dateRangeEl = document.getElementById('summary-date-range');
    const dateRangeElEarned = document.getElementById('summary-date-range-earned');
    if (this.selectedDates && this.selectedDates.length > 0) {
        const start = flatpickr.formatDate(this.selectedDates[0], "d.m.Y");
        const end = this.selectedDates.length > 1 ? flatpickr.formatDate(this.selectedDates[1], "d.m.Y") : start;
        const dateText = start === end ? start : `${start} – ${end}`;
        dateRangeEl.innerText = dateText;
        dateRangeElEarned.innerText = dateText;
    } else {
        dateRangeEl.innerText = 'За все время';
        dateRangeElEarned.innerText = 'За все время';
    }
  }

  renderTransactionList(groupedData) {
    const container = document.getElementById('transaction-list-container');
    if (container && this.transactionTemplate) {
      container.innerHTML = this.transactionTemplate({ transactionGroups: groupedData });
    }
  }

  renderPagination() {
    const container = document.getElementById('pagination-container');
    if (!container) return;

    const totalPages = Math.ceil(this.currentTransactions.length / this.itemsPerPage);
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let paginationHTML = '';
    for (let i = 1; i <= totalPages; i++) {
      paginationHTML += `<button class="pagination__item ${i === this.currentPage ? 'pagination__item--active' : ''}" data-page="${i}">${i}</button>`;
    }
    container.innerHTML = paginationHTML;

    container.querySelectorAll('.pagination__item').forEach(button => {
      button.addEventListener('click', (e) => {
        this.currentPage = parseInt(e.target.dataset.page, 10);
        this.updateDisplay();
      });
    });
  }

  initCalendar() {
    flatpickr.localize(flatpickr.l10ns.ru);
    const datePickerButton = document.getElementById('date-range-picker');
    const resetBtn = document.getElementById('reset-filter-btn');

    if (datePickerButton) {
      this.flatpickrInstance = flatpickr(datePickerButton, {
        mode: "range",
        dateFormat: "Y-m-d",
        onClose: (selectedDates) => {
          if (selectedDates.length > 0) {
            this.selectedDates = selectedDates;
            this.currentPage = 1;
            
            const start = flatpickr.formatDate(selectedDates[0], "d.m.Y");
            const end = selectedDates.length > 1 ? flatpickr.formatDate(selectedDates[1], "d.m.Y") : start;
            datePickerButton.innerHTML = `    <svg width="18" height="20" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.0833 1.25V4.58333M5.41667 1.25V4.58333M1.25 7.91667H16.25M2.91667 2.91667H14.5833C15.5038 2.91667 16.25 3.66286 16.25 4.58333V16.25C16.25 17.1705 15.5038 17.9167 14.5833 17.9167H2.91667C1.99619 17.9167 1.25 17.1705 1.25 16.25V4.58333C1.25 3.66286 1.99619 2.91667 2.91667 2.91667Z" stroke="#F3F3F3" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg> ${start} - ${end}`; 
            resetBtn.style.display = 'inline-block';

            this.updateDisplay();
          }
        }
      });
    }
  }

  resetFilter() {
    this.selectedDates = null;
    this.currentPage = 1;

    const datePickerButton = document.getElementById('date-range-picker');
    if (datePickerButton) {
        datePickerButton.innerHTML = '<svg width="18" height="20" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.0833 1.25V4.58333M5.41667 1.25V4.58333M1.25 7.91667H16.25M2.91667 2.91667H14.5833C15.5038 2.91667 16.25 3.66286 16.25 4.58333V16.25C16.25 17.1705 15.5038 17.9167 14.5833 17.9167H2.91667C1.99619 17.9167 1.25 17.1705 1.25 16.25V4.58333C1.25 3.66286 1.99619 2.91667 2.91667 2.91667Z" stroke="#F3F3F3" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Выберите период';
    }
    document.getElementById('reset-filter-btn').style.display = 'none';

    if (this.flatpickrInstance) {
        this.flatpickrInstance.clear();
    }
    this.updateDisplay();
  }

  groupTransactionsByDate(transactions) {
    if (!transactions || transactions.length === 0) return [];

    const groups = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    transactions.forEach(t => {
      const transactionDate = new Date(t.date);
      transactionDate.setHours(0, 0, 0, 0);
      let title = '';

      if (transactionDate.getTime() === today.getTime()) {
        title = 'Сегодня';
      } else if (transactionDate.getTime() === yesterday.getTime()) {
        title = 'Вчера';
      } else {
        title = transactionDate.toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long'
        });
      }

      if (!groups[title]) {
        groups[title] = [];
      }
      groups[title].push(t);
    });

    return Object.entries(groups).map(([title, items]) => ({ title, items }));
  }
}