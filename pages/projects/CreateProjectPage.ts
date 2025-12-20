import ConfirmationModal from '../components/ConfirmationModal';
import AddFundsModal from '../components/modals/AddFundsModal';
import { validateAdForm } from '../../public/utils/ValidateAdForm';
import adsRepository from '../../public/repository/adsRepository';
import balanceRepository from '../../public/repository/balanceRepository';
import type { HandlebarsTemplateDelegate, PageComponent } from '../../src/types';
import type Router from '../../services/Router';

let routerInstance: Router | null = null;
let selectedFile: File | null = null;

export function setCreateProjectRouter(r: Router): void {
  routerInstance = r;
}

export default class CreateProjectPage implements PageComponent {
  template: HandlebarsTemplateDelegate | null = null;
  selectedFile: File | null = null;

  togglePreview: (show: boolean) => void;

  constructor() {
    this.togglePreview = this._togglePreview.bind(this);
  }

  private _togglePreview(show: boolean): void {
    const formCard = document.getElementById('ads-edit-mode');
    const previewCard = document.getElementById('ad-preview-card'); // ← Исправлен ID

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

  async loadTemplate(): Promise<void> {
    if (this.template) return;

    // Хелпер для форматирования даты
    Handlebars.registerHelper('formatDate', (dateStr: string, format: string) => {
      if (!dateStr) return '';
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
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
      if (!response.ok) throw new Error('Не удалось загрузить шаблон');
      this.template = Handlebars.compile(await response.text());
    } catch (error) {
      console.error(error);
      this.template = Handlebars.compile('<h1>Ошибка загрузки страницы</h1>');
    }
  }

async render(): Promise<string> {
  await this.loadTemplate();

  // Получаем список всех объявлений, чтобы узнать их количество
  let totalCount = 0;
  try {
    const adsResponse = await adsRepository.getAll();
    const adsList = Array.isArray(adsResponse) ? adsResponse : (adsResponse.data || []);
    totalCount = adsList.length;
  } catch (err) {
    console.warn('Не удалось загрузить список объявлений для генерации имени:', err);
    // Оставляем totalCount = 0 → будет "№1"
  }

  const nextNumber = totalCount + 1;

  const emptyProject = {
    title: `Рекламное объявление №${nextNumber}`,
    headline: '',
    description: '',
    image_url: '/public/assets/default.jpg',
    domain: '',
    budget: 0,
    start_at: new Date().toISOString().split('T')[0],
    end_at: '',
    status: 'non-active',
    clicks: 0,
  };

  return this.template
    ? this.template({
        project: emptyProject,
        isNew: true,
        isActive: true,
        isLowBudget: false,
      })
    : '';
}

attachEvents(): void {
  // === СЕЛЕКТОРЫ — ТОЧНО ПО ТВОЕЙ РАЗМЕТКЕ ===
  const headlineInput = document.getElementById('headline-input') as HTMLInputElement | null; // ← ЗАГОЛОВОК ОБЪЯВЛЕНИЯ
  const descInput = document.getElementById('desc-input') as HTMLTextAreaElement | null;
  const siteInput = document.getElementById('site-input') as HTMLInputElement | null;
  const budgetInput = document.getElementById('budget-input') as HTMLInputElement | null;
  const startDateInput = document.getElementById('start-date-input') as HTMLInputElement | null;
  const endDateInput = document.getElementById('end-date-input') as HTMLInputElement | null;
  const imgInput = document.getElementById('img-file') as HTMLInputElement | null;
  const uploadBox = document.getElementById('upload-box');
  const filePreview = document.getElementById('uploaded-file-preview');
  const fileThumb = document.getElementById('uploaded-file-thumb') as HTMLImageElement | null;
  const fileNameEl = document.getElementById('uploaded-file-name');
  const fileTypeEl = document.getElementById('uploaded-file-type');
  const removeBtn = document.getElementById('remove-uploaded-file');
  const errorEl = document.getElementById('error-img-file');
  // === ПРЕВЬЮ — ID ИЗ ТВОЕЙ РАЗМЕТКИ ===
  const previewTitle = document.getElementById('ad-preview-title');     // ← h4 id="ad-preview-title"
  const previewDesc = document.getElementById('ad-preview-desc');       // ← p id="ad-preview-desc"
  const previewLink = document.getElementById('ad-preview-link');       // ← span id="ad-preview-link"
  const previewImg = document.getElementById('ad-preview-img') as HTMLImageElement | null; // ← img id="ad-preview-img"
  const showFilePreview = (file: File) => {
  // Имя и расширение
  const name = file.name;
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const mime = file.type;

  // Тип для отображения
  let typeText = 'Файл';
  if (mime.startsWith('image/')) {
    typeText = ext.toUpperCase() + ' изображение';
  }

  if (fileNameEl) fileNameEl.textContent = name;
  if (fileTypeEl) fileTypeEl.textContent = typeText;

  // Превью изображения
  if (fileThumb && mime.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) fileThumb.src = e.target.result as string;
    };
    reader.readAsDataURL(file);
  }

  // Показать карточку
  if (filePreview && uploadBox) {
    filePreview.style.display = 'flex';
    uploadBox.classList.add('hidden');// скрыть кнопку загрузки
  }
};

// Функция сброса
const resetFilePreview = () => {
  this.selectedFile = null;
  if (filePreview && uploadBox) {
    filePreview.style.display = 'none';
    uploadBox.classList.remove('hidden');
  }
  if (imgInput) imgInput.value = '';
  if (errorEl) errorEl.textContent = '';
};


// Обработчик удаления
removeBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  resetFilePreview();
});
  // 🔥 ПРЯМАЯ СВЯЗЬ: ВВОД → ПРЕВЬЮ
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


  // === ЗАГРУЗКА ИЗОБРАЖЕНИЯ ===

    imgInput?.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) {
      resetFilePreview();
      return;
    }

    // Базовая валидация по типу и размеру
    const allowedTypes = ['image/jpeg', 'image/png'];
    const maxSize = 10 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      if (errorEl) errorEl.textContent = 'Поддерживаются только JPG или PNG';
      resetFilePreview();
      return;
    }

    if (file.size > maxSize) {
      if (errorEl) errorEl.textContent = 'Максимум размер — 10 МБ';
      resetFilePreview();
      return;
    }

    // ✅ ПРОВЕРКА: ЯВЛЯЕТСЯ ЛИ ФАЙЛ ИЗОБРАЖЕНИЕМ
    const img = new Image();
    const reader = new FileReader();

    // Ошибка чтения файла (редко, но бывает)
    reader.onerror = () => {
      if (errorEl) errorEl.textContent = 'Ошибка чтения файла. Попробуйте другой.';
      resetFilePreview();
    };

    // Успешное чтение → пробуем загрузить как изображение
    reader.onload = (event) => {
      img.src = event.target?.result as string;

      img.onload = () => {
        // ✅ Успешно загрузилось → файл действительно изображение
        this.selectedFile = file;
        showFilePreview(file);
      };

      img.onerror = () => {
        // ❌ Не удалось загрузить → не изображение
        if (errorEl) errorEl.textContent = 'Ошибка загрузки: файл не является изображением.';
        resetFilePreview();
      };
    };

    reader.readAsDataURL(file);
  });
  // === КНОПКИ НАЗАД ===
  ['#back-btn', '#breadcrumb-ads'].forEach(sel => {
    document.querySelector(sel)?.addEventListener('click', e => {
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
  });

  // === КНОПКА "СОЗДАТЬ" ===
  document.querySelector('#edit-btn')?.addEventListener('click', async (e) => {
    e.preventDefault();

    const headline = headlineInput?.value.trim() || '';
    const projectName = headline; // ← используем тот же текст  // ← БЕРЁМ ЗНАЧЕНИЕ ИЗ ПОЛЯ!
    const desc = descInput?.value.trim() || '';
    const site = siteInput?.value.trim() || '';
    const budget = budgetInput?.value.trim() || '';
    const startDate = startDateInput?.value || '';
    const endDate = endDateInput?.value || '';

    // ОЧИЩАЕМ ОШИБКИ
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    document.querySelectorAll('.input--error').forEach(el => el.classList.remove('input--error'));

    // 🔥 ВАЛИДАЦИЯ ЗАГОЛОВКА ОБЪЯВЛЕНИЯ — ОБЯЗАТЕЛЬНОЕ ПОЛЕ
    let hasError = false;
    // === ВАЛИДАЦИЯ ДАТ (копия из ProjectDetailPage) ===

// Проверка: обе даты обязательны
if (!startDate) {
  startDateInput?.classList.add('input--error');
  document.getElementById('error-start-date-input')?.remove(); // удаляем старую, если есть
  const errorEl = document.createElement('div');
  errorEl.id = 'error-start-date-input';
  errorEl.className = 'error-message';
  errorEl.textContent = 'Дата начала обязательна';
  startDateInput?.parentNode?.appendChild(errorEl);
  hasError = true;
}

if (!endDate) {
  endDateInput?.classList.add('input--error');
  document.getElementById('error-end-date-input')?.remove();
  const errorEl = document.createElement('div');
  errorEl.id = 'error-end-date-input';
  errorEl.className = 'error-message';
  errorEl.textContent = 'Дата окончания обязательна';
  endDateInput?.parentNode?.appendChild(errorEl);
  hasError = true;
}

// Если обе даты есть — проверяем логику
if (startDate && endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) {
    startDateInput?.classList.add('input--error');
    document.getElementById('error-start-date-input')?.remove();
    const errorEl = document.createElement('div');
    errorEl.id = 'error-start-date-input';
    errorEl.className = 'error-message';
    errorEl.textContent = 'Некорректная дата начала';
    startDateInput?.parentNode?.appendChild(errorEl);
    hasError = true;
  }

  if (isNaN(end.getTime())) {
    endDateInput?.classList.add('input--error');
    document.getElementById('error-end-date-input')?.remove();
    const errorEl = document.createElement('div');
    errorEl.id = 'error-end-date-input';
    errorEl.className = 'error-message';
    errorEl.textContent = 'Некорректная дата окончания';
    endDateInput?.parentNode?.appendChild(errorEl);
    hasError = true;
  }

  if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
    // Дата окончания не может быть раньше начала
    if (end < start) {
      endDateInput?.classList.add('input--error');
      document.getElementById('error-end-date-input')?.remove();
      const errorEl = document.createElement('div');
      errorEl.id = 'error-end-date-input';
      errorEl.className = 'error-message';
      errorEl.textContent = 'Дата окончания не может быть раньше начала';
      endDateInput?.parentNode?.appendChild(errorEl);
      hasError = true;
    }
    // === ПРОВЕРКА: МАКСИМУМ 365 ДНЕЙ (как в старом коде) ===
if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
  // Добавляем 365 дней к дате начала
  const maxEndDate = new Date(start);
  maxEndDate.setDate(maxEndDate.getDate() + 365);

  // Сравниваем: если end > start + 365 → ошибка
  if (end > maxEndDate) {
    endDateInput?.classList.add('input--error');
    const errorEl = document.getElementById('error-end-date-input');
    if (errorEl) {
      errorEl.textContent = 'Рекламу можно запустить максимум на 1 год';
    } else {
      // fallback: создаём, если нет
      const newError = document.createElement('div');
      newError.id = 'error-end-date-input';
      newError.className = 'error-message';
      newError.textContent = 'Рекламу можно запустить максимум на 1 год';
      endDateInput?.parentNode?.appendChild(newError);
    }
    hasError = true;
  }
}
    // Дата не может быть в прошлом (опционально — можно убрать)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startClean = new Date(start);
    startClean.setHours(0, 0, 0, 0);

    if (startClean < today) {
      startDateInput?.classList.add('input--error');
      document.getElementById('error-start-date-input')?.remove();
      const errorEl = document.createElement('div');
      errorEl.id = 'error-start-date-input';
      errorEl.className = 'error-message';
      errorEl.textContent = 'Дата начала не может быть в прошлом';
      startDateInput?.parentNode?.appendChild(errorEl);
      hasError = true;
    }
  }
}

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

    // ОСТАЛЬНЫЕ ПОЛЯ
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

    if (!budget) {
      budgetInput?.classList.add('input--error');
      document.getElementById('error-budget-input')!.textContent = 'Бюджет обязателен';
      hasError = true;
    } else {
      const b = Number(budget);
      if (isNaN(b) || b < 0) {
        budgetInput?.classList.add('input--error');
        document.getElementById('error-budget-input')!.textContent = 'Бюджет должен быть положительным числом';
        hasError = true;
      } else {
        // ПРОВЕРКА БАЛАНСА
        try {
          const balanceData = await balanceRepository.getBalanceAndTransactions();
          if (b > balanceData.balance) {
            budgetInput?.classList.add('input--error');
            document.getElementById('error-budget-input')!.textContent = `Недостаточно средств. Баланс: ${balanceData.balance} ₽`;
            hasError = true;
          }
        } catch (err) {
          console.warn('Ошибка проверки баланса:', err);
        }
      }
    }

    if (!startDate) {
      startDateInput?.classList.add('input--error');
      document.getElementById('error-start-date-input')!.textContent = 'Дата начала обязательна';
      hasError = true;
    }
    if (!endDate) {
      endDateInput?.classList.add('input--error');
      document.getElementById('error-end-date-input')!.textContent = 'Дата окончания обязательна';
      hasError = true;
    }

    if (hasError) {
      console.warn('Есть ошибки валидации');
      return;
    }

    // ✅ ФОРМИРУЕМ ДАННЫЕ — headline УХОДИТ НА СЕРВЕР
    const formData = new FormData();
    formData.append('title', headline);         // ← для списка
    formData.append('headline', headline);      // ← заголовок на баннере — ОБЯЗАТЕЛЬНО
    formData.append('content', desc);
    formData.append('target_url', site);
    formData.append('budget', budget);
    formData.append('status', 'active');

    if (startDate) formData.append('start_at', new Date(startDate).toISOString().replace(/\.\d+Z$/, 'Z'));
    if (endDate) formData.append('end_at', new Date(endDate).toISOString().replace(/\.\d+Z$/, 'Z'));

    if (this.selectedFile) {
    formData.append('image', this.selectedFile, this.selectedFile.name);
  }

    try {
      await adsRepository.create(formData);
      new ConfirmationModal({
        message: 'Кампания успешно создана!',
        onConfirm: () => {
          localStorage.setItem('projects_tab', 'ads');
          routerInstance?.navigate('/projects');
        },
      }).show();
    } catch (err) {
      console.error('Ошибка при создании:', err);
      new ConfirmationModal({
        message: 'Не удалось создать кампанию. Попробуйте позже.',
        onConfirm: () => {},
      }).show();
    }
  });
}
}