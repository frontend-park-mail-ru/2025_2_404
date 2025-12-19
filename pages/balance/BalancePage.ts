import AuthService from '../../services/ServiceAuthentification';
import AddFundsModal from '../components/modals/AddFundsModal';
import WithdrawModal from '../components/modals/WithdrawModal';
import { DBService } from '../../services/DataBaseService';
import type { 
  HandlebarsTemplateDelegate, 
  Transaction, 
  TransactionGroup,
  PageComponent,
  FlatpickrInstance 
} from '../../src/types';
import type Router from '../../services/Router';

let routerInstance: Router | null = null;

export function setBalanceRouter(r: Router): void {
  routerInstance = r;
}

interface ServerData {
  balance: number;
  transactions: Transaction[];
}

interface BalanceRepositoryType {
  getBalanceAndTransactions: () => Promise<ServerData>;
  createPayment: (amount: number) => Promise<{ data?: { payment_url?: string }; payment_url?: string }>;
  subtractBalance: (amount: number) => Promise<void>;
}

async function getBalanceRepository(): Promise<BalanceRepositoryType> {
  const module = await import('../../public/repository/balanceRepository.js');
  return module.default as BalanceRepositoryType;
}

export default class BalancePage implements PageComponent {
  template: HandlebarsTemplateDelegate | null = null;
  transactionTemplate: HandlebarsTemplateDelegate | null = null;
  flatpickrInstance: FlatpickrInstance | null = null;
  balance = 0;
  allTransactions: Transaction[] = [];
  currentTransactions: Transaction[] = [];
  selectedDates: Date[] | null = null;
  currentPage = 1;
  itemsPerPage = 5;

  constructor() {}

  async loadTemplate(): Promise<void> {
    if (this.template) return;
    Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
    try {
      const response = await fetch('/pages/balance/BalancePage.hbs');
      if (!response.ok) throw new Error('Не удалось загрузить шаблон BalancePage');
      this.template = Handlebars.compile(await response.text());

      const transactionTemplateString = `
        {{#each transactionGroups}}
          <div class="transactions">
            <h3>{{this.title}}</h3>
            {{#each this.items}}
              <div class="transactions__item">
                <div>
                  <span class="transactions__description">{{this.description}}</span>
                  <span class="transactions__time">{{this.time}}</span>
                </div>
                <span class="transactions__amount {{#if (eq this.type "positive")}}transactions__amount--positive{{else}}transactions__amount--negative{{/if}}">{{this.amount}} ₽</span>
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

  async render(): Promise<string> {
    if (!AuthService.isAuthenticated()) {
      routerInstance?.navigate('/');
      return '<div>Доступ запрещен.</div>';
    }
    await this.loadTemplate();
    const cachedBalance = await DBService.getBalance();
    this.balance = cachedBalance || 0;
    return this.template ? this.template({ balance: this.balance.toLocaleString('ru-RU') }) : '';
  }

  async attachEvents(): Promise<void> {
    this.initCalendar();
    document.getElementById('reset-filter-btn')?.addEventListener('click', () => this.resetFilter());
    this.attachActionButtons();

    try {
      this.balance = await DBService.getBalance() || 0;
      this.allTransactions = await DBService.getAllTransactions() || [];
      this.updateDisplay();
    } catch (e) {
      console.error("Ошибка чтения кэша", e);
    }

    await this.refreshData();
  }

  async refreshData(): Promise<void> {
    try {
      const balanceRepository = await getBalanceRepository();
      const serverData = await balanceRepository.getBalanceAndTransactions();
      
      this.balance = serverData.balance;
      this.allTransactions = serverData.transactions || [];
      
      await DBService.saveBalance(this.balance);
      await DBService.saveAllTransactions(this.allTransactions);
      
      this.updateDisplay();
    } catch (e) {
      console.error("Не удалось обновить данные после операции", e);
    }
  }

  attachActionButtons(): void {
    document.getElementById('add-funds-btn')?.addEventListener('click', () => {
      const modal = new AddFundsModal({
        onConfirm: async (amount: number) => {
          try {
            const balanceRepository = await getBalanceRepository();
            const response = await balanceRepository.createPayment(amount);
            const paymentUrl = response.data?.payment_url || response.payment_url;

            if (paymentUrl) {
              window.location.href = paymentUrl;
            } else {
            }
          } catch (error) {
            console.error(error);
          }
        },
      });
      modal.show();
    });

    document.getElementById('withdraw-btn')?.addEventListener('click', () => {
      const modal = new WithdrawModal({
        balance: this.balance,
        onConfirm: async (amount: number) => {
          try {
            const balanceRepository = await getBalanceRepository();
            await balanceRepository.subtractBalance(amount);
            await this.refreshData();
          } catch (error) {
            console.error(error);
          }
        },
      });
      modal.show();
    });
  }

  updateDisplay(): void {
    const balanceAmountEl = document.querySelector('.balance__amount');
    if (balanceAmountEl) {
      balanceAmountEl.textContent = `${this.balance.toLocaleString('ru-RU')} ₽`;
    }

    this.currentTransactions = this.selectedDates
      ? this.allTransactions.filter(transaction => {
          const transactionDate = new Date(transaction.date);
          transactionDate.setHours(0, 0, 0, 0);
          const startDate = new Date(this.selectedDates![0]);
          startDate.setHours(0, 0, 0, 0);
          const endDate = this.selectedDates!.length > 1 ? new Date(this.selectedDates![1]) : startDate;
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

  calculateAndRenderSummary(): void {
    let totalSpent = 0;
    let totalEarned = 0;

    this.currentTransactions.forEach(t => {
      let amount = t.amount;
      if (typeof amount === 'string') {
        amount = parseInt((amount as string).replace(/[+\s]/g, ''), 10);
      }
      if (typeof amount !== 'number' || isNaN(amount)) return;

      if (t.type === 'negative') {
        totalSpent += Math.abs(amount);
      } else {
        totalEarned += amount;
      }
    });

    const totalTransactionsValue = totalSpent + totalEarned;
    const spentPercentage = totalTransactionsValue > 0 ? (totalSpent / totalTransactionsValue) * 100 : 0;
    const earnedPercentage = totalTransactionsValue > 0 ? (totalEarned / totalTransactionsValue) * 100 : 0;

    const summarySpent = document.getElementById('summary-spent');
    const summaryEarned = document.getElementById('summary-earned');
    const spentProgress = document.getElementById('spent-progress');
    const earnedProgress = document.getElementById('earned-progress');

    if (summarySpent) summarySpent.innerText = `${totalSpent.toLocaleString('ru-RU')} ₽`;
    if (summaryEarned) summaryEarned.innerText = `${totalEarned.toLocaleString('ru-RU')} ₽`;
    if (spentProgress) spentProgress.style.width = `${spentPercentage}%`;
    if (earnedProgress) earnedProgress.style.width = `${earnedPercentage}%`;

    const dateRangeEl = document.getElementById('summary-date-range');
    const dateRangeElEarned = document.getElementById('summary-date-range-earned');
    
    if (this.selectedDates && this.selectedDates.length > 0) {
      const start = flatpickr.formatDate(this.selectedDates[0], "d.m.Y");
      const end = this.selectedDates.length > 1 ? flatpickr.formatDate(this.selectedDates[1], "d.m.Y") : start;
      const dateText = start === end ? start : `${start} – ${end}`;
      if (dateRangeEl) dateRangeEl.innerText = dateText;
      if (dateRangeElEarned) dateRangeElEarned.innerText = dateText;
    } else {
      if (dateRangeEl) dateRangeEl.innerText = 'За все время';
      if (dateRangeElEarned) dateRangeElEarned.innerText = 'За все время';
    }
  }

  renderTransactionList(groupedData: TransactionGroup[]): void {
    const container = document.getElementById('transaction-list-container');
    if (container && this.transactionTemplate) {
      container.innerHTML = this.transactionTemplate({ transactionGroups: groupedData });
    }
  }

  renderPagination(): void {
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
        const target = e.target as HTMLElement;
        this.currentPage = parseInt(target.dataset.page || '1', 10);
        this.updateDisplay();
      });
    });
  }

  initCalendar(): void {
    flatpickr.localize(flatpickr.l10ns.ru);
    const datePickerButton = document.getElementById('date-range-picker');
    const resetBtn = document.getElementById('reset-filter-btn');

    if (datePickerButton) {
      this.flatpickrInstance = flatpickr(datePickerButton, {
        mode: "range",
        dateFormat: "Y-m-d",
        onClose: (selectedDates: Date[]) => {
          if (selectedDates.length > 0) {
            this.selectedDates = selectedDates;
            this.currentPage = 1;

            const start = flatpickr.formatDate(selectedDates[0], "d.m.Y");
            const end = selectedDates.length > 1 ? flatpickr.formatDate(selectedDates[1], "d.m.Y") : start;
            datePickerButton.innerHTML = `<svg width="18" height="20" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.0833 1.25V4.58333M5.41667 1.25V4.58333M1.25 7.91667H16.25M2.91667 2.91667H14.5833C15.5038 2.91667 16.25 3.66286 16.25 4.58333V16.25C16.25 17.1705 15.5038 17.9167 14.5833 17.9167H2.91667C1.99619 17.9167 1.25 17.1705 1.25 16.25V4.58333C1.25 3.66286 1.99619 2.91667 2.91667 2.91667Z" stroke="#F3F3F3" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg> ${start} - ${end}`;
            if (resetBtn) resetBtn.style.display = 'inline-block';

            this.updateDisplay();
          }
        }
      });
    }
  }

  resetFilter(): void {
    this.selectedDates = null;
    this.currentPage = 1;

    const datePickerButton = document.getElementById('date-range-picker');
    if (datePickerButton) {
      datePickerButton.innerHTML = '<svg width="18" height="20" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.0833 1.25V4.58333M5.41667 1.25V4.58333M1.25 7.91667H16.25M2.91667 2.91667H14.5833C15.5038 2.91667 16.25 3.66286 16.25 4.58333V16.25C16.25 17.1705 15.5038 17.9167 14.5833 17.9167H2.91667C1.99619 17.9167 1.25 17.1705 1.25 16.25V4.58333C1.25 3.66286 1.99619 2.91667 2.91667 2.91667Z" stroke="#F3F3F3" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Выберите период';
    }
    const resetBtn = document.getElementById('reset-filter-btn');
    if (resetBtn) resetBtn.style.display = 'none';

    if (this.flatpickrInstance) {
      this.flatpickrInstance.clear();
    }
    this.updateDisplay();
  }

  groupTransactionsByDate(transactions: Transaction[]): TransactionGroup[] {
    if (!transactions || transactions.length === 0) return [];

    const groups: Record<string, Transaction[]> = {};
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
