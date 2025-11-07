import { router } from '../../main.js';
import ConfirmationModal from '../components/ConfirmationModal.js';
import adsRepository from '../../public/repository/adsRepository.js'; 
import { validateAdForm } from '../../public/utils/ValidateAdForm.js';


export default class ProjectDetailPage {
  constructor(routerInstance, projectId) {
    this.projectId = projectId;
    this.template = null;
    this.project = null;
    this.selectedFile = null; 
  }
  async loadTemplate() {
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

  async render() {
    await this.loadTemplate();
    try {
      this.project = await adsRepository.getById(this.projectId);
      return this.template({
        project: this.project,
        isNew: false,
        lastUpdated: !navigator.onLine && this.project.timestamp ? this.project.timestamp : null,
      });
    } catch (err) {
      console.error(`Ошибка при рендеринге проекта ID ${this.projectId}:`, err);
      return this.template({ error: err.message });
    }
  }

  attachEvents() {
    document.querySelector('#back-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      router.navigate('/projects');
    });
    document.querySelector('#delete-btn')?.addEventListener('click', () => {
      if (!this.project) return;
      const modal = new ConfirmationModal({
        message: `Вы уверены, что хотите удалить "${this.project.title}"?`,
        onConfirm: async () => {
          try {
            await adsRepository.delete(this.projectId);
            router.navigate('/projects');
          } catch (err) {
            console.error('Ошибка при удалении:', err);
          }
        },
      });
      modal.show();
    });
    const editBtn = document.querySelector('#edit-btn');
    if (!editBtn) return;

    editBtn.addEventListener('click', async (e) => {
      e.preventDefault();

      const title = document.getElementById('title-input').value.trim();
      const desc = document.getElementById('desc-input').value.trim();
      const site = document.getElementById('site-input').value.trim();
      const budget = document.getElementById('budget-input').value.trim();
      const imgFile = this.selectedFile; 

      document.querySelectorAll('.error-msg').forEach((el) => el.remove());
      document.querySelectorAll('.input-error').forEach((el) => el.classList.remove('input-error'));

      const errors = validateAdForm({ title, description: desc, domain: site, budget, file: imgFile });

      const fieldMap = {
        title: 'title-input',
        description: 'desc-input',
        domain: 'site-input',
        budget: 'budget-input',
        image: 'img-file',
      };

      if (Object.keys(errors).length > 0) {
        for (const [key, msg] of Object.entries(errors)) {
          const input = document.getElementById(fieldMap[key]);
          if (input) {
            input.classList.add('input-error');
            const err = document.createElement('small');
            err.textContent = msg;
            err.classList.add('error-msg');
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
      formData.append('amount_for_ad', budget);
      if (imgFile) {
        formData.append('img', imgFile);
      }

      try {
        await adsRepository.update(this.projectId, formData);
        new ConfirmationModal({
          message: 'Изменения сохранены! Они будут отправлены на сервер, когда появится интернет.',
          onConfirm: () => router.navigate('/projects'),
        }).show();
      } catch (err) {
        console.error('Ошибка при обновлении:', err);
      }  
    });

    const titleInput = document.querySelector('#title-input');
    const descInput = document.querySelector('#desc-input');
    const imgInput = document.getElementById('img-file');
    const previewTitle = document.querySelector('.preview-card h4');
    const previewDesc = document.querySelector('.preview-card p');
    const previewImg = document.querySelector('.preview-image');

    titleInput?.addEventListener('input', () => {
      if (previewTitle) previewTitle.textContent = titleInput.value || 'Без названия';
    });

    descInput?.addEventListener('input', () => {
      if (previewDesc) previewDesc.textContent = descInput.value || 'Без описания';
    });

    imgInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.selectedFile = file; 
        const reader = new FileReader();
        reader.onload = (event) => {
          if (previewImg) previewImg.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }
}