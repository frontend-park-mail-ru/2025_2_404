import ConfirmationModal from '../components/ConfirmationModal.js';
import { validateAdForm } from '../../public/utils/ValidateAdForm.js';
import { router } from '../../main.js';
import adsRepository from '../../public/repository/adsRepository.js';

export default class CreateProjectPage {
  constructor() {
    this.template = null;
    this.togglePreview = this.togglePreview.bind(this);
  }

  togglePreview(show) {
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

  async loadTemplate() {
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
  async render() {
    await this.loadTemplate();
    const emptyProject = {
      title: '',
      description: '',
      image_url: '/public/assets/default.jpg',
      domain: '',
      budget: ''
    };
    return this.template({ project: emptyProject, isNew: true });
  }
  attachEvents() {
    const titleInput = document.querySelector('#title-input');
    const descInput = document.querySelector('#desc-input');
    const siteInput = document.querySelector('#site-input');
    const budgetInput = document.querySelector('#budget-input');
    const imgInput = document.querySelector('#img-file');
    const previewTitle = document.querySelector('.ads__preview-card h4');
    const previewDesc = document.querySelector('.ads__preview-card p');
    const previewImg = document.querySelector('.ads__preview-card img');

    // предпросмотр
    titleInput?.addEventListener('input', () => {
      if (previewTitle) previewTitle.textContent = titleInput.value || 'Без названия';
    });
    descInput?.addEventListener('input', () => {
      if (previewDesc) previewDesc.textContent = descInput.value || 'Без описания';
    });
    imgInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (previewImg) previewImg.src = event.target.result;
        };
        reader.readAsDataURL(file);
      } else {
        if (previewImg) previewImg.src = '/public/assets/default.jpg';
      }
    });
    document.querySelector('#back-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      router.navigate('/projects');
    });

    // Кнопка "Предпросмотр" (мобильная)
    document.querySelector('#preview-toggle-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.togglePreview(true);
    });

    // Кнопка "Назад к форме" в preview (мобильная)
    document.querySelector('#preview-back-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.togglePreview(false);
    });
    document.querySelector('#edit-btn')?.addEventListener('click', async (e) => {
      e.preventDefault();

      const title = titleInput.value.trim();
      const desc = descInput.value.trim();
      const site = siteInput.value.trim();
      const budget = budgetInput.value.trim();
      const imgFile = imgInput.files[0];

      // валидация
      document.querySelectorAll('.error-message').forEach((el) => el.remove());
      document.querySelectorAll('.input--error').forEach((el) => el.classList.remove('input--error'));
      const errors = validateAdForm({ title, description: desc, domain: site, budget, file: imgFile });
      console.log(errors);
 const fieldMap = {
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
          if (input) {
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
          onConfirm: () => router.navigate('/projects'),
        }).show();
        
      } catch (err) {
        console.error('Ошибка при создании:', err);
      }
    });
  }
}