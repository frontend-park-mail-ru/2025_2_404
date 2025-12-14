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
      const projectData = await adsRepository.getById(this.projectId);
      if (!projectData) throw new Error('Нет данных об объявлении');

      const DEFAULT_IMG = '/public/assets/default.jpg'; 
      const imageUrl = projectData.image_url || DEFAULT_IMG;
      
      let finalImageUrl = imageUrl;
      if (
        imageUrl !== DEFAULT_IMG &&
        !imageUrl.startsWith('data:image') &&
        !imageUrl.startsWith('http') &&
        !imageUrl.startsWith('/')
      ) {
        finalImageUrl = `data:image/jpeg;base64,${imageUrl}`;
      }
      
      this.project = { ...projectData, image_url: finalImageUrl };
      const isActive = this.project.status === 'active';
      const budgetVal = Number(this.project.budget) || 0;
      const isLowBudget = budgetVal <= 100;

      return this.template({
        project: this.project,
        isNew: false, 
        isActive: isActive,
        isLowBudget: isLowBudget, 
        lastUpdated: !navigator.onLine && this.project.timestamp ? this.project.timestamp : null,
      });

    } catch (err) {
      console.error(`Ошибка при рендеринге проекта ID ${this.projectId}:`, err);
      return this.template({ error: err.message || 'Не удалось загрузить проект' });
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
    const budgetInput = document.getElementById('budget-input');
    const statusSwitch = document.getElementById('status-switch');
    const statusText = document.getElementById('status-text');
    const statusLockMsg = document.getElementById('status-lock-msg');

    const handleBudgetInput = () => {
        const val = parseFloat(budgetInput.value);
        if (isNaN(val) || val <= 100) {
            if (statusSwitch) {
                statusSwitch.checked = false; 
                statusSwitch.disabled = true; 
            }
            if (statusText) statusText.textContent = 'Неактивно';
            if (statusLockMsg) statusLockMsg.style.display = 'block';
        } else {
            if (statusSwitch) statusSwitch.disabled = false;
            if (statusLockMsg) statusLockMsg.style.display = 'none';
        }
        if (budgetInput.classList.contains('input--error')) {
            if (!isNaN(val) && val >= 0) {
                budgetInput.classList.remove('input--error');
                const nextEl = budgetInput.nextElementSibling;
                if (nextEl && nextEl.classList.contains('error-message')) {
                    nextEl.remove();
                }
            }
        }
    };
    budgetInput?.addEventListener('input', handleBudgetInput);
    statusSwitch?.addEventListener('change', (e) => {
        if (statusText) {
            statusText.textContent = e.target.checked ? 'Активно' : 'Неактивно';
        }
    });
    const editBtn = document.querySelector('#edit-btn');
    if (!editBtn) return;

    editBtn.addEventListener('click', async (e) => {
      e.preventDefault();

      const title = document.getElementById('title-input').value.trim();
      const desc = document.getElementById('desc-input').value.trim();
      const site = document.getElementById('site-input').value.trim();
      const budgetRaw = document.getElementById('budget-input').value.trim(); 
      const imgFile = this.selectedFile; 
      document.querySelectorAll('.error-message').forEach((el) => {
          if (el.id !== 'status-lock-msg') el.remove();
      });
      document.querySelectorAll('.input--error').forEach((el) =>
        el.classList.remove('input--error')
      );
      const budgetNum = Number(budgetRaw);
      if (budgetRaw === '' || isNaN(budgetNum) || budgetNum < 0) {
          const input = document.getElementById('budget-input');
          input.classList.add('input--error');
          const err = document.createElement('small');
          err.textContent = 'Бюджет не может быть меньше 0';
          err.classList.add('error-message');
          input.insertAdjacentElement('afterend', err);
          return;
      }
      const errors = validateAdForm({ title, description: desc, domain: site, budget: budgetRaw, file: imgFile });
      
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
            if (key === 'budget' && input.classList.contains('input--error')) continue;

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
      formData.append('budget', budgetRaw);

      const isSwitchChecked = statusSwitch ? statusSwitch.checked : false;
      const statusValue = isSwitchChecked ? 'active' : 'paused'; 
      formData.append('status', statusValue); 

      if (imgFile) {
        formData.append('image', imgFile);
      }

      try {
        await adsRepository.update(this.projectId, formData);
        new ConfirmationModal({
          message: 'Изменения сохранены!',
          onConfirm: () => router.navigate('/projects'),
        }).show();
      } catch (err) {
        console.error('Ошибка при обновлении:', err);
      }  
    });

    const titleInput = document.querySelector('#title-input');
    const descInput = document.querySelector('#desc-input');
    const imgInput = document.getElementById('img-file');
    const previewTitle = document.querySelector('.ads__preview-card h4');
    const previewDesc = document.querySelector('.ads__preview-card p');
    const previewImg = document.querySelector('.ads__preview-image');

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