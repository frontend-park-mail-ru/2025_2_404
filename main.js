import Router from './services/Router.js';
import Header from './pages/header/Header.js';
import Footer from './pages/footer/Footer.js';
import SupportWidget from './pages/components/SupportWidget.js';
import AuthService from './services/ServiceAuthentification.js';

import MainPage from './pages/main/MainPage.js';
import ProfilePage from './pages/profile/ProfilePage.js';
import ProjectsPage from './pages/projects/ProjectsPage.js';
import ProjectDetailPage from './pages/projects/ProjectDetailPage.js';
import CreateProjectPage from './pages/projects/CreateProjectPage.js';
import BalancePage from './pages/balance/BalancePage.js';
import LoginPage from './pages/login/LoginPage.js';
import RegisterPage from './pages/register/Register.js';

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
  try {
    await Promise.all([
      header.loadTemplate(),
      footer.loadTemplate()
    ]);
    await header.update();
    document.body.appendChild(footer.render());
    await AuthService.loadProfile();
    if (AuthService.isAuthenticated()) {
      const supportWidget = new SupportWidget();
      supportWidget.init();
    }
    AuthService.onAuthChange((user) => {
      header.update(user);
      if (user && !window.supportWidget) {
        window.supportWidget = new SupportWidget();
        window.supportWidget.init();
      } else if (!user && window.supportWidget) {
        const widgetElement = document.getElementById('support-widget');
        const toggleButton = document.getElementById('support-toggle-button');
        if (widgetElement) widgetElement.remove();
        if (toggleButton) toggleButton.remove();
        window.supportWidget = null;
      }
    });
    if (AuthService.isAuthenticated() && window.location.pathname === '/') {
      router.navigate('/projects');
    } else {
      router.loadRoute();
    }
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

  } catch (error) {
    console.error('Ошибка при запуске приложения:', error);
  }
}
startApp();