import ConfirmationModal from '../components/ConfirmationModal';
import { validateAdForm } from '../../public/utils/ValidateAdForm';
import adsRepository from '../../public/repository/adsRepository';
import type { HandlebarsTemplateDelegate, PageComponent } from '../../src/types';
import type Router from '../../services/Router';

let routerInstance: Router | null = null;

export function setCreateProjectRouter(r: Router): void {
  routerInstance = r;
}

export default class CreateProjectPage implements PageComponent {
  template: HandlebarsTemplateDelegate | null = null;
  togglePreview: (show: boolean) => void;

  constructor() {
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

  async loadTemplate(): Promise<void> {
    if (this.template) return;
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
    const emptyProject = {
      title: '',
      description: '',
      image_url: '/public/assets/default.jpg',
      domain: '',
      budget: ''
    };
    return this.template ? this.template({ project: emptyProject, isNew: true }) : '';
  }

  attachEvents(): void {
    const titleInput = document.querySelector('#title-input') as HTMLInputElement | null;
    const descInput = document.querySelector('#desc-input') as HTMLTextAreaElement | null;
    const siteInput = document.querySelector('#site-input') as HTMLInputElement | null;
    const budgetInput = document.querySelector('#budget-input') as HTMLInputElement | null;
    const imgInput = document.querySelector('#img-file') as HTMLInputElement | null;
    const previewTitle = document.querySelector('.ads__preview-card h4');
    const previewDesc = document.querySelector('.ads__preview-card p');
    const previewImg = document.querySelector('.ads__preview-card img') as HTMLImageElement | null;

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
        const reader = new FileReader();
        reader.onload = (event) => {
          if (previewImg && event.target?.result) previewImg.src = event.target.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        if (previewImg) previewImg.src = '/public/assets/default.jpg';
      }
    });
    
    document.querySelector('#back-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      routerInstance?.navigate('/projects');
    });

    document.querySelector('#preview-toggle-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.togglePreview(true);
    });

    document.querySelector('#preview-back-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.togglePreview(false);
    });
    
    document.querySelector('#edit-btn')?.addEventListener('click', async (e) => {
      e.preventDefault();

      const title = titleInput?.value.trim() || '';
      const desc = descInput?.value.trim() || '';
      const site = siteInput?.value.trim() || '';
      const budget = budgetInput?.value.trim() || '';
      const imgFile = imgInput?.files?.[0] || null;

      document.querySelectorAll('.error-message').forEach((el) => el.remove());
      document.querySelectorAll('.input--error').forEach((el) => el.classList.remove('input--error'));
      
      const errors = validateAdForm({ title, description: desc, domain: site, budget, file: imgFile });
      
      const fieldMap: Record<string, string> = {
        title: 'title-input',
        description: 'desc-input',
        domain: 'site-input',
        budget: 'budget-input',
        image: 'img-file',
      };
      
      if (Object.keys(errors).length > 0) {
        console.warn('Ошибки валидации:', errors);
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
        return;
      }
      
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', desc);
      formData.append('target_url', site);
      formData.append('budget', budget);
      if (imgFile) {
        formData.append('image', imgFile);
      }

      try {
        await adsRepository.create(formData);
        new ConfirmationModal({
          message: 'Проект успешно создан',
          onConfirm: () => routerInstance?.navigate('/projects'),
        }).show();
      } catch (err) {
        console.error('Ошибка при создании:', err);
      }
    });
  }
}
