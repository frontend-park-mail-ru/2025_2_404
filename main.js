import Router from './services/Router.js';
import Header from './pages/header/Header.js';
import Footer from './pages/footer/Footer.js';
import SupportWidget from './pages/components/SupportWidget.js';
import AuthService from './services/ServiceAuthentification.js';

// Импорт страниц
import MainPage from './pages/main/MainPage.js';
import ProfilePage from './pages/profile/ProfilePage.js';
import ProjectsPage from './pages/projects/ProjectsPage.js';
import ProjectDetailPage from './pages/projects/ProjectDetailPage.js';
import CreateProjectPage from './pages/projects/CreateProjectPage.js';
import BalancePage from './pages/balance/BalancePage.js';
import LoginPage from './pages/login/LoginPage.js';
import RegisterPage from './pages/register/Register.js';

const offlineIndicator = document.getElementById('offline-indicator');

function updateOnlineStatus() {
  if (navigator.onLine) {
    offlineIndicator.classList.add('hidden');
  } else {
    offlineIndicator.classList.remove('hidden');
  }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

updateOnlineStatus();
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Регистрируем только если мы не на localhost (продакшен)
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('ServiceWorker registration successful');
        })
        .catch(error => {
          console.log('ServiceWorker registration failed: ', error);
        });
    }
  });
}
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
};

export const router = new Router(routes, appContainer);
export const header = new Header();
const footer = new Footer();

function onAuthSuccess() {
  // header.update();
  router.navigate('/projects');
}

let loginModal = null;
let registerModal = null;
// function onAuthSuccess() {
//   router.navigate('/projects');
// }

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
  // 1. Загружаем шаблоны для статических частей
  await Promise.all([
    header.loadTemplate(),
    footer.loadTemplate()
  ]);

  // 2. Вставляем статические части в DOM
  document.body.prepend(header.render());
  document.body.appendChild(footer.render());

  // Инициализируем виджет поддержки
  const supportWidget = new SupportWidget();
  supportWidget.init();

  // 3. подписки на изменения авторизации
  AuthService.onAuthChange((user) => {
    // Эта функция будет вызвана при логине, логауте или загрузке профиля
    header.update(user);
  });

  // 4. обработчики кликов (логин/регистрация/логаут)
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

  // 5. Проверяем, авторизован ли пользователь при первой загрузке
  await AuthService.loadProfile();

  // 6. наконец, рендерим первую страницу
  // Если пользователь залогинен и находится на главной, перенаправляем его
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