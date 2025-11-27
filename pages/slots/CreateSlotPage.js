import { router } from '../../main.js';
import ConfirmationModal from '../components/ConfirmationModal.js';
import { slotsRepository } from '../../public/repository/slotsRepository.js';

export default class CreateSlotPage {
  constructor() {
    this.template = null;
    this.createdSlotId = null; // <--- ДОБАВЛЕНО: Храним ID созданного слота
  }

  async loadTemplate() {
    if (this.template) return;
    Handlebars.registerHelper('eq', (a, b) => a === b);
    try {
      const response = await fetch('/pages/slots/CreateSlotPage.hbs');
      if (!response.ok) throw new Error('Не удалось загрузить шаблон слота');
      this.template = Handlebars.compile(await response.text());
    } catch (error) {
        console.error(error);
        this.template = Handlebars.compile('<h1>Ошибка загрузки шаблона</h1>');
    }
  }

  async render() {
    await this.loadTemplate();
    const context = {
        isNew: true,
        slot: { minPrice: '', format: '', status: 'active', code: '' } 
    };
    return this.template(context);
  }

  attachEvents() {
    const getFormData = () => ({
        title: document.getElementById('slot-title-input')?.value || 'Новый слот',
        minPrice: document.getElementById('min-price')?.value,
        format: document.getElementById('ad-format')?.value,
        status: document.getElementById('slot-status-toggle')?.checked ? 'active' : 'paused',
        bgColor: document.getElementById('bg-color')?.value,
        textColor: document.getElementById('text-color')?.value
    });

    // ... (Код UI логики: ресайз, цвета, статус - оставляем без изменений) ...
    const titleInput = document.getElementById('slot-title-input');
    const editBtn = document.getElementById('edit-title-btn');
    const autoResizeInput = (input) => {
        if (!input) return;
        const span = document.createElement('span');
        span.style.visibility = 'hidden';
        span.style.position = 'absolute';
        span.style.whiteSpace = 'pre';
        span.style.font = window.getComputedStyle(input).font;
        span.textContent = input.value || input.placeholder;
        document.body.appendChild(span);
        input.style.width = `${span.offsetWidth + 20}px`;
        document.body.removeChild(span);
    };
    if (titleInput) {
        autoResizeInput(titleInput);
        titleInput.addEventListener('input', () => autoResizeInput(titleInput));
        if (editBtn) editBtn.addEventListener('click', () => titleInput.focus());
    }

    const statusToggle = document.getElementById('slot-status-toggle');
    const statusText = document.getElementById('status-text');
    if (statusToggle && statusText) {
        const updateStatusView = () => {
            if (statusToggle.checked) {
                statusText.textContent = "Активно";
                statusText.style.color = "#7C54E8"; 
            } else {
                statusText.textContent = "Приостановлено";
                statusText.style.color = "#A0AEC0";
            }
        };
        statusToggle.addEventListener('change', updateStatusView);
        updateStatusView(); 
    }

    const handleInputColor = (element) => {
        if (!element) return;
        if (element.value && element.value !== "") element.classList.add('filled');
        else element.classList.remove('filled');
    };
    document.querySelectorAll('.slot-input, .slot-select').forEach(input => {
        handleInputColor(input);
        input.addEventListener('input', () => handleInputColor(input));
        input.addEventListener('change', () => handleInputColor(input));
    });

    const bgColorInput = document.getElementById('bg-color');
    const textColorInput = document.getElementById('text-color');
    const previewContent = document.querySelector('.preview-content'); 
    const previewTitle = document.getElementById('preview-title');
    const previewDesc = document.getElementById('preview-desc');
    const bgPreviewBox = document.getElementById('bg-color-preview');
    const textPreviewBox = document.getElementById('text-color-preview');

    const updatePreview = () => {
        if (bgColorInput) {
             document.getElementById('bg-color-text').textContent = bgColorInput.value;
             if (bgPreviewBox) bgPreviewBox.style.backgroundColor = bgColorInput.value;
             if (previewContent) previewContent.style.backgroundColor = bgColorInput.value;
        }
        if (textColorInput) {
             document.getElementById('text-color-text').textContent = textColorInput.value;
             if (textPreviewBox) textPreviewBox.style.backgroundColor = textColorInput.value;
             if (previewTitle) previewTitle.style.color = textColorInput.value;
             if (previewDesc) previewDesc.style.color = textColorInput.value;
        }
    };
    bgColorInput?.addEventListener('input', updatePreview);
    textColorInput?.addEventListener('input', updatePreview);

    const formatSelect = document.getElementById('ad-format');
    const previewCard = document.getElementById('preview-card');
    if (formatSelect && previewCard) {
        formatSelect.addEventListener('change', (e) => {
            const format = e.target.value;
            previewCard.classList.remove('preview-card--horizontal');
            if (format === 'horizontal') {
                previewCard.classList.add('preview-card--horizontal');
            }
        });
    }
    // ... (Конец UI логики) ...


    // --- 1. ГЕНЕРАЦИЯ КОДА ---
    const generateBtn = document.querySelector('#generate-code-btn');
    const codeDiv = document.getElementById('embed-code');
    const createBtn = document.querySelector('#create-slot-btn'); // Ссылка на нижнюю кнопку

    if (generateBtn) {
        generateBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Если уже создали через эту кнопку, просто показываем сообщение (или ничего не делаем)
            if (this.createdSlotId) {
                 alert("Слот уже создан. Код ниже.");
                 return;
            }

            const slotData = getFormData();
            if (!slotData.minPrice || !slotData.format) {
                alert('Пожалуйста, укажите цену и формат объявления.');
                return;
            }

            try {
                generateBtn.textContent = 'Генерация...';
                generateBtn.disabled = true;

                // Создаем слот
                const response = await slotsRepository.create(slotData);
                
                // ЗАПОМИНАЕМ ID, чтобы не создавать дубль
                this.createdSlotId = response.slot.id;

                // Вставляем код
                if (codeDiv) {
                    codeDiv.textContent = response.integrationCode;
                }
                
                // Меняем текст нижней кнопки, так как слот уже есть
                if (createBtn) {
                    createBtn.textContent = "Сохранить и выйти";
                }

                new ConfirmationModal({
                    message: 'Слот создан! Код готов к копированию.',
                    onConfirm: () => {} 
                }).show();

            } catch (err) {
                console.error(err);
                alert('Ошибка при создании слота');
                generateBtn.disabled = false; // Разблокируем, если ошибка
                generateBtn.textContent = 'Сгенерировать код для вставки';
            }
        });
    }

    // --- КНОПКА КОПИРОВАНИЯ ---
    const copyBtn = document.querySelector('#copy-code-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const codeText = document.getElementById('embed-code').innerText;
            if (!codeText) return;
            navigator.clipboard.writeText(codeText)
                .then(() => alert('Код скопирован!'))
                .catch(err => console.error(err));
        });
    }

    // --- НАВИГАЦИЯ ---
    document.querySelector('#back-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      router.navigate('/projects');
    });

    // --- 2. КНОПКА СОЗДАТЬ (ВНИЗУ) ---
    if (createBtn) {
        createBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // ПРОВЕРКА: Если слот уже создан (через генерацию), просто уходим
            if (this.createdSlotId) {
                router.navigate('/projects');
                return;
            }

            const btn = e.target;
            if (btn.disabled) return;

            const slotData = getFormData();
            
            if (!slotData.minPrice || !slotData.format) {
                 alert('Заполните обязательные поля');
                 return;
            }

            try {
                btn.disabled = true;
                btn.textContent = "Создание...";
                
                // Создаем только если еще не создан
                await slotsRepository.create(slotData);
                
                new ConfirmationModal({
                    message: 'Слот успешно создан',
                    onConfirm: () => router.navigate('/projects'),
                }).show();
            } catch (err) {
                console.error(err);
                btn.disabled = false; 
                btn.textContent = "Создать";
            }
        });
    }
  }
}