export default class SupportWidget {
  constructor() {
    this.widgetElement = null;
    this.isOpen = false;
  }

  // Метод, который создает и добавляет HTML виджета на страницу
  render() {
    const widgetHTML = `
      <!-- Кнопка для вызова чата поддержки -->
      <div id="support-toggle-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
      </div>

      <!-- Сам виджет чата поддержки -->
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
              <div id="chat-messages" class="hidden"></div>
          </div>
          <div class="support-footer hidden">
              <textarea id="support-textarea" placeholder="Введите ваше сообщение..."></textarea>
              <button id="support-send-button">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
          </div>
      </div>
    `;
    
    // Создаем временный контейнер, чтобы не засорять DOM сразу
    const container = document.createElement('div');
    container.innerHTML = widgetHTML;
    
    // Добавляем все элементы виджета в body
    // document.body.append(...container.children) не всегда работает, этот способ надежнее
    while (container.firstChild) {
      document.body.appendChild(container.firstChild);
    }
  }

  // Метод, который "оживляет" HTML, добавляя обработчики событий
  attachEvents() {
    const toggleButton = document.getElementById('support-toggle-button');
    const supportWidget = document.getElementById('support-widget');
    const closeButton = document.getElementById('support-close-button');
    const categorySelection = document.getElementById('category-selection');
    const categoryButtons = document.querySelectorAll('.category-btn');
    const chatMessagesContainer = document.getElementById('chat-messages');
    const chatFooter = document.querySelector('.support-footer');
    const messageTextarea = document.getElementById('support-textarea');
    const sendButton = document.getElementById('support-send-button');

    const scrollToBottom = () => {
        const body = supportWidget.querySelector('.support-body');
        body.scrollTop = body.scrollHeight;
    };

    const addMessage = (text, type) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        messageDiv.textContent = text;
        chatMessagesContainer.appendChild(messageDiv);
        scrollToBottom();
    };

    toggleButton.addEventListener('click', () => supportWidget.classList.toggle('hidden'));
    closeButton.addEventListener('click', () => supportWidget.classList.add('hidden'));

    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            const selectedCategory = button.dataset.category;
            categorySelection.classList.add('hidden');
            chatMessagesContainer.classList.remove('hidden');
            chatFooter.classList.remove('hidden');
            addMessage(selectedCategory, 'user');
            setTimeout(() => addMessage(`Отлично, вы выбрали "${selectedCategory}". Опишите, пожалуйста, вашу проблему.`, 'agent'), 500);
        });
    });

    const sendMessage = () => {
        const messageText = messageTextarea.value.trim();
        if (messageText) {
            addMessage(messageText, 'user');
            messageTextarea.value = '';
            // TODO: Логика отправки на сервер (fetch)
            setTimeout(() => addMessage('Спасибо! Сообщение получено. Оператор скоро ответит.', 'agent'), 1000);
        }
    };

    sendButton.addEventListener('click', sendMessage);
    messageTextarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
  }

  // Главный метод для инициализации компонента
  init() {
    this.render();
    this.attachEvents();
  }
}