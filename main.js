import Router from './services/Router.js';
import Header from './pages/header/Header.js';
import Footer from './pages/footer/Footer.js';
import SupportWidget from './pages/components/SupportWidget.js';
import AuthService from './services/ServiceAuthentification.js';
// Импорт страниц
import LowBalanceNotification from './pages/components/LowBalanceNotification.js';
import MainPage from './pages/main/MainPage.js';
import ProfilePage from './pages/profile/ProfilePage.js';
import ProjectsPage from './pages/projects/ProjectsPage.js';
import ProjectDetailPage from './pages/projects/ProjectDetailPage.js';
import CreateProjectPage from './pages/projects/CreateProjectPage.js';
import SlotDetailPage from './pages/slots/SlotDetailPage.js';
import CreateSlotPage from './pages/slots/CreateSlotPage.js';
import BalancePage from './pages/balance/BalancePage.js';
import LoginPage from './pages/login/LoginPage.js';
import RegisterPage from './pages/register/Register.js';
// const offlineIndicator = document.getElementById('offline-indicator');

// function updateOnlineStatus() {
//   if (navigator.onLine) {
//     offlineIndicator.classList.add('hidden');
//   } else {
//     offlineIndicator.classList.remove('hidden');
//   }
// }

// window.addEventListener('online', updateOnlineStatus);
// window.addEventListener('offline', updateOnlineStatus);

// Вызываем функцию при первой загрузке, чтобы установить начальное состояние
// updateOnlineStatus();
Handlebars.registerHelper('formatDate', function (dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('ru-RU');
});

const appContainer = document.getElementById('app');
const routes = {
  '/': MainPage,
  '/profile': ProfilePage,
  '/projects': ProjectsPage,
  '/projects/create': CreateProjectPage,
  '/projects/:id': ProjectDetailPage,
  '/balance': BalancePage,
  '/slots': ProjectsPage,
  '/slots/create': CreateSlotPage,
  '/slots/:id': SlotDetailPage,
};

export const router = new Router(routes, appContainer);
export const header = new Header();
const footer = new Footer();

function onAuthSuccess() {
  router.navigate('/projects');
}

let loginModal = null;
let registerModal = null;

function showLoginModal() {
  if (registerModal) registerModal.hide();
  if (loginModal) return;
  loginModal = new LoginPage({
    onSuccess: () => {
      loginModal?.hide();
      loginModal = null;
      onAuthSuccess();
    },
    onCancel: () => { loginModal?.hide(); loginModal = null; },
    onSwitchToRegister: () => {
      loginModal?.hide();
      loginModal = null;
      showRegisterModal();
    }
  });
  loginModal.init().then(() => loginModal.show());
}

export function showRegisterModal() {
  if (loginModal) loginModal.hide();
  if (registerModal) return;
  registerModal = new RegisterPage({
    onSuccess: () => {
      registerModal?.hide();
      registerModal = null;
      onAuthSuccess();
    },
    onCancel: () => { registerModal?.hide(); registerModal = null; },
    onSwitchToLogin: () => {
      registerModal?.hide();
      registerModal = null;
      showLoginModal();
    }
  });
  registerModal.init().then(() => registerModal.show());
}

async function startApp() {
  await Promise.all([
    header.loadTemplate(),
    footer.loadTemplate()
  ]);
  document.body.prepend(header.render());
  document.body.appendChild(footer.render());
  
  const supportWidget = new SupportWidget();
  supportWidget.init();

  // Инициализация уведомления о низком балансе
  const lowBalanceNotification = new LowBalanceNotification();
  
  // Подписываемся на изменения авторизации
  AuthService.onAuthChange((user) => {
    // 1. Обновляем Header
    header.update(user);
    
    // 2. Запускаем или останавливаем проверку баланса
    if (user) {
        lowBalanceNotification.startPolling();
    } else {
        lowBalanceNotification.stopPolling();
    }
  });

  document.addEventListener('click', (e) => {
    const target = e.target;

    if (target.closest('#login-btn-header')) {
      e.preventDefault();
      showLoginModal();
    } else if (target.closest('#register-btn-header')) {
      e.preventDefault();
      showRegisterModal();
    } else if (
      target.closest('#logout-btn') ||
      target.closest('#profile-logout')
    ) {
      e.preventDefault();
      AuthService.logout();
      router.navigate('/');
    }
  });
  
  await AuthService.loadProfile();
  
  if (AuthService.isAuthenticated() && window.location.pathname === '/') {
    router.navigate('/projects');
  } else {
    router.loadRoute();
  }
}

startApp();


// startApp();

// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/service-worker.js')
//       .catch(error => {
//         console.error('Ошибка регистрации Service Worker:', error);
//       });
//   });
// }