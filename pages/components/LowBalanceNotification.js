import AuthService from '../../services/ServiceAuthentification.js';
import balanceRepository from '../../public/repository/balanceRepository.js';
import { router } from '../../main.js';
import adsRepository from '../../public/repository/adsRepository.js';

const POLLING_INTERVAL = 20 * 1000; // 20 секунд
const NOTIFICATION_COOLDOWN = 10 * 60 * 1000; // 10 минут
const THRESHOLD = 10; // 10 рублей

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
      // Путь должен вести к файлу, который вы создали в шаге 1
      const response = await fetch('/pages/components/LowBalanceNotification.hbs');
      if (!response.ok) throw new Error('Failed to load notification template');
      this.template = Handlebars.compile(await response.text());
    } catch (e) {
      console.error(e);
    }
  }

  init() {
    // Подписываемся на изменения авторизации
    AuthService.onAuthChange((user) => {
      if (user) {
        this.startPolling();
      } else {
        this.stopPolling();
      }
    });

    // Если пользователь уже вошел при старте
    if (AuthService.isAuthenticated()) {
      this.startPolling();
    }
  }

  startPolling() {
    if (this.intervalId) return;
    
    console.log('🔔 Запущен мониторинг баланса');
    
    // Делаем первую проверку сразу
    this.checkBalance();

    // Запускаем интервал
    this.intervalId = setInterval(() => {
      this.checkBalance();
    }, POLLING_INTERVAL);
  }

  stopPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🔕 Мониторинг баланса остановлен');
    }
    this.closeModal(); // Закрываем, если пользователь вышел
  }

async checkBalance() {
    // Не спамим, если модалка уже открыта
    if (this.isModalOpen) return;

    try {
      const data = await balanceRepository.getBalanceAndTransactions();
      const balance = data.balance;

      if (balance <= THRESHOLD) {
        
        // --- НОВАЯ ПРОВЕРКА: ЕСТЬ ЛИ ОБЪЯВЛЕНИЯ? ---
        try {
            // Запрашиваем список всех объявлений
            const ads = await adsRepository.getAll();
            
            // Если массив пустой или null -> у пользователя нет рекламы -> выходим
            if (!ads || ads.length === 0) {
                console.log('📉 Баланс низкий, но объявлений нет. Уведомление скрыто.');
                return;
            }
        } catch (err) {
            console.warn("Не удалось проверить объявления, пропускаем уведомление", err);
            return;
        }
        // -------------------------------------------

        const now = Date.now();
        // Проверяем кулдаун (10 минут)
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
    // Если по какой-то причине user еще не подгружен, пробуем username из кэша или generic
    const username = user ? user.username : 'Пользователь';

    // Удаляем старое уведомление из DOM, если вдруг осталось
    const existing = document.getElementById('low-balance-overlay');
    if (existing) existing.remove();

    const html = this.template({
      username: username,
      balance: balance
    });

    // Вставляем в body
    document.body.insertAdjacentHTML('beforeend', html);
    
    // Анимация появления (небольшой таймаут для CSS transition)
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

    // Закрытие по крестику
    if (closeBtn) closeBtn.addEventListener('click', closeHandler);
    
    // Закрытие по клику на фон (overlay)
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        // Проверяем, что кликнули именно по фону, а не по контенту внутри
        if (e.target === overlay) {
          closeHandler();
        }
      });
    }

    // Кнопка действия
    if (actionBtn) {
      actionBtn.addEventListener('click', () => {
        this.closeModal();
        router.navigate('/balance'); // Переход на страницу баланса
      });
    }
  }

  closeModal() {
    const overlay = document.getElementById('low-balance-overlay');
    if (overlay) {
      overlay.classList.remove('show');
      // Ждем окончания CSS анимации перед удалением
      setTimeout(() => {
          overlay.remove();
      }, 300);
    }
    this.isModalOpen = false;
  }
}