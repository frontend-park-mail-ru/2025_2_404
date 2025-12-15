import Router from './services/Router';
import Header from './pages/header/Header';
import Footer from './pages/footer/Footer';
import AuthService from './services/ServiceAuthentification';

// Импорты страниц
import MainPage, { setShowRegisterModal, setMainPageRouter } from './pages/main/MainPage';
import ProfilePage, { setRouter as setProfileRouter } from './pages/profile/ProfilePage';
import ProjectsPage, { setProjectsRouter } from './pages/projects/ProjectsPage';
import ProjectDetailPage, { setProjectDetailRouter } from './pages/projects/ProjectDetailPage';
import CreateProjectPage, { setCreateProjectRouter } from './pages/projects/CreateProjectPage';
import BalancePage, { setBalanceRouter } from './pages/balance/BalancePage';
import InfoPage from './pages/info/InfoPage';
import SlotStatisticsPage, { setSlotStatisticsRouter } from './pages/slots/SlotStatisticsPage';
import CreateSlotPage from './pages/slots/CreateSlotPage';
import SlotDetailPage from './pages/slots/SlotDetailPage';
import LoginPage from './pages/login/LoginPage';
import RegisterPage from './pages/register/Register';

// Импорт компонентов
import ConfirmationModal from './pages/components/ConfirmationModal';
import LowBalanceNotification from './pages/components/LowBalanceNotification';

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
  '/info': InfoPage as unknown as PageConstructor,
  '/slots/create': CreateSlotPage as unknown as PageConstructor,
  '/slots/:id': SlotDetailPage as unknown as PageConstructor,
  '/slots/:id/statistics': SlotStatisticsPage as unknown as PageConstructor,
};

export const router = new Router(routes, appContainer);
export const header = new Header();
const footer = new Footer();

setProfileRouter(router);
setProjectsRouter(router);
setProjectDetailRouter(router);
setCreateProjectRouter(router);
setBalanceRouter(router);
setSlotStatisticsRouter(router);
setMainPageRouter(router);

function updateFooterVisibility(path: string): void {
  const footerElement = document.querySelector('.footer') as HTMLElement | null;
  if (footerElement) {
    const showFooterPaths = ['/', '/info'];
    footerElement.style.display = showFooterPaths.includes(path) ? '' : 'none';
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
  if (header.header && !document.body.contains(header.header)) {
    document.body.prepend(header.header);
  }
  await header.update();
  document.body.appendChild(footer.render());
  router.onRouteChange(updateFooterVisibility);
  updateFooterVisibility(window.location.pathname);
  const lowBalanceNotification = new LowBalanceNotification();
  AuthService.onAuthChange((user) => {
    header.resetCache();
    header.update();
    if (user) {
        lowBalanceNotification.startPolling();
    } else {
        lowBalanceNotification.stopPolling();
    }
  });
  document.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const dropdownItem = target.closest('.header__dropdown-item[data-tab]') as HTMLElement | null;
    if (dropdownItem) {
      const tab = dropdownItem.dataset.tab;
      if (tab) {
        localStorage.setItem('projects_tab', tab);
        if (window.location.pathname === '/projects') {
          e.preventDefault();
          router.loadRoute();
          return;
        }
      }
    }
    if (target.closest('#login-btn-header') || target.closest('#login-trigger-ads') || target.closest('#login-trigger-slots')) {
      e.preventDefault();
      showLoginModal();
    } else if (target.closest('#register-btn-header')) {
      e.preventDefault();
      showRegisterModal();
    } 
    else if (
      target.closest('#logout-btn') ||
      target.closest('#profile-logout')
    ) {
      e.preventDefault();
      const modal = new ConfirmationModal({
        message: 'Вы действительно хотите выйти из аккаунта?',
        confirmText: 'Да, выйти',
        cancelText: 'Отмена',
        onConfirm: () => {
          lowBalanceNotification.stopPolling();
          
          AuthService.logout();
          header.resetCache();
          router.navigate('/');
          header.update();
        },
        onCancel: () => {}
      }) as any;
      
      modal.show();
    }
  });
  await AuthService.loadProfile();

  if (AuthService.isAuthenticated()) {
      lowBalanceNotification.startPolling();
      if (window.location.pathname === '/') {
        router.navigate('/projects');
      } else {
        router.loadRoute();
      }
  } else {
      router.loadRoute();
  }
}

startApp();