import ConfirmationModal from '../components/ConfirmationModal';
import AddFundsModal from '../components/modals/AddFundsModal'; 
import adsRepository from '../../public/repository/adsRepository';
// Импортируем репозиторий баланса
import balanceRepository from '../../public/repository/balanceRepository'; 
import { validateAdForm } from '../../public/utils/ValidateAdForm';
import type { HandlebarsTemplateDelegate, PageComponent, Ad, AddFundsModalProps } from '../../src/types';
import type Router from '../../services/Router';

interface ExtendedAddFundsModalProps extends AddFundsModalProps {
    title?: string;
    subtitle?: string;
    buttonText?: string;
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
  togglePreview: (show: boolean) => void;

  constructor(_routerInstance: Router, projectId: string) {
    this.projectId = projectId;
    this.toggleEditMode = this._toggleEditMode.bind(this);
    this.togglePreview = this._togglePreview.bind(this);
  }

  private _togglePreview(show: boolean): void {
    const formCard = document.getElementById('ads-edit-mode');
    const previewCard = document.getElementById('ads-preview-card');

    if (formCard && previewCard) {
      if (show) {
        formCard.classList.add('is-preview-hidden');
        previewCard.classList.add('is-active');
      } else {
        formCard.classList.remove('is-preview-hidden');
        previewCard.classList.remove('is-active');
      }
    }
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

    // Хелпер для форматирования даты
    Handlebars.registerHelper('formatDate', (dateStr: string, format: string) => {
      if (!dateStr) return '';
      // Игнорируем "нулевую" дату Go (0001-01-01)
      if (dateStr.startsWith('0001-01-01')) return '';
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        // Дополнительная проверка на нулевой год
        if (date.getFullYear() < 1970) return '';
        const pad = (n: number) => n.toString().padStart(2, '0');
        
        if (format === 'YYYY-MM-DD') {
          // Формат для date input
          return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
        } else if (format === 'DD.MM.YYYY') {
          // Формат для отображения (без времени)
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
      
      // Логика картинки "от обратного" (заглушка по умолчанию)
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

      this.project = { 
          id: adData.ID || adData.id || adData.add_id,
          title: adData.Title || adData.title,
          description: adData.Content || adData.content || adData.description,
          domain: adData.TargetUrl || adData.target_url || adData.domain,
          
          start_at: adData.StartAt || adData.start_at,
          end_at: adData.EndAt || adData.end_at,

          status: adData.Status || adData.status || 'non-active',
          budget: rawBudget,
          image_url: imageUrl,
          clicks: adData.Clicks ?? adData.clicks ?? 0,
          impressions: adData.Impressions ?? adData.impressions ?? 0
      } as Ad;

      console.log('Project Data mapped:', this.project);

      const isActive = this.project.status === 'active';
      const isLowBudget = rawBudget < 100;

      return this.template ? this.template({
        project: this.project,
        isNew: !this.project.id, 
        isActive: isActive,
        isLowBudget: isLowBudget,
        lastUpdated: null 
      }) : '';

    } catch (err) {
      console.error(`Ошибка при рендеринге проекта ID ${this.projectId}:`, err);
      return this.template ? this.template({ error: (err as Error).message || 'Не удалось загрузить проект' }) : '';
    }
  }

  attachEvents(): void {
    const statusToggle = document.getElementById('ad-status-toggle') as HTMLInputElement | null;
    const statusText = document.getElementById('status-text');
    const lockMsg = document.getElementById('status-lock-msg'); 
    const budgetInput = document.getElementById('budget-input') as HTMLInputElement | null;
    
    const startDateInput = document.getElementById('start-date-input') as HTMLInputElement | null;
    const endDateInput = document.getElementById('end-date-input') as HTMLInputElement | null;

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
            const modalProps: any = {
                title: 'Пополнение бюджета',
                subtitle: 'Введите сумму, на которую хотите увеличить бюджет',
                buttonText: 'Пополнить',
                // === ПРОВЕРКА БАЛАНСА В МОДАЛКЕ ===
                onConfirm: async (amount: number) => {
                    try {
                        // 1. Получаем данные баланса
                        const balanceData = await balanceRepository.getBalanceAndTransactions();
                        const currentBalance = balanceData.balance;

                        // 2. Если хотим пополнить больше, чем есть на счете
                        if (amount > currentBalance) {
                            new ConfirmationModal({ 
                                message: `Недостаточно средств на счете\nВаш баланс: ${currentBalance} ₽\nПополните счёт в разделе «Баланс»`, 
                                confirmText: 'ОК',
                                cancelText: 'Закрыть',
                                onConfirm: () => {} 
                            }).show();
                            // Прерываем выполнение, чтобы не отправлять запрос
                            return;
                        }

                        // 3. Если денег хватает — пополняем
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

    document.querySelector('#back-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.setItem('projects_tab', 'ads');
      routerInstance?.navigate('/projects');
    });

    // Обработчик хлебных крошек
    document.querySelector('#breadcrumb-ads')?.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.setItem('projects_tab', 'ads');
      routerInstance?.navigate('/projects');
    });

    document.querySelector('#ads-edit-btn')?.addEventListener('click', () => {
      this.toggleEditMode(true);
    });

    document.querySelector('#ads-back-btn')?.addEventListener('click', () => {
      this.toggleEditMode(false);
    });

    document.querySelector('#view-back-btn')?.addEventListener('click', () => {
      localStorage.setItem('projects_tab', 'ads');
      routerInstance?.navigate('/projects');
    });

    document.querySelector('#view-delete-btn')?.addEventListener('click', () => {
      this.handleDelete();
    });

    document.querySelector('#delete-btn')?.addEventListener('click', () => {
      this.handleDelete();
    });

    document.querySelector('#preview-toggle-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.togglePreview(true);
    });

    document.querySelector('#preview-back-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.togglePreview(false);
    });

    // === Логика сохранения (Edit) ===
    const editBtn = document.querySelector('#edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        const titleEl = document.getElementById('title-input') as HTMLInputElement | null;
        const descEl = document.getElementById('desc-input') as HTMLTextAreaElement | null;
        const siteEl = document.getElementById('site-input') as HTMLInputElement | null;
        const budgetEl = document.getElementById('budget-input') as HTMLInputElement | null;
        const statusEl = document.getElementById('ad-status-toggle') as HTMLInputElement | null;

        const title = titleEl?.value.trim() || '';
        const desc = descEl?.value.trim() || '';
        const site = siteEl?.value.trim() || '';
        const budget = budgetEl?.value.trim() || '';
        const status = statusEl?.checked ? 'active' : 'non-active';
        
        const startDate = startDateInput?.value || '';
        const endDate = endDateInput?.value || '';

        const imgFile = this.selectedFile;

        // Очищаем предыдущие ошибки
        document.querySelectorAll('.error-message').forEach((el) => {
          el.textContent = '';
        });
        document.querySelectorAll('.input--error').forEach((el) =>
          el.classList.remove('input--error')
        );

        const errors = validateAdForm({ 
            title, 
            description: desc, 
            domain: site, 
            budget, 
            file: imgFile,
            start_at: startDate,
            end_at: endDate
        });

        const fieldMap: Record<string, string> = {
          title: 'title-input',
          description: 'desc-input',
          domain: 'site-input',
          budget: 'budget-input',
          image: 'img-file',
          start_at: 'start-date-input',
          end_at: 'end-date-input'
        };

        if (Object.keys(errors).length > 0) {
          for (const [key, msg] of Object.entries(errors)) {
            const inputId = fieldMap[key];
            const input = document.getElementById(inputId);
            const errorEl = document.getElementById(`error-${inputId}`);
            if (input && msg) {
              input.classList.add('input--error');
              if (errorEl) {
                errorEl.textContent = msg;
              }
            }
          }
          console.warn('Ошибки валидации:', errors);
          return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', desc); 
        formData.append('target_url', site); 
        formData.append('status', status); 
        
        if (startDate) {
            formData.append('start_at', new Date(startDate).toISOString().replace('.000Z', 'Z'));
        }
        if (endDate) {
            formData.append('end_at', new Date(endDate).toISOString().replace('.000Z', 'Z'));
        }

        if (imgFile) {
          formData.append('image', imgFile);
        }

        try {
          if (!this.project || !this.project.id) {
             await adsRepository.create(formData);
          } else {
             await adsRepository.update(this.projectId, formData);
          }
          
          new ConfirmationModal({
            message: 'Изменения сохранены!',
            onConfirm: () => {
              localStorage.setItem('projects_tab', 'ads');
              routerInstance?.navigate('/projects');
            },
          }).show();
        } catch (err) {
          console.error('Ошибка при сохранении:', err);
        }
      });
    }

    const titleInput = document.querySelector('#title-input') as HTMLInputElement | null;
    const descInput = document.querySelector('#desc-input') as HTMLTextAreaElement | null;
    const imgInput = document.getElementById('img-file') as HTMLInputElement | null;
    const previewTitle = document.querySelector('.ads__preview-card h4');
    const previewDesc = document.querySelector('.ads__preview-card p');
    const previewImg = document.querySelector('.ads__preview-image') as HTMLImageElement | null;

    titleInput?.addEventListener('input', () => {
      if (previewTitle) previewTitle.textContent = titleInput.value || 'Без названия';
    });

    descInput?.addEventListener('input', () => {
      if (previewDesc) previewDesc.textContent = descInput.value || 'Без описания';
    });

    // imgInput?.addEventListener('change', (e) => {
    //   const target = e.target as HTMLInputElement;
    //   const file = target.files?.[0];
    //   if (file) {
    //     this.selectedFile = file;
    //     const reader = new FileReader();
    //     reader.onload = (event) => {
    //       if (previewImg && event.target?.result) previewImg.src = event.target.result as string;
    //     };
    //     reader.readAsDataURL(file);
    //   }
    // });

    const uploadBox = document.getElementById('upload-box');
    const DEFAULT_IMG = '/public/assets/default.jpg';
    let skipModalCheck = false; // Флаг для пропуска проверки после подтверждения

    // Перехватываем клик на область загрузки
    uploadBox?.addEventListener('click', (e) => {
      // Если клик программный (после подтверждения в модалке) — пропускаем
      if (skipModalCheck) {
        skipModalCheck = false;
        return;
      }

      const hasExistingImage = this.project?.image_url && this.project.image_url !== DEFAULT_IMG;
      
      if (hasExistingImage) {
        e.preventDefault(); // Блокируем открытие диалога выбора файла
        
        new ConfirmationModal({
          message: 'У объявления уже есть изображение, хотите заменить текущее?',
          confirmText: 'Заменить',
          cancelText: 'Оставить текущее',
          onConfirm: () => {
            // Устанавливаем флаг и программно открываем диалог
            skipModalCheck = true;
            imgInput?.click();
          },
          onCancel: () => {}
        }).show();
      }
      // Если изображения нет — клик проходит как обычно и открывает диалог
    });

    // Обработчик выбора файла — с валидацией размера и типа
    imgInput?.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      const imageError = document.querySelector('#error-img-file');
      
      if (!file) return;
      
      const maxSizeBytes = 10 * 1024 * 1024; // 10 МБ
      const allowedTypes = ['image/jpeg', 'image/png'];
      
      // Очистка предыдущей ошибки
      if (imageError) imageError.textContent = '';
      imgInput.classList.remove('input--error');
      
      if (!allowedTypes.includes(file.type)) {
        if (imageError) imageError.textContent = 'Поддерживаются только JPG или PNG';
        imgInput.classList.add('input--error');
        target.value = '';
        return;
      }
      
      if (file.size > maxSizeBytes) {
        if (imageError) imageError.textContent = 'Размер файла не должен превышать 10 МБ';
        imgInput.classList.add('input--error');
        target.value = '';
        return;
      }
    
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (event) => {
        if (previewImg && event.target?.result) {
          previewImg.src = event.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    });
  }

  handleDelete(): void {
    if (!this.project) return;
    const modal = new ConfirmationModal({
      message: `Вы уверены, что хотите удалить "${this.project.title}"?`,
      onConfirm: async () => {
        try {
          await adsRepository.delete(this.projectId);
          localStorage.setItem('projects_tab', 'ads');
          routerInstance?.navigate('/projects');
        } catch (err) {
          console.error('Ошибка при удалении:', err);
        }
      },
    });
    modal.show();
  }
}