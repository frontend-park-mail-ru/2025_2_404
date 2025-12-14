import ConfirmationModal from '../components/ConfirmationModal';
import AddFundsModal from '../components/modals/AddFundsModal'; 
import adsRepository from '../../public/repository/adsRepository';
import { validateAdForm } from '../../public/utils/ValidateAdForm';
import type { HandlebarsTemplateDelegate, PageComponent, Ad, AddFundsModalProps } from '../../src/types';
import type Router from '../../services/Router';

// Расширяем интерфейс пропсов для модалки, чтобы TS не ругался на новые текстовые поля
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
      // 1. Получаем сырой ответ от репозитория
      const response = await adsRepository.getById(this.projectId) as any;
      
      console.log('🔥 RAW RESPONSE:', response); 

      // 2. Ищем объект объявления внутри ответа (защита от разной вложенности)
      let adData: any = {};

      if (response?.data?.ad) {
          adData = response.data.ad;
      } else if (response?.ad) {
          adData = response.ad;
      } else {
          adData = response || {};
      }

      // 3. Достаем бюджет. Number(...) защищает от null/undefined
      const rawBudget = Number(adData.budget ?? adData.amount ?? adData.amount_for_ad ?? 0);
      
      console.log(`🔥 BUDGET FOUND: ${rawBudget}`);

      // 4. Обработка картинки
      const DEFAULT_IMG = '/public/assets/default.jpg';
      let imageUrl = adData.image_url || '';
      
      const imageData = response?.data?.imageData || response?.imageData;
      
      if (!imageUrl && imageData && imageData.image_data) {
          imageUrl = `data:${imageData.image_type || 'image/jpeg'};base64,${imageData.image_data}`;
      } else if (!imageUrl) {
          imageUrl = DEFAULT_IMG;
      } else if (
        !imageUrl.startsWith('data:image') &&
        !imageUrl.startsWith('http') &&
        !imageUrl.startsWith('/')
      ) {
        imageUrl = `data:image/jpeg;base64,${imageUrl}`;
      }

      // 5. Собираем итоговый объект
      this.project = { 
          ...adData, 
          budget: rawBudget, 
          image_url: imageUrl 
      } as Ad;

      // Рассчитываем флаги для шаблона
      const isActive = this.project.status === 'active';
      const isLowBudget = rawBudget < 100;

      return this.template ? this.template({
        project: this.project,
        isNew: !adData.id, 
        isActive: isActive,
        isLowBudget: isLowBudget,
        lastUpdated: !navigator.onLine && (this.project as any)?.timestamp ? (this.project as any).timestamp : null,
      }) : '';

    } catch (err) {
      console.error(`Ошибка при рендеринге проекта ID ${this.projectId}:`, err);
      return this.template ? this.template({ error: (err as Error).message || 'Не удалось загрузить проект' }) : '';
    }
  }

  attachEvents(): void {
    // Элементы управления статусом и бюджетом
    const statusToggle = document.getElementById('ad-status-toggle') as HTMLInputElement | null;
    const statusText = document.getElementById('status-text');
    const lockMsg = document.getElementById('status-lock-msg'); 
    const budgetInput = document.getElementById('budget-input') as HTMLInputElement | null;

    // --- ФУНКЦИЯ: Проверка бюджета и блокировка статуса ---
    const checkBudgetAndLockStatus = () => {
        if (!statusToggle || !lockMsg || !budgetInput) return;

        // Берем актуальное значение из инпута
        const currentBudget = parseFloat(budgetInput.value) || 0;

        if (currentBudget < 100) {
            // Бюджет мал: блокируем переключатель
            statusToggle.disabled = true;
            // Если он был включен, визуально выключаем (но не меняем на сервере пока не нажмет сохранить, 
            // хотя логичнее запретить активацию)
            if (statusToggle.checked) {
                 statusToggle.checked = false; 
                 // Обновляем текст
                 if (statusText) {
                    statusText.textContent = "Приостановлено";
                    statusText.style.color = "#A0AEC0";
                 }
            }
            lockMsg.style.display = 'block';
        } else {
            // Бюджет ок: разблокируем
            statusToggle.disabled = false;
            lockMsg.style.display = 'none';
        }
    };

    // Запускаем проверку при инициализации
    checkBudgetAndLockStatus();

    // Обработчик переключения тумблера (меняет цвет и текст)
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

    // --- ЛОГИКА ПОПОЛНЕНИЯ БЮДЖЕТА ---
    const addBudgetBtn = document.getElementById('add-budget-btn');
    if (addBudgetBtn) {
        addBudgetBtn.addEventListener('click', () => {
            // Настройка модалки с кастомными текстами
            const modalProps: any = {
                title: 'Пополнение бюджета',
                subtitle: 'Введите сумму, на которую хотите увеличить бюджет',
                buttonText: 'Пополнить',
                onConfirm: async (amount: number) => {
                    try {
                        // 1. Отправляем запрос
                        await adsRepository.addBudget(this.projectId, amount);
                        
                        if (this.project) {
                            // 2. Считаем новый бюджет
                            const currentBudget = Number(this.project.budget) || 0;
                            const newBudget = currentBudget + amount;
                            
                            // 3. Обновляем модель и UI
                            this.project.budget = newBudget; 
                            if (budgetInput) {
                                budgetInput.value = String(newBudget);
                            }

                            // 4. ВАЖНО: Проверяем, можно ли разблокировать статус
                            checkBudgetAndLockStatus();

                            new ConfirmationModal({ 
                                message: `Бюджет успешно пополнен на ${amount}₽`, 
                                onConfirm: () => {} 
                            }).show();
                        }
                    } catch (e) {
                        console.error(e);
                        alert("Ошибка при пополнении. Возможно, недостаточно средств на основном счете.");
                    }
                },
                onCancel: () => {}
            };
            
            const modal = new AddFundsModal(modalProps);
            modal.show();
        });
    }

    // --- НАВИГАЦИЯ И УПРАВЛЕНИЕ ---
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

    // --- СОХРАНЕНИЕ ФОРМЫ ---
    const editBtn = document.querySelector('#edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        const titleEl = document.getElementById('title-input') as HTMLInputElement | null;
        const descEl = document.getElementById('desc-input') as HTMLTextAreaElement | null;
        const siteEl = document.getElementById('site-input') as HTMLInputElement | null;
        const budgetEl = document.getElementById('budget-input') as HTMLInputElement | null;
        
        // Статус берем из чекбокса
        const statusEl = document.getElementById('ad-status-toggle') as HTMLInputElement | null;

        const title = titleEl?.value.trim() || '';
        const desc = descEl?.value.trim() || '';
        const site = siteEl?.value.trim() || '';
        const budget = budgetEl?.value.trim() || '';
        
        // Определяем статус. Если чекбокс заблокирован (бюджет < 100), он скорее всего false.
        const status = statusEl?.checked ? 'active' : 'non-active';
        
        const imgFile = this.selectedFile;

        // Валидация
        document.querySelectorAll('.error-message').forEach((el) => el.remove());
        document.querySelectorAll('.input--error').forEach((el) =>
          el.classList.remove('input--error')
        );

        const errors = validateAdForm({ title, description: desc, domain: site, budget, file: imgFile });

        const fieldMap: Record<string, string> = {
          title: 'title-input',
          description: 'desc-input',
          domain: 'site-input',
          budget: 'budget-input',
          image: 'img-file',
        };

        if (Object.keys(errors).length > 0) {
          for (const [key, msg] of Object.entries(errors)) {
            const input = document.getElementById(fieldMap[key]);
            if (input && msg) {
              input.classList.add('input--error');
              const err = document.createElement('small');
              err.textContent = msg;
              err.classList.add('error-message');
              input.insertAdjacentElement('afterend', err);
            }
          }
          console.warn('Ошибки валидации:', errors);
          return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', desc);
        formData.append('target_url', site);
        formData.append('budget', budget); 
        formData.append('status', status); 
        
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
            onConfirm: () => routerInstance?.navigate('/projects'),
          }).show();
        } catch (err) {
          console.error('Ошибка при сохранении:', err);
        }
      });
    }

    // --- ПРЕВЬЮ ---
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

    imgInput?.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        this.selectedFile = file;
        const reader = new FileReader();
        reader.onload = (event) => {
          if (previewImg && event.target?.result) previewImg.src = event.target.result as string;
        };
        reader.readAsDataURL(file);
      }
    });
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