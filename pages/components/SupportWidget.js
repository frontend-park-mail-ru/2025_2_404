    export default class SupportWidget {
        constructor() {
            this.widgetElement = null;
            this.isOpen = false;
            this.iframe = null;
            this.selectedCategory = null;
        }

        isUserAuthenticated() {
            return !!localStorage.getItem('token');
        }

        render() {
            if (!this.isUserAuthenticated()) {
                console.log('Пользователь не авторизован - виджет поддержки не отображается');
                return;
            }

            const widgetHTML = `
            <!-- Кнопка для вызова поддержки -->
            <div id="support-toggle-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </div>

            <!-- Контейнер для iframe с формой поддержки -->
            <div id="support-widget" class="hidden">
                <div class="support-header">
                    <div class="header-content">
                        <span class="header-avatar"></span>
                        <div>
                            <div class="header-title">Поддержка Ad.net</div>
                            <div class="header-status">Мы рядом 24/7</div>
                        </div>
                    </div>
                    <button id="support-close-button">&times;</button>
                </div>
                <div class="support-body">
                    <iframe id="support-iframe" src="about:blank" frameborder="0"></iframe>
                </div>
            </div>
            `;
            
            const container = document.createElement('div');
            container.innerHTML = widgetHTML;
            
            while (container.firstChild) {
                document.body.appendChild(container.firstChild);
            }

            this.iframe = document.getElementById('support-iframe');
        }

        loadIframeContent() {
            const iframeContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="stylesheet" href="/style.css">
            </head>
            <body>
                <div class="support-chat-container">
                    <!-- Шаг 1: Выбор категории -->
                    <div id="category-selection">
                        <div class="agent-message">
                            Здравствуйте! Чтобы мы могли быстрее вам помочь, выберите, пожалуйста, категорию вашего вопроса.
                        </div>
                        <div class="category-buttons">
                            <button class="category-btn" data-category="Технический вопрос">Технический вопрос</button>
                            <button class="category-btn" data-category="Финансовый вопрос">Финансовый вопрос</button>
                            <button class="category-btn" data-category="Вопрос по рекламе">Вопрос по рекламе</button>
                            <button class="category-btn" data-category="Другое">Другое</button>
                        </div>
                    </div>

                    <!-- Шаг 2: Форма обратной связи -->
                    <div id="support-form" class="hidden">
                        <div class="form-header">
                            <h3>Расскажите о проблеме</h3>
                            <p>Все поля обязательные. Пожалуйста, заполните их внимательно — это поможет быстрее найти для вас решение.</p>
                        </div>

                        <form id="feedback-form">
                            <div class="form-group">
                                <label for="login-email">С какой почтой вы вошли в этот сервис? *</label>
                                <input type="email" id="login-email" name="login_email" required placeholder="test@test.com">
                            </div>

                            <div class="form-group">
                                <label for="issue-category">С чем связано ваше обращение? *</label>
                                <select id="issue-category" name="issue_category" required>
                                    <option value="">Не выбрано</option>
                                    <option value="technical">Техническая проблема</option>
                                    <option value="financial">Финансовый вопрос</option>
                                    <option value="advertising">Вопрос по рекламе</option>
                                    <option value="other">Другое</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="problem-description">Опишите проблему как можно подробнее *</label>
                                <textarea id="problem-description" name="problem_description" required placeholder="Опишите вашу проблему подробно..." rows="4"></textarea>
                            </div>

                            <div class="contacts-section">
                                <h4>Оставьте свои контакты</h4>
                                <p>Мы ответим вам в самое ближайшее время.</p>

                                <div class="form-group">
                                    <label for="contact-name">Имя *</label>
                                    <input type="text" id="contact-name" name="contact_name" required placeholder="Дмитрий Пешков">
                                </div>

                                <div class="form-group">
                                    <label for="contact-email">Почта для связи *</label>
                                    <input type="email" id="contact-email" name="contact_email" required placeholder="test@test.com">
                                </div>
                            </div>

                            <div class="form-actions">
                                <button type="button" id="back-to-categories" class="back-btn">Назад</button>
                                <button type="submit" id="submit-form" class="submit-btn">Отправить обращение</button>
                            </div>
                        </form>
                    </div>

                    <!-- Шаг 3: Подтверждение отправки -->
                    <div id="success-message" class="hidden">
                        <div class="success-content">
                            <div class="success-icon">✓</div>
                            <h3>Спасибо за обращение!</h3>
                            <p>Ваше сообщение успешно отправлено. Мы ответим вам в ближайшее время.</p>
                            <div class="success-actions">
                                <button type="button" id="new-request" class="new-request-btn">Создать новую заявку</button>
                                <button type="button" id="close-success" class="close-btn">Закрыть</button>
                            </div>
                        </div>
                    </div>
                </div>

                <script>
                    // Элементы интерфейса
                    const categorySelection = document.getElementById('category-selection');
                    const supportForm = document.getElementById('support-form');
                    const successMessage = document.getElementById('success-message');
                    const categoryButtons = document.querySelectorAll('.category-btn');
                    const backButton = document.getElementById('back-to-categories');
                    const closeSuccessButton = document.getElementById('close-success');
                    const newRequestButton = document.getElementById('new-request');
                    const feedbackForm = document.getElementById('feedback-form');
                    const issueCategorySelect = document.getElementById('issue-category');

                    // Функция сброса формы
                    function resetForm() {
                        feedbackForm.reset();
                    }

                    // Функция возврата к выбору категории
                    function goToCategorySelection() {
                        supportForm.classList.add('hidden');
                        successMessage.classList.add('hidden');
                        categorySelection.classList.remove('hidden');
                        resetForm();
                    }

                    // Обработчик выбора категории
                    categoryButtons.forEach(button => {
                        button.addEventListener('click', () => {
                            const selectedCategory = button.dataset.category;
                            
                            // Сохраняем выбранную категорию и устанавливаем в select
                            window.parent.postMessage({
                                type: 'CATEGORY_SELECTED',
                                category: selectedCategory
                            }, '*');
                            
                            // Устанавливаем соответствующее значение в select
                            const categoryMap = {
                                'Технический вопрос': 'technical',
                                'Финансовый вопрос': 'financial', 
                                'Вопрос по рекламе': 'advertising',
                                'Другое': 'other'
                            };
                            
                            issueCategorySelect.value = categoryMap[selectedCategory];
                            
                            // Переходим к форме
                            categorySelection.classList.add('hidden');
                            supportForm.classList.remove('hidden');
                        });
                    });

                    // Кнопка "Назад" - возврат к выбору категории
                    backButton.addEventListener('click', goToCategorySelection);

                    // Кнопка "Создать новую заявку"
                    newRequestButton.addEventListener('click', goToCategorySelection);

                    // Кнопка закрытия успешного сообщения
                    closeSuccessButton.addEventListener('click', () => {
                        window.parent.postMessage({
                            type: 'CLOSE_WIDGET'
                        }, '*');
                    });

                    // Обработка отправки формы
                    feedbackForm.addEventListener('submit', (e) => {
                        e.preventDefault();
                        
                        // Собираем данные формы
                        const formData = new FormData(feedbackForm);
                        const formObject = {
                            login_email: formData.get('login_email'),
                            issue_category: formData.get('issue_category'),
                            problem_description: formData.get('problem_description'),
                            contact_name: formData.get('contact_name'),
                            contact_email: formData.get('contact_email')
                        };
                        
                        // Отправляем данные в родительское окно
                        window.parent.postMessage({
                            type: 'SUPPORT_FORM_SUBMIT',
                            formData: formObject
                        }, '*');
                        
                        // Показываем сообщение об успехе
                        supportForm.classList.add('hidden');
                        successMessage.classList.remove('hidden');
                    });
                </script>

                <style>
                    .support-chat-container {
                        height: 100%;
                        display: flex;
                        flex-direction: column;
                        padding: 0;
                        margin: 0;
                        background: #ffffff;
                    }
                    
                    #category-selection,
                    #support-form,
                    #success-message {
                        flex: 1;
                        padding: 20px;
                        overflow-y: auto;
                    }
                    
                    .form-header {
                        margin-bottom: 20px;
                    }
                    
                    .form-header h3 {
                        margin: 0 0 10px 0;
                        color: #333;
                        font-size: 1.2em;
                    }
                    
                    .form-header p {
                        margin: 0;
                        color: #666;
                        font-size: 0.9em;
                        line-height: 1.4;
                    }
                    
                    .form-group {
                        margin-bottom: 20px;
                    }
                    
                    .form-group label {
                        display: block;
                        margin-bottom: 8px;
                        font-weight: 500;
                        color: #333;
                        font-size: 0.9em;
                    }
                    
                    .form-group input,
                    .form-group select,
                    .form-group textarea {
                        width: 100%;
                        padding: 12px;
                        border: 1px solid #e0d9f0;
                        border-radius: 8px;
                        font-size: 14px;
                        font-family: inherit;
                        background: #fff;
                    }
                    
                    .form-group input:focus,
                    .form-group select:focus,
                    .form-group textarea:focus {
                        outline: none;
                        border-color: #8E2DE2;
                        box-shadow: 0 0 0 2px rgba(142, 45, 226, 0.2);
                    }
                    
                    .contacts-section {
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid #ede7f6;
                    }
                    
                    .contacts-section h4 {
                        margin: 0 0 8px 0;
                        color: #333;
                    }
                    
                    .contacts-section p {
                        margin: 0 0 20px 0;
                        color: #666;
                        font-size: 0.9em;
                    }
                    
                    .form-actions {
                        display: flex;
                        gap: 12px;
                        margin-top: 30px;
                    }
                    
                    .back-btn {
                        padding: 12px 24px;
                        background: #f8f9fa;
                        border: 1px solid #dee2e6;
                        border-radius: 8px;
                        color: #333;
                        cursor: pointer;
                        font-size: 14px;
                        flex: 1;
                    }
                    
                    .submit-btn {
                        padding: 12px 24px;
                        background: linear-gradient(90deg, #8E2DE2, #4A00E0);
                        border: none;
                        border-radius: 8px;
                        color: white;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 500;
                        flex: 2;
                    }
                    
                    .back-btn:hover {
                        background: #e9ecef;
                    }
                    
                    .submit-btn:hover {
                        opacity: 0.9;
                    }
                    
                    .success-content {
                        text-align: center;
                        padding: 40px 20px;
                    }
                    
                    .success-icon {
                        width: 60px;
                        height: 60px;
                        background: linear-gradient(90deg, #8E2DE2, #4A00E0);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 24px;
                        font-weight: bold;
                        margin: 0 auto 20px;
                    }
                    
                    .success-content h3 {
                        margin: 0 0 12px 0;
                        color: #333;
                    }
                    
                    .success-content p {
                        margin: 0 0 24px 0;
                        color: #666;
                        line-height: 1.5;
                    }
                    
                    .success-actions {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                        align-items: center;
                    }
                    
                    .new-request-btn {
                        padding: 12px 24px;
                        background: transparent;
                        border: 2px solid #8E2DE2;
                        border-radius: 8px;
                        color: #8E2DE2;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 500;
                        transition: all 0.2s ease;
                    }
                    
                    .new-request-btn:hover {
                        background: #8E2DE2;
                        color: white;
                    }
                    
                    .close-btn {
                        padding: 10px 20px;
                        background: #f8f9fa;
                        border: 1px solid #dee2e6;
                        border-radius: 8px;
                        color: #333;
                        cursor: pointer;
                        font-size: 14px;
                    }
                    
                    .close-btn:hover {
                        background: #e9ecef;
                    }
                    
                    .hidden {
                        display: none !important;
                    }
                    
                    /* Стили для выбора категории */
                    .category-buttons {
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                    }
                    
                    .category-btn {
                        width: 100%;
                        padding: 15px;
                        border: 1px solid #e0d9f0;
                        background-color: #faf8ff;
                        border-radius: 12px;
                        text-align: left;
                        font-size: 1em;
                        font-weight: 500;
                        color: #4A00E0;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    }
                    
                    .category-btn:hover {
                        background-color: #ede7f6;
                        border-color: #8E2DE2;
                    }
                    
                    .agent-message {
                        background-color: #f3f4f6;
                        padding: 12px 15px;
                        border-radius: 15px 15px 15px 5px;
                        color: #333;
                        line-height: 1.5;
                        margin-bottom: 20px;
                    }
                </style>
            </body>
            </html>
            `;

            const blob = new Blob([iframeContent], { type: 'text/html' });
            this.iframe.src = URL.createObjectURL(blob);
        }

        attachEvents() {
            const toggleButton = document.getElementById('support-toggle-button');
            const supportWidget = document.getElementById('support-widget');
            const closeButton = document.getElementById('support-close-button');
            if (!toggleButton) return;

            toggleButton.addEventListener('click', () => {
                supportWidget.classList.toggle('hidden');
                this.isOpen = !supportWidget.classList.contains('hidden');
                
                if (this.isOpen && this.iframe.src === 'about:blank') {
                    this.loadIframeContent();
                }
            });

            closeButton.addEventListener('click', () => {
                supportWidget.classList.add('hidden');
                this.isOpen = false;
            });
            
            window.addEventListener('message', (event) => {
                switch (event.data.type) {
                    case 'CATEGORY_SELECTED':
                        this.selectedCategory = event.data.category;
                        console.log('Выбрана категория:', this.selectedCategory);
                        break;
                        
                    case 'SUPPORT_FORM_SUBMIT':
                        console.log('Данные формы:', event.data.formData);
                        this.sendToServer(event.data.formData);
                        break;
                        
                    case 'CLOSE_WIDGET':
                        supportWidget.classList.add('hidden');
                        this.isOpen = false;
                        break;
                }
            });
        }

async sendToServer(formDataFromIframe) {
    try {
        // маппим данные из формы внутри iframe в формат, который ждёт бэк
        const fd = new FormData();

        // статус можно всегда ставить open при создании
        fd.append('status', 'open');

        // category: у тебя в форме issue_category = technical/financial/advertising/other
        const categoryMap = {
            technical: 'bug',
            financial: 'finance',
            advertising: 'ads',
            other: 'other',
        };
        const mappedCategory =
            categoryMap[formDataFromIframe.issue_category] ||
            formDataFromIframe.issue_category ||
            'other';

        fd.append('category', mappedCategory);

        fd.append('description', formDataFromIframe.problem_description || '');
        fd.append('contact_name', formDataFromIframe.contact_name || '');
        fd.append('contact_email', formDataFromIframe.contact_email || '');

        const response = await fetch('http://89.208.230.119:8080/support/', {
            method: 'POST',
            credentials: 'include',       // чтобы кука сессии ушла на бэк
            body: fd,                     // ВАЖНО: без headers['Content-Type']!
        });

        if (response.ok) {
            console.log('Форма успешно отправлена');
        } else {
            const text = await response.text();
            console.error('Ошибка при отправке формы', response.status, text);
        }
    } catch (error) {
        console.error('Ошибка отправки формы:', error);
    }
}
    }
