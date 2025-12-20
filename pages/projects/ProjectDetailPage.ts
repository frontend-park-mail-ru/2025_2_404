import ConfirmationModal from '../components/ConfirmationModal';
import AddFundsModal from '../components/modals/AddFundsModal'; 
import adsRepository from '../../public/repository/adsRepository';
import balanceRepository from '../../public/repository/balanceRepository'; 
import type { HandlebarsTemplateDelegate, PageComponent, Ad } from '../../src/types';
import type Router from '../../services/Router';

interface ExtendedAddFundsModalProps {
    title?: string;
    subtitle?: string;
    buttonText?: string;
    onConfirm: (amount: number) => void;
    onCancel: () => void;
}

let routerInstance: Router | null = null;

export function setProjectDetailRouter(r: Router): void {
  routerInstance = r;
}

export default class ProjectDetailPage implements PageComponent {
  projectId: string;
  template: HandlebarsTemplateDelegate | null = null;
  project: Ad | null = null;
  selectedFile: File | null = null;
  toggleEditMode: (show: boolean) => void;

  constructor(_routerInstance: Router, projectId: string) {
    this.projectId = projectId;
    this.toggleEditMode = this._toggleEditMode.bind(this);
  }

  private _toggleEditMode(show: boolean): void {
    const viewMode = document.getElementById('ads-view-mode');
    const editMode = document.getElementById('ads-edit-mode');

    if (viewMode && editMode) {
      if (show) {
        viewMode.classList.add('is-hidden');
        editMode.classList.add('is-active');
      } else {
        viewMode.classList.remove('is-hidden');
        editMode.classList.remove('is-active');
      }
    }
  }

  async loadTemplate(): Promise<void> {
    if (this.template) return;

    Handlebars.registerHelper('formatDate', (dateStr: string, format: string) => {
      if (!dateStr) return '';
      if (dateStr.startsWith('0001-01-01')) return '';
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        if (date.getFullYear() < 1970) return '';
        const pad = (n: number) => n.toString().padStart(2, '0');
        
        if (format === 'YYYY-MM-DD') {
          return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
        } else if (format === 'DD.MM.YYYY') {
          return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
        }
        return dateStr;
      } catch {
        return '';
      }
    });

    try {
      const response = await fetch('/pages/projects/ProjectDetailPage.hbs');
      if (!response.ok) throw new Error('Не удалось загрузить шаблон ProjectDetailPage');
      this.template = Handlebars.compile(await response.text());
    } catch (error) {
      console.error(error);
      this.template = Handlebars.compile('<h1>Ошибка загрузки шаблона</h1>');
    }
  }

async render(): Promise<string> {
  await this.loadTemplate();
  try {
    const response: any = await adsRepository.getById(this.projectId);
    let adData: any = {};

    if (response?.data?.ad) {
        adData = response.data.ad;
    } else if (response?.ad) {
        adData = response.ad;
    } else {
        adData = response || {};
    }

    const rawBudget = Number(adData.Budget ?? adData.budget ?? 0);
    
    const DEFAULT_IMG = '/public/assets/default.jpg';
    let imageUrl = DEFAULT_IMG;

    const rawImg = adData.ImgPath || adData.img_path || adData.image_url || '';
    const imageData = response?.data?.imageData || response?.imageData;

    if (imageData && imageData.image_data) {
        imageUrl = `data:${imageData.content_type || 'image/jpeg'};base64,${imageData.image_data}`;
    } else if (rawImg && (rawImg.startsWith('http') || rawImg.startsWith('/') || rawImg.startsWith('data:'))) {
        imageUrl = rawImg;
    } else if (rawImg) {
        imageUrl = `data:image/jpeg;base64,${rawImg}`;
    }

    // Получаем статистику
    const clicks = adData.Clicks ?? adData.clicks ?? 0;
    const impressions = adData.Impressions ?? adData.impressions ?? 0;
    
    // Если статистики нет в основном объекте, можно попробовать получить отдельно
    let stats = { clicks, impressions };
    try {
      // Попробовать получить статистику отдельным запросом, если есть такой метод
      // const statsResponse = await adsRepository.getStats(this.projectId);
      // if (statsResponse) stats = statsResponse;
    } catch (err) {
      console.warn('Не удалось получить статистику:', err);
    }

    this.project = { 
        id: adData.ID || adData.id || adData.add_id,
        title: adData.Title || adData.title || '',
        headline: adData.Headline || adData.headline || '',
        description: adData.Content || adData.content || adData.description || '',
        domain: adData.TargetUrl || adData.target_url || adData.domain || '',
        start_at: adData.StartAt || adData.start_at || '',
        end_at: adData.EndAt || adData.end_at || '',
        status: adData.Status || adData.status || 'non-active',
        budget: rawBudget,
        image_url: imageUrl,
        clicks: stats.clicks,
        impressions: stats.impressions,
        ctr: clicks > 0 && impressions > 0 ? (clicks / impressions * 100).toFixed(2) : '0.00'
    } as Ad;

    const isActive = this.project.status === 'active';
    const isLowBudget = rawBudget < 100;

    return this.template ? this.template({
      project: this.project,
      isNew: false,
      isActive: isActive,
      isLowBudget: isLowBudget,
      lastUpdated: null,
      hasStats: true  // Флаг для показа статистики
    }) : '';

  } catch (err) {
    console.error(`Ошибка при рендеринге проекта ID ${this.projectId}:`, err);
    return this.template ? this.template({ error: (err as Error).message || 'Не удалось загрузить проект' }) : '';
  }
}

  // === ФУНКЦИИ ДЛЯ РАБОТЫ С ЗАГРУЗКОЙ ФАЙЛОВ ===
  private showFilePreview(file: File): void {
    const filePreview = document.getElementById('uploaded-file-preview');
    const uploadBox = document.getElementById('upload-box');
    const fileThumb = document.getElementById('uploaded-file-thumb') as HTMLImageElement | null;
    const fileNameEl = document.getElementById('uploaded-file-name');
    const fileTypeEl = document.getElementById('uploaded-file-type');
    
    if (!filePreview || !uploadBox) return;
    
    const name = file.name;
    const ext = name.split('.').pop()?.toLowerCase() || '';
    
    let typeText = 'Файл';
    if (file.type.startsWith('image/')) {
      typeText = ext.toUpperCase() + ' изображение';
    }
    
    if (fileNameEl) fileNameEl.textContent = name;
    if (fileTypeEl) fileTypeEl.textContent = typeText;
    
    if (fileThumb && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) fileThumb.src = e.target.result as string;
      };
      reader.readAsDataURL(file);
    }
    
    filePreview.style.display = 'flex';
    uploadBox.classList.add('hidden');
  }

  private resetFilePreview(): void {
    this.selectedFile = null;
    const filePreview = document.getElementById('uploaded-file-preview');
    const uploadBox = document.getElementById('upload-box');
    
    if (filePreview && uploadBox) {
      filePreview.style.display = 'none';
      uploadBox.classList.remove('hidden');
    }
    
    const imgInput = document.getElementById('img-file') as HTMLInputElement;
    if (imgInput) imgInput.value = '';
    
    const errorEl = document.getElementById('error-img-file');
    if (errorEl) errorEl.textContent = '';
  }

  private initFileUploadArea(): void {
    const filePreview = document.getElementById('uploaded-file-preview');
    const uploadBox = document.getElementById('upload-box');
    const fileNameEl = document.getElementById('uploaded-file-name');
    const fileTypeEl = document.getElementById('uploaded-file-type');
    const fileThumb = document.getElementById('uploaded-file-thumb') as HTMLImageElement | null;
    
    if (!this.project || !filePreview || !uploadBox) return;
    
    const DEFAULT_IMG = '/public/assets/default.jpg';
    
    if (this.project.image_url && this.project.image_url !== DEFAULT_IMG) {
      filePreview.style.display = 'flex';
      uploadBox.classList.add('hidden');
      
      if (fileNameEl) {
        let fileName = 'Изображение';
        const url = this.project.image_url;
        
        if (url.startsWith('data:')) {
          fileName = 'Изображение.png';
        } else if (url.includes('/')) {
          const parts = url.split('/');
          fileName = parts[parts.length - 1] || 'Изображение';
        }
        
        fileNameEl.textContent = fileName;
      }
      
      if (fileTypeEl) {
        fileTypeEl.textContent = 'PNG изображение';
      }
      
      if (fileThumb) {
        fileThumb.src = this.project.image_url;
      }
    } else {
      filePreview.style.display = 'none';
      uploadBox.classList.remove('hidden');
    }
  }

  attachEvents(): void {
    const statusToggle = document.getElementById('ad-status-toggle') as HTMLInputElement | null;
    const statusText = document.getElementById('status-text');
    const lockMsg = document.getElementById('status-lock-msg'); 
    const budgetInput = document.getElementById('budget-input') as HTMLInputElement | null;
    const startDateInput = document.getElementById('start-date-input') as HTMLInputElement | null;
    const endDateInput = document.getElementById('end-date-input') as HTMLInputElement | null;

    const headlineInput = document.getElementById('headline-input') as HTMLInputElement | null;
    const descInput = document.getElementById('desc-input') as HTMLTextAreaElement | null;
    const siteInput = document.getElementById('site-input') as HTMLInputElement | null;
    const imgInput = document.getElementById('img-file') as HTMLInputElement | null;
    const previewTitle = document.getElementById('ad-preview-title');
    const previewDesc = document.getElementById('ad-preview-desc');
    const previewImg = document.getElementById('ad-preview-img') as HTMLImageElement | null;
    const errorEl = document.getElementById('error-img-file');

    // === ИНИЦИАЛИЗАЦИЯ ПРЕВЬЮ ИЗОБРАЖЕНИЯ ===
    if (this.project && previewImg) {
      previewImg.src = this.project.image_url;
    }
    
    // === ИНИЦИАЛИЗАЦИЯ ОБЛАСТИ ЗАГРУЗКИ ФАЙЛА ===
    this.initFileUploadArea();

    // === ПРЯМАЯ СВЯЗЬ: ВВОД → ПРЕВЬЮ ===
    headlineInput?.addEventListener('input', () => {
      if (previewTitle) {
        previewTitle.textContent = headlineInput.value.trim() || 'Заголовок объявления';
      }
    });

    descInput?.addEventListener('input', () => {
      if (previewDesc) {
        previewDesc.textContent = descInput.value.trim() || 'Описание';
      }
    });

    // === ЛОГИКА БЮДЖЕТА И СТАТУСА ===
    const checkBudgetAndLockStatus = () => {
        if (!statusToggle || !lockMsg || !budgetInput) return;
        const currentBudget = parseFloat(budgetInput.value) || 0;
        if (currentBudget < 100) {
            statusToggle.disabled = true;
            if (statusToggle.checked) {
                statusToggle.checked = false; 
                if (statusText) {
                    statusText.textContent = "Приостановлено";
                    statusText.style.color = "#A0AEC0";
                }
            }
            lockMsg.style.display = 'block';
        } else {
            statusToggle.disabled = false;
            lockMsg.style.display = 'none';
        }
    };
    checkBudgetAndLockStatus();

    if (statusToggle && statusText) {
      statusToggle.addEventListener('change', () => {
        if (statusToggle.checked) {
          statusText.textContent = "Активно";
          statusText.style.color = "#7C54E8"; 
        } else {
          statusText.textContent = "Приостановлено";
          statusText.style.color = "#A0AEC0"; 
        }
      });
    }

    const addBudgetBtn = document.getElementById('add-budget-btn');
    if (addBudgetBtn) {
        addBudgetBtn.addEventListener('click', () => {
            const modalProps: ExtendedAddFundsModalProps = {
                title: 'Пополнение бюджета',
                subtitle: 'Введите сумму, на которую хотите увеличить бюджет',
                buttonText: 'Пополнить',
                onConfirm: async (amount: number) => {
                    try {
                        const balanceData = await balanceRepository.getBalanceAndTransactions();
                        const currentBalance = balanceData.balance;
                        if (amount > currentBalance) {
                            new ConfirmationModal({ 
                                message: `Недостаточно средств на счете\nВаш баланс: ${currentBalance} ₽\nПополните счёт в разделе «Баланс»`, 
                                confirmText: 'ОК',
                                cancelText: 'Закрыть',
                                onConfirm: () => {} 
                            }).show();
                            return;
                        }
                        await adsRepository.addBudget(this.projectId, amount);
                        if (this.project) {
                            const currentBudget = Number(this.project.budget) || 0;
                            const newBudget = currentBudget + amount;
                            this.project.budget = newBudget; 
                            if (budgetInput) {
                                budgetInput.value = String(newBudget);
                            }
                            checkBudgetAndLockStatus();
                            new ConfirmationModal({ 
                                message: `Бюджет успешно пополнен на ${amount}₽`, 
                                onConfirm: () => {} 
                            }).show();
                        }
                    } catch (e) {
                        console.error('Ошибка пополнения:', e);
                    }
                },
                onCancel: () => {}
            };
            const modal = new AddFundsModal(modalProps);
            modal.show();
        });
    }

    // === КНОПКИ НАЗАД ===
    document.querySelector('#back-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      routerInstance?.navigate('/projects');
    });

    document.querySelector('#ads-edit-btn')?.addEventListener('click', () => {
      this.toggleEditMode(true);
    });

    document.querySelector('#ads-back-btn')?.addEventListener('click', () => {
      this.toggleEditMode(false);
    });

    document.querySelector('#view-back-btn')?.addEventListener('click', () => {
      routerInstance?.navigate('/projects');
    });

    document.querySelector('#delete-btn')?.addEventListener('click', () => {
      this.handleDelete();
    });

    // === ЗАГРУЗКА ИЗОБРАЖЕНИЯ С ПРОВЕРКОЙ ===
    const uploadBox = document.getElementById('upload-box');
    const DEFAULT_IMG = '/public/assets/default.jpg';
    let skipModalCheck = false;

    uploadBox?.addEventListener('click', (e) => {
      if (skipModalCheck) {
        skipModalCheck = false;
        return;
      }
      const hasExistingImage = this.project?.image_url && this.project.image_url !== DEFAULT_IMG;
      if (hasExistingImage) {
        e.preventDefault(); 
        new ConfirmationModal({
          message: 'У объявления уже есть изображение, хотите заменить текущее?',
          confirmText: 'Заменить',
          cancelText: 'Оставить текущее',
          onConfirm: () => {
            skipModalCheck = true;
            imgInput?.click();
          },
          onCancel: () => {}
        }).show();
      }
    });

    imgInput?.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        this.resetFilePreview();
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png'];
      const maxSize = 10 * 1024 * 1024;

      if (errorEl) errorEl.textContent = '';
      if (imgInput) imgInput.classList.remove('input--error');

      if (!allowedTypes.includes(file.type)) {
        if (errorEl) errorEl.textContent = 'Поддерживаются только JPG или PNG';
        if (imgInput) imgInput.classList.add('input--error');
        this.resetFilePreview();
        return;
      }

      if (file.size > maxSize) {
        if (errorEl) errorEl.textContent = 'Макс. размер — 10 МБ';
        if (imgInput) imgInput.classList.add('input--error');
        this.resetFilePreview();
        return;
      }

      const img = new Image();
      const reader = new FileReader();

      reader.onerror = () => {
        if (errorEl) errorEl.textContent = 'Ошибка чтения файла';
        this.resetFilePreview();
      };

      reader.onload = (event) => {
        img.src = event.target?.result as string;
        
        img.onload = () => {
          this.selectedFile = file;
          if (previewImg) previewImg.src = img.src;
          this.showFilePreview(file);
        };
        
        img.onerror = () => {
          if (errorEl) errorEl.textContent = 'Файл не является изображением';
          this.resetFilePreview();
        };
      };

      reader.readAsDataURL(file);
    });

    // === КНОПКА УДАЛЕНИЯ ФАЙЛА ===
    const removeBtn = document.getElementById('remove-uploaded-file');
    removeBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.resetFilePreview();
      if (previewImg) previewImg.src = DEFAULT_IMG;
    });

    // === КНОПКА СОХРАНЕНИЯ ===
    const editBtn = document.querySelector('#edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        const headline = headlineInput?.value.trim() || '';
        const projectName = headline;
        const desc = descInput?.value.trim() || '';
        const site = siteInput?.value.trim() || '';
        const budget = budgetInput?.value.trim() || '';
        const status = statusToggle?.checked ? 'active' : 'non-active';
        const startDate = startDateInput?.value || '';
        const endDate = endDateInput?.value || '';

        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
        document.querySelectorAll('.input--error').forEach(el => el.classList.remove('input--error'));

        let hasError = false;

        if (!headline) {
          headlineInput?.classList.add('input--error');
          document.getElementById('error-headline-input')!.textContent = 'Заголовок объявления обязателен';
          hasError = true;
        } else if (headline.length < 3) {
          headlineInput?.classList.add('input--error');
          document.getElementById('error-headline-input')!.textContent = 'Минимум 3 символа';
          hasError = true;
        } else if (headline.length > 50) {
          headlineInput?.classList.add('input--error');
          document.getElementById('error-headline-input')!.textContent = 'Максимум 50 символов';
          hasError = true;
        }

        if (!desc) {
          descInput?.classList.add('input--error');
          document.getElementById('error-desc-input')!.textContent = 'Описание обязательно';
          hasError = true;
        }

        if (!site) {
          siteInput?.classList.add('input--error');
          document.getElementById('error-site-input')!.textContent = 'Ссылка обязательна';
          hasError = true;
        } else if (!site.startsWith('http')) {
          siteInput?.classList.add('input--error');
          document.getElementById('error-site-input')!.textContent = 'Ссылка должна начинаться с http:// или https://';
          hasError = true;
        }

        if (!startDate) {
          startDateInput?.classList.add('input--error');
          document.getElementById('error-start-date-input')?.remove();
          const el = document.createElement('div');
          el.id = 'error-start-date-input';
          el.className = 'error-message';
          el.textContent = 'Дата начала обязательна';
          startDateInput?.parentNode?.appendChild(el);
          hasError = true;
        }

        if (!endDate) {
          endDateInput?.classList.add('input--error');
          document.getElementById('error-end-date-input')?.remove();
          const el = document.createElement('div');
          el.id = 'error-end-date-input';
          el.className = 'error-message';
          el.textContent = 'Дата окончания обязательна';
          endDateInput?.parentNode?.appendChild(el);
          hasError = true;
        }

        if (hasError) {
          console.warn('Есть ошибки валидации');
          return;
        }

        const formData = new FormData();
        formData.append('title', projectName);
        formData.append('headline', headline);
        formData.append('content', desc);
        formData.append('target_url', site);
        formData.append('status', status);

        if (budget) {
          formData.append('budget', budget);
        }

        if (startDate) {
          formData.append('start_at', new Date(startDate).toISOString().replace(/\.\d+Z$/, 'Z'));
        }
        if (endDate) {
          formData.append('end_at', new Date(endDate).toISOString().replace(/\.\d+Z$/, 'Z'));
        }

        if (this.selectedFile) {
          formData.append('image', this.selectedFile, this.selectedFile.name);
          console.log('Файл добавляется в FormData:', this.selectedFile.name, this.selectedFile.size);
        } else {
          console.log('Новый файл не выбран, изображение останется прежним');
        }

        // Для отладки
        console.log('Отправляемые данные:');
        for (let [key, value] of formData.entries()) {
          if (value instanceof File) {
            console.log(`${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
          } else {
            console.log(`${key}: ${value}`);
          }
        }

        try {
          await adsRepository.update(this.projectId, formData);
          new ConfirmationModal({
            message: 'Изменения сохранены!',
            onConfirm: () => routerInstance?.navigate('/projects'),
          }).show();
        } catch (err) {
          console.error('Ошибка при сохранении:', err);
          new ConfirmationModal({
            message: 'Не удалось сохранить изменения. Попробуйте позже.',
            onConfirm: () => {},
          }).show();
        }
      });
    }
  }

  handleDelete(): void {
    if (!this.project) return;
    const modal = new ConfirmationModal({
      message: `Вы уверены, что хотите удалить "${this.project.title}"?`,
      onConfirm: async () => {
        try {
          await adsRepository.delete(this.projectId);
          routerInstance?.navigate('/projects');
        } catch (err) {
          console.error('Ошибка при удалении:', err);
        }
      },
    });
    modal.show();
  }
}