import AuthService from '../../services/ServiceAuthentification.js';
import balanceRepository from '../../public/repository/balanceRepository.js';
import { router } from '../../main.js';
import adsRepository from '../../public/repository/adsRepository.js';

const POLLING_INTERVAL = 20 * 1000;       // 20 секунд (частота проверки)
const THRESHOLD = 10;                     // 10 рублей (порог баланса)
const NOTIFICATION_COOLDOWN = 10 * 60 * 1000; // 10 минут (чтобы не спамить окнами)

export default class LowBalanceNotification {
  constructor() {
    this.intervalId = null;
    this.lastNotificationTime = 0;
    this.template = null;
    this.isModalOpen = false;
  }

  async loadTemplate() {
    if (this.template) return;
    try {
      const response = await fetch('/pages/components/LowBalanceNotification.hbs');
      if (!response.ok) throw new Error('Failed to load notification template');
      this.template = Handlebars.compile(await response.text());
    } catch (e) {
      console.error(e);
    }
  }

  init() {
    AuthService.onAuthChange((user) => {
      if (user) {
        this.startPolling();
      } else {
        this.stopPolling();
      }
    });
    if (AuthService.isAuthenticated()) {
      this.startPolling();
    }
  }

  startPolling() {
    if (this.intervalId) return;
    this.checkBalance();
    this.intervalId = setInterval(() => {
      this.checkBalance();
    }, POLLING_INTERVAL);
  }

  stopPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.closeModal();
  }

  async checkBalance() {
    if (this.isModalOpen) return;

    try {
      const data = await balanceRepository.getBalanceAndTransactions();
      const balance = data.balance;

      if (balance <= THRESHOLD) {
        try {
            const ads = await adsRepository.getAll();
            if (!ads || ads.length === 0) {
                return;
            }
        } catch (err) {
            console.warn("Не удалось проверить объявления, пропускаем уведомление", err);
            return;
        }

        const now = Date.now();
        if (now - this.lastNotificationTime > NOTIFICATION_COOLDOWN) {
          await this.showModal(balance);
          this.lastNotificationTime = now;
        }
      }
    } catch (error) {
      console.warn("Ошибка проверки баланса для уведомления:", error);
    }
  }

  async showModal(balance) {
    await this.loadTemplate();
    if (!this.template) return;

    const user = AuthService.getUser();
    const username = user ? user.username : 'Пользователь';
    const existing = document.getElementById('low-balance-overlay');
    if (existing) existing.remove();

    const html = this.template({
      username: username,
      balance: balance
    });
    document.body.insertAdjacentHTML('beforeend', html);
    setTimeout(() => {
        document.getElementById('low-balance-overlay')?.classList.add('show');
    }, 10);

    this.isModalOpen = true;
    this.attachEvents();
  }

  attachEvents() {
    const overlay = document.getElementById('low-balance-overlay');
    const closeBtn = document.getElementById('low-balance-close');
    const actionBtn = document.getElementById('low-balance-btn');

    const closeHandler = () => this.closeModal();
    
    if (closeBtn) closeBtn.addEventListener('click', closeHandler);
    
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          closeHandler();
        }
      });
    }
    
    if (actionBtn) {
      actionBtn.addEventListener('click', () => {
        this.closeModal();
        router.navigate('/balance'); 
      });
    }
  }

  closeModal() {
    const overlay = document.getElementById('low-balance-overlay');
    if (overlay) {
      overlay.classList.remove('show');
      setTimeout(() => {
          overlay.remove();
      }, 300);
    }
    this.isModalOpen = false;
  }
}