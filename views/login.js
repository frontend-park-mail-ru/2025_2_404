class LoginView {
    constructor() {
        this.emailInput = new Input(
            'email', 
            'login_email', 
            'Введите ваш email',
            { required: true, email: true }
        );
        
        this.passwordInput = new Input(
            'password',
            'login_password', 
            'Введите пароль',
            { required: true, minLength: 8 }
        );
        this.loginButton = new Button('Войти', )
    }
    clear() {
        const app = document.getElementById('app');
        if (app){
            app.innerHTML = '';
        } 
    }
    
    render(data = {}) {
        const app = document.getElementById('app') || document.body;
        app.innerHTML = `
            
        `;
    }
}

export default LoginView;