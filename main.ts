import Router from './services/Router';
import Header from './pages/header/Header';
import Footer from './pages/footer/Footer';
import AuthService from './services/ServiceAuthentification';

import MainPage, { setShowRegisterModal } from './pages/main/MainPage';
import ProfilePage, { setRouter as setProfileRouter } from './pages/profile/ProfilePage';
import ProjectsPage, { setProjectsRouter } from './pages/projects/ProjectsPage';
import ProjectDetailPage, { setProjectDetailRouter } from './pages/projects/ProjectDetailPage';
import CreateProjectPage, { setCreateProjectRouter } from './pages/projects/CreateProjectPage';
import BalancePage, { setBalanceRouter } from './pages/balance/BalancePage';
import LoginPage from './pages/login/LoginPage';
import RegisterPage from './pages/register/Register';

import type { Routes, PageConstructor } from './src/types';

Handlebars.registerHelper('formatDate', function (dateString: unknown): string {
  if (!dateString || typeof dateString !== 'string') return '';
  return new Date(dateString).toLocaleString('ru-RU');
});

const appContainer = document.getElementById('app') as HTMLElement;

const routes: Routes = {
  '/': MainPage as unknown as PageConstructor,
  '/profile': ProfilePage as unknown as PageConstructor,
  '/projects': ProjectsPage as unknown as PageConstructor,
  '/projects/create': CreateProjectPage as unknown as PageConstructor,
  '/projects/:id': ProjectDetailPage as unknown as PageConstructor,
  '/balance': BalancePage as unknown as PageConstructor,
};

export const router = new Router(routes, appContainer);
export const header = new Header();
const footer = new Footer();

setProfileRouter(router);
setProjectsRouter(router);
setProjectDetailRouter(router);
setCreateProjectRouter(router);
setBalanceRouter(router);

function updateFooterVisibility(path: string): void {
  const footerElement = document.querySelector('.footer') as HTMLElement | null;
  if (footerElement) {
    footerElement.style.display = path === '/' ? '' : 'none';
  }
}

function onAuthSuccess(): void {
  router.navigate('/projects');
}

let loginModal: LoginPage | null = null;
let registerModal: RegisterPage | null = null;

function showLoginModal(): void {
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
  loginModal.init().then(() => loginModal?.show());
}

export function showRegisterModal(): void {
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
  registerModal.init().then(() => registerModal?.show());
}

setShowRegisterModal(showRegisterModal);

async function startApp(): Promise<void> {
  await Promise.all([
    header.loadTemplate(),
    footer.loadTemplate()
  ]);

  await header.update();
  document.body.appendChild(footer.render());

  router.onRouteChange(updateFooterVisibility);
  updateFooterVisibility(window.location.pathname);

  AuthService.onAuthChange(() => {
    header.resetCache();
    header.update();
  });

  document.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement;

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
      header.resetCache();
      router.navigate('/');
      header.update();
    }
  });

  router.loadRoute();
}

startApp();
