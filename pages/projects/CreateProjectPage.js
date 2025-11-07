import ConfirmationModal from '../components/ConfirmationModal.js';
import { validateAdForm } from '../../public/utils/ValidateAdForm.js';
import { router } from '../../main.js';
import adsRepository from '../../public/repository/adsRepository.js';

export default class CreateProjectPage {
  constructor() {
    this.template = null;
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
    const previewTitle = document.querySelector('.preview-card h4');
    const previewDesc = document.querySelector('.preview-card p');
    const previewImg = document.querySelector('.preview-card img');
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
    document.querySelector('#edit-btn')?.addEventListener('click', async (e) => {
      e.preventDefault();

      const title = titleInput.value.trim();
      const desc = descInput.value.trim();
      const site = siteInput.value.trim();
      const budget = budgetInput.value.trim();
      const imgFile = imgInput.files[0];
      document.querySelectorAll('.error-msg').forEach((el) => el.remove());
      const errors = validateAdForm({ title, description: desc, domain: site, budget, file: imgFile });

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
          const inputId = fieldMap[key];
          if (inputId) {
            const input = document.getElementById(inputId);
            if (input) {
              input.classList.add('input-error');
              const errorElement = document.createElement('small');
              errorElement.textContent = msg;
              errorElement.classList.add('error-msg');
              input.insertAdjacentElement('afterend', errorElement);
            }
          }
        }
        return;
      }

      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', desc);
      formData.append('target_url', site);
      formData.append('amount_for_ad', budget); 
      if (imgFile) formData.append('img', imgFile);

      try {
        await adsRepository.create(formData);
        new ConfirmationModal({
          message: 'Проект успешно создан (или будет синхронизирован при появлении сети)!',
          onConfirm: () => router.navigate('/projects'),
        }).show();
        
      } catch (err) {
        console.error('Ошибка при создании:', err);
      }
    });
  }
}