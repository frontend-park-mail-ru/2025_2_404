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
            alert('Ошибка при сохранении');
        }
    };
    document.getElementById('save-btn')?.addEventListener('click', handleSave);
    document.getElementById('save-draft-btn')?.addEventListener('click', handleSave);
    document.getElementById('generate-code-btn')?.addEventListener('click', async () => {
        const data = getFormData();
        const codeEl = document.getElementById('embed-code');
        const code = await slotsRepository.getIntegrationCode(this.slotId, data.format);
        
        if (codeEl) codeEl.textContent = code;
    });
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
  }
}