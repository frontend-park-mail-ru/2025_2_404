import { router } from '../../main.js';
import ConfirmationModal from '../components/ConfirmationModal.js';
import { slotsRepository } from '../../public/repository/slotsRepository.js';

export default class CreateSlotPage {
  constructor() {
    this.template = null;
    this.createdSlotId = null;
  }

  async loadTemplate() {
    if (this.template) return;
    Handlebars.registerHelper('eq', (a, b) => a === b);
    try {
      const response = await fetch('/pages/slots/CreateSlotPage.hbs');
      if (!response.ok) throw new Error('Не удалось загрузить шаблон');
      this.template = Handlebars.compile(await response.text());
    } catch (error) {
    }
  }

  async render() {
    await this.loadTemplate();
    let nextNum = 1;
    try {
        const existingSlots = await slotsRepository.getAll();
        nextNum = existingSlots.length + 1;
    } catch (e) {
    }

    const context = {
        isNew: true,
        defaultTitle: `Слот №${nextNum}`, 
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
    const generateBtn = document.querySelector('#generate-code-btn');
    const codeDiv = document.getElementById('embed-code');
    const createBtn = document.querySelector('#create-slot-btn');

    if (generateBtn) {
        generateBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            if (this.createdSlotId) {
                 return;
            }

            const slotData = getFormData();
            if (!slotData.minPrice || !slotData.format) {
                return;
            }

            try {
                generateBtn.textContent = 'Генерация...';
                generateBtn.disabled = true;

                const response = await slotsRepository.create(slotData);
                this.createdSlotId = response.slot.id;

                if (codeDiv) {
                    codeDiv.textContent = response.integrationCode;
                }
                
                if (createBtn) {
                    createBtn.textContent = "Сохранить и выйти";
                }
                generateBtn.textContent = 'Код сгенерирован';
                codeDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });

            } catch (err) {
                generateBtn.disabled = false;
                generateBtn.textContent = 'Сгенерировать код для вставки';
            }
        });
    }
    const showCopyNotification = (message, type = 'success') => {
        // Удаляем старое уведомление, если есть
        const oldNotification = document.querySelector('.copy-notification');
        if (oldNotification) {
            oldNotification.remove();
        }

        // Создаем новое уведомление
        const notification = document.createElement('div');
        notification.className = `copy-notification ${type}`;
        
        // Добавляем иконку в зависимости от типа
        if (type === 'success') {
            notification.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>${message}</span>
            `;
        } else {
            notification.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>${message}</span>
            `;
        }

        document.body.appendChild(notification);
        
        // Показываем уведомление
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Автоматически скрываем через 3 секунды
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    };

    // Обработчик копирования кода
    const copyBtn = document.querySelector('#copy-code-btn');
    if (copyBtn) {
        // Удаляем старое событие (если оно было добавлено ранее)
        copyBtn.replaceWith(copyBtn.cloneNode(true));
        
        // Получаем новую кнопку
        const newCopyBtn = document.querySelector('#copy-code-btn');
        
        newCopyBtn.addEventListener('click', () => {
            const codeElement = document.getElementById('embed-code');
            const codeText = codeElement?.innerText || codeElement?.textContent;
            
            // Проверяем, что код не является заглушкой
            if (!codeText || codeText.includes('ad-slot-...')) {
                showCopyNotification('Сначала сгенерируйте код', 'error');
                return;
            }
            
            // Используем современный Clipboard API
            navigator.clipboard.writeText(codeText)
                .then(() => {
                    // Показываем уведомление об успехе
                    showCopyNotification('Код скопирован!');
                    
                    // Меняем иконку кнопки на время
                    const originalHTML = newCopyBtn.innerHTML;
                    newCopyBtn.innerHTML = `
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 6L9 17L4 12" stroke="#38A169" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    `;
                    
                    // Возвращаем исходную иконку через 2 секунды
                    setTimeout(() => {
                        newCopyBtn.innerHTML = originalHTML;
                    }, 2000);
                })
                .catch(err => {
                    // Fallback для старых браузеров
                    const textArea = document.createElement('textarea');
                    textArea.value = codeText;
                    textArea.style.position = 'fixed';
                    textArea.style.opacity = '0';
                    document.body.appendChild(textArea);
                    textArea.select();
                    
                    try {
                        const success = document.execCommand('copy');
                        if (success) {
                            showCopyNotification('Код скопирован!');
                        } else {
                            showCopyNotification('Не удалось скопировать код', 'error');
                        }
                    } catch (err) {
                        showCopyNotification('Ошибка копирования', 'error');
                    } finally {
                        document.body.removeChild(textArea);
                    }
                });
        });
    }
    document.querySelector('#back-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.setItem('projects_tab', 'slots');
      router.navigate('/projects');
    });

    if (createBtn) {
        createBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (this.createdSlotId) {
                localStorage.setItem('projects_tab', 'slots');
                router.navigate('/projects');
                return;
            }
             const slotData = getFormData();
             if (!slotData.minPrice || !slotData.format) { return; }
             try {
                await slotsRepository.create(slotData);
                new ConfirmationModal({
                    message: 'Слот успешно создан',
                    onConfirm: () => {
                        localStorage.setItem('projects_tab', 'slots');
                        router.navigate('/projects');
                    },
                }).show();
             } catch(e) { }
        });
    }
    
  }
}