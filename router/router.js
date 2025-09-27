import LoginView from "../views/login.js"
import RegisterView from "../views/register.js"

export class Router{
    #views = new Map();
    #currentView = null;
    isLoading = false;

    constructor(){
        this.#views.set('/login', LoginView);
        this.#views.set('/register', RegisterView);
        this.#views.set('/', MainAdvertisementView);
    }

    navigate(path, pushState = true) {
    if (pushState) {
        window.history.pushState({}, '', path);
    } else {
        window.history.replaceState({}, '', path);
    }
    }


    open(path, pushState = true, data = {}) {
    if (this.isLoading){
        return;
    }
    
    this.isLoading = true;
    this.#currentView?.clear();
    const ViewClass = this.#views.get(path);
    if (!ViewClass) {
        console.error(`View not found for path: ${path}`);
        this.isLoading = false;
        return;
    }

    this.#currentView = new ViewClass();
    this.navigate(path, pushState);
    this.#currentView.render(data);
    
    this.isLoading = false;
    }

    start() {
    window.addEventListener('popstate', () => {
        this.open(window.location.pathname, false);
    });
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.href.startsWith(window.location.origin)) {
            e.preventDefault();
            this.open(link.pathname);
        }
    });
    const router = new Router(routes);

window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

if (window.location.pathname === '/') {
    router.navigate('/register');
}
    this.open(window.location.pathname, false);
}
}

export default new Router();