import Router from './services/Router.js';
import Header from './pages/header/Header.js';
import MainPage from './pages/main/MainPage.js';
import ProfilePage from './pages/profile/ProfilePage.js';
import LoginPage from './pages/login/LoginPage.js';
import RegisterPage from './pages/register/Register.js';
import AuthService from './services/ServiceAuthentification.js';
import Footer from './pages/footer/Footer.js';
import ProjectsPage from './pages/projects/ProjectsPage.js';
import ProjectDetailPage from './pages/projects/ProjectDetailPage.js';
import CreateProjectPage from './pages/projects/CreateProjectPage.js';
import BalancePage from './pages/balance/BalancePage.js';

const appContainer = document.getElementById('app');
if (!appContainer) {
    throw new Error('Не найден корневой элемент #app!');
}

const routes = {
  '/': MainPage,
  '/profile': ProfilePage,
  '/projects': ProjectsPage,
  '/projects/create': CreateProjectPage,
  '/projects/:id': ProjectDetailPage,
  '/balance': BalancePage,
};

const router = new Router(routes, appContainer);
const header = new Header();
const footer = new Footer();

function onAuthSuccess() {
  header.update();
  router.navigate('/projects');
}

let loginModal = null;
let registerModal = null;

function showLoginModal() {
  if (registerModal) {
    registerModal.hide();
    registerModal = null;
  }
  if (loginModal) return;

  loginModal = new LoginPage({
    onSuccess: () => {
      if (loginModal) loginModal.hide();
      loginModal = null;
      onAuthSuccess();
    },
    onCancel: () => {
      if (loginModal) loginModal.hide();
      loginModal = null;
    },
    onSwitchToRegister: () => {
      if (loginModal) loginModal.hide();
      loginModal = null;
      showRegisterModal();
    }
  });
  loginModal.init().then(() => loginModal.show());
}

function showRegisterModal() {
  if (loginModal) {
    loginModal.hide();
    loginModal = null;
  }
  if (registerModal) return;

  registerModal = new RegisterPage({
    onSuccess: () => {
      if (registerModal) registerModal.hide();
      registerModal = null;
      onAuthSuccess();
    },
    onCancel: () => {
      if (registerModal) registerModal.hide();
      registerModal = null;
    },
    onSwitchToLogin: () => {
      if (registerModal) registerModal.hide();
      registerModal = null;
      showLoginModal();
    }
  });
  registerModal.init().then(() => registerModal.show());
}

async function initializeApp() {
document.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (link && link.hasAttribute('href')) {
    const href = link.getAttribute('href');
    if (href === '/register' || href === '/login') {
      e.preventDefault();
      if (href === '/register') {
        showRegisterModal();
      } else if (href === '/login') {
        showLoginModal();
      }
      return;
    }
    if (href.startsWith('/') && link.target !== '_blank') {
      e.preventDefault();
      router.navigate(href); 
      return; 
    }
        const target = e.target;
    if (target.closest('#try-btn')) {
      e.preventDefault();
      if (AuthService.isAuthenticated()) {
        router.navigate('/projects');
      } else {
        showLoginModal();
      }
    }
  }
  const target = e.target;
  if (target.closest('#login-btn-header')) {
      e.preventDefault();
      showLoginModal();
  } else if (target.closest('#login-for-projects-btn')) {
      e.preventDefault();
      showLoginModal();
  } else if (target.closest('#register-btn-header')) {
      e.preventDefault();
      showRegisterModal();
  } else if (target.closest('#logout-btn')) {
      e.preventDefault();
      AuthService.logout();
      header.render();
      router.navigate('/');
  }
});

  AuthService.onAuthChange(() => {
    header.render();
  });

  await Promise.all([
    header.loadTemplate(),
    footer.loadTemplate()
  ]);
  
  header.render(); 
  document.body.appendChild(footer.render()); 
  router.loadRoute();
}

initializeApp();

export { router, header };