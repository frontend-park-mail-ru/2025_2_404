import { router } from '../../main.js';
import ConfirmationModal from '../components/ConfirmationModal.js';
import { slotsRepository } from '../../public/repository/slotsRepository.js';

export default class SlotDetailPage {
  constructor(routerInstance, slotId) {
    this.slotId = slotId;
    this.template = null;
    this.slotData = null;
  }

  async loadTemplate() {
    if (this.template) return;
    Handlebars.registerHelper('eq', (a, b) => a === b);
    Handlebars.registerHelper('formatDate', (dateStr) => {
        return dateStr ? new Date(dateStr).toLocaleDateString('ru-RU') : '—';
    });

    try {
      const response = await fetch('/pages/slots/SlotDetailPage.hbs');
      if (!response.ok) throw new Error('Не удалось загрузить шаблон');
      this.template = Handlebars.compile(await response.text());
    } catch (error) {
      console.error(error);
      this.template = Handlebars.compile('<h1>Ошибка загрузки</h1>');
    }
  }

async render() {
    await this.loadTemplate();
    this.slotData = await slotsRepository.getById(this.slotId);
    
    if (!this.slotData) {
        return `<div class="error-page">Слот с ID ${this.slotId} не найден</div>`;
    }
    const generatedCode = await slotsRepository.getIntegrationCode(
        this.slotData.id, 
        this.slotData.format || 'vertical'
    );

    return this.template({ 
        slot: this.slotData,
        integrationCode: generatedCode
    });
  }

 attachEvents() {
    const getFormData = () => ({
        title: document.getElementById('slot-title-input')?.value,
        minPrice: document.getElementById('min-price')?.value,
        format: document.getElementById('ad-format')?.value,
        status: document.getElementById('slot-status-toggle')?.checked ? 'active' : 'paused',
        bgColor: document.getElementById('bg-color')?.value,
        textColor: document.getElementById('text-color')?.value
    });
    
    const titleInput = document.getElementById('slot-title-input');
    const editTitleBtn = document.getElementById('edit-title-btn');
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
        editTitleBtn?.addEventListener('click', () => { titleInput.focus(); });
    }
    
    const statusToggle = document.getElementById('slot-status-toggle');
    const statusText = document.getElementById('status-text');
    if (statusToggle && statusText) {
        const updateStatus = () => {
             if (statusToggle.checked) {
                statusText.textContent = "Активно";
                statusText.style.color = "#7C54E8";
             } else {
                statusText.textContent = "Приостановлено";
                statusText.style.color = "#A0AEC0";
             }
        };
        statusToggle.addEventListener('change', updateStatus);
        updateStatus();
    }
    
    const bgColorInput = document.getElementById('bg-color');
    const textColorInput = document.getElementById('text-color');
    const previewContent = document.querySelector('.preview-content'); 
    const previewTitle = document.getElementById('preview-title');
    const previewDesc = document.getElementById('preview-desc');
    const bgPreviewBox = document.getElementById('bg-color-preview');
    const textPreviewBox = document.getElementById('text-color-preview');

    const updatePreview = () => {
        if(bgColorInput) {
             document.getElementById('bg-color-text').textContent = bgColorInput.value;
             if (bgPreviewBox) bgPreviewBox.style.backgroundColor = bgColorInput.value;
             if (previewContent) previewContent.style.backgroundColor = bgColorInput.value;
        }
        if(textColorInput) {
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
            if (format === 'horizontal') previewCard.classList.add('preview-card--horizontal');
            else previewCard.classList.remove('preview-card--horizontal');
            
            if (format) formatSelect.classList.add('filled');
        });
    }
    
    const handleSave = async () => {
        const updatedData = getFormData();
        if (!updatedData.minPrice) {
            document.getElementById('min-price').style.borderColor = 'red';
            return; 
        }

        try {
            await slotsRepository.update(this.slotId, updatedData);
            new ConfirmationModal({
                message: 'Изменения успешно сохранены!',
                onConfirm: () => router.navigate('/projects')
            }).show();
        } catch (e) {
            console.error(e);
        }
    };
    
    document.getElementById('save-btn')?.addEventListener('click', handleSave);
    document.getElementById('save-draft-btn')?.addEventListener('click', handleSave);
    
    document.getElementById('generate-code-btn')?.addEventListener('click', async () => {
    const data = getFormData();
    
    // Проверяем обязательные поля
    if (!data.minPrice) {
        document.getElementById('min-price').style.borderColor = 'red';
        showCopyNotification('Укажите минимальную стоимость', 'error');
        return;
    }
    
    if (!data.format) {
        document.getElementById('ad-format').style.borderColor = 'red';
        showCopyNotification('Выберите формат объявления', 'error');
        return;
    }
    
    // Сначала обновляем слот с новыми данными
    try {
        // Показываем индикатор загрузки
        const generateBtn = document.getElementById('generate-code-btn');
        const originalText = generateBtn.textContent;
        generateBtn.textContent = 'Обновление...';
        generateBtn.disabled = true;
        
        // 1. Обновляем слот на сервере с новыми данными
        await slotsRepository.update(this.slotId, data);
        
        // 2. Получаем обновленный код для вставки
        const code = await slotsRepository.getIntegrationCode(this.slotId, data.format);
        const codeEl = document.getElementById('embed-code');
     if (codeEl && code) {
        // Очищаем элемент
        codeEl.innerHTML = '';
        
        // Создаем текстовый узел с кодом
        const textNode = document.createTextNode(code);
        codeEl.appendChild(textNode);
        
        // ИЛИ просто используем textContent
        // codeEl.textContent = code;
        
        codeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        showCopyNotification('Код успешно обновлен!');
    }
        
        // Показываем уведомление об успехе
        
        
    } catch (error) {
        console.error('Ошибка при обновлении кода:', error);
        showCopyNotification('Ошибка при обновлении кода', 'error');
    } finally {
        // Восстанавливаем кнопку
        const generateBtn = document.getElementById('generate-code-btn');
        if (generateBtn) {
            generateBtn.textContent = 'Код обновлен!';
            setTimeout(() => {
                generateBtn.textContent = 'Сгенерировать код для вставки';
                generateBtn.disabled = false;
            }, 2000);
        }
    }
});

    // ФУНКЦИЯ ДЛЯ КОПИРОВАНИЯ КОДА
    const attachCopyEvent = () => {
        const copyBtn = document.getElementById('copy-code-btn-1');
        if (copyBtn) {
            // Удаляем старое событие (если было)
            copyBtn.replaceWith(copyBtn.cloneNode(true));
            
            // Получаем новую кнопку
            const newCopyBtn = document.getElementById('copy-code-btn-1');
            
            newCopyBtn.addEventListener('click', () => {
                const codeElement = document.getElementById('embed-code');
                const codeText = codeElement?.innerText || codeElement?.textContent;
                
                // Проверяем, что код не является заглушкой
                if (!codeText || codeText.includes('ad-slot...')) {
                    showCopyNotification('Сначала сгенерируйте код', 'error');
                    return;
                }
                
                // Используем Clipboard API
                navigator.clipboard.writeText(codeText)
                    .then(() => {
                        // Показываем уведомление об успехе
                        showCopyNotification('Код скопирован!');
                        
                        // Меняем иконку кнопки на время
                        const originalHTML = newCopyBtn.innerHTML;
                        newCopyBtn.innerHTML = `
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 6L9 17L4 12" stroke="#7C54E8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        `;
                        
                        // Возвращаем исходную иконку через 2 секунды
                        setTimeout(() => {
                            newCopyBtn.innerHTML = originalHTML;
                        }, 2000);
                    })
                    .catch(err => {
                        console.error('Ошибка при копировании:', err);
                        showCopyNotification('Не удалось скопировать', 'error');
                    });
            });
        }
    };
    
    // Функция для показа уведомления
    const showCopyNotification = (message, type = 'success') => {
        // Удаляем старое уведомление, если есть
        const oldNotification = document.querySelector('.copy-notification');
        if (oldNotification) {
            oldNotification.remove();
        }

        // Создаем новое уведомление
        const notification = document.createElement('div');
        notification.className = `copy-notification ${type}`;
        
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
    
    // Привязываем событие копирования при инициализации
    attachCopyEvent();

    const optionsBtn = document.getElementById('options-trigger');
    const optionsMenu = document.getElementById('options-menu');
    if (optionsBtn && optionsMenu) {
        optionsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            optionsMenu.classList.toggle('show');
        });
        document.addEventListener('click', (e) => {
            if (!optionsBtn.contains(e.target) && !optionsMenu.contains(e.target)) {
                optionsMenu.classList.remove('show');
            }
        });

        document.getElementById('delete-slot-btn')?.addEventListener('click', () => {
             new ConfirmationModal({
                message: 'Удалить этот слот? Это действие нельзя отменить.',
                onConfirm: async () => {
                    await slotsRepository.delete(this.slotId);
                    router.navigate('/projects');
                }
             }).show();
        });
        
        document.getElementById('pause-slot-btn')?.addEventListener('click', () => {
             const toggle = document.getElementById('slot-status-toggle');
             if (toggle) {
                 toggle.checked = false;
                 toggle.dispatchEvent(new Event('change'));
             }
             optionsMenu.classList.remove('show');
        });
    }
    
    const goBack = (e) => { e.preventDefault(); router.navigate('/projects'); };
    document.getElementById('back-link-top')?.addEventListener('click', goBack);
    document.getElementById('back-btn-bottom')?.addEventListener('click', goBack);

    // Кнопка "Показать статистику"
    document.getElementById('show-stats-btn')?.addEventListener('click', () => {
      router.navigate(`/slots/${this.slotId}/statistics`);
    });
}
}