const CACHE_NAME = 'adnet-app-cache-v1';
const FONT_CACHE_NAME = 'adnet-font-cache-v1'; 
const DATA_CACHE_NAME = 'adnet-data-cache-v1'
const APP_SHELL_FILES = [
  '/',
  '/index.html',
  '/style.css',
  '/main.js',
  'https://cdnjs.cloudflare.com/ajax/libs/handlebars.js/4.7.7/handlebars.min.js',
  'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css',
  'https://cdn.jsdelivr.net/npm/flatpickr',
  '/services/Router.js',
  '/services/ServiceAuthentification.js',
  '/services/DataBaseService.js',
  '/server/app.js',
  '/server/mockApi.js',
  '/public/api/http1.js',
  '/public/api/http.js',
  '/public/api/ads.js',
  '/public/api/auth.js',
  '/public/repository/adsRepository.js',
  '/public/utils/ValidateAdForm.js',
  '/pages/header/header.hbs',
  '/pages/main/MainPage.hbs',
  '/pages/main/MainPage.js',
  '/pages/profile/ProfilePage.hbs',
  '/pages/profile/ProfilePage.js',
  '/pages/projects/ProjectsPage.hbs',
  '/pages/projects/ProjectDetailPage.hbs',
  '/pages/projects/ProjectDetailPage.js',
  '/pages/projects/ProjectsPage.js',
  '/pages/projects/CreateProjectPage.js',
  '/pages/balance/BalancePage.hbs',
  '/pages/balance/BalancePage.js',
  '/pages/components/Button.js',
  '/pages/components/ConfirmationModal.js',
  '/pages/components/Input.js',
  '/pages/components/Select.js',
  '/pages/components/modals/AddFundsModal.js',
  '/pages/components/modals/WithdrawModal.js',
  '/pages/footer/Footer.js',
  '/pages/footer/footer.hbs',
  '/pages/header/Header.js',
  '/pages/login/LoginPage.hbs',
  '/pages/login/LoginPage.js',
  '/pages/register/register.hbs',
  '/pages/register/Register.js',
  '/public/assets/default.jpg',
];
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== DATA_CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.hostname.includes(':8080') || url.hostname === '89.208.230.119') {
    if (event.request.method !== 'GET') {
      event.respondWith(fetch(event.request));
      return;
    }
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseToCache = response.clone();
          caches.open(DATA_CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONT_CACHE_NAME).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          const fetchPromise = fetch(event.request).then(networkResponse => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});