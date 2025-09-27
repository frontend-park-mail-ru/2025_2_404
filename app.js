
import Router from './router/router.js';
import RegisterPage from './pages/register/Register.js';
// import LoginPage from './pages/LoginPage.js'; // Когда создадите
// import Header from './components/Header.js';
const routes = {
    '/register': RegisterPage,
    // '/login': LoginPage,
};
const router = new Router(routes);
if (window.location.pathname === '/') {
    router.navigate('/register');
}