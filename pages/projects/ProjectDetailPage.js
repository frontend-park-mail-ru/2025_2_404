import { getAdById, deleteAd } from '../../public/api/ads.js';
import ConfirmationModal from '../components/ConfirmationModal.js';
import { validateAdForm } from '../../public/utils/ValidateAdForm.js';

export default class ProjectDetailPage {
  constructor(router, projectId) {
  this.router = router;
  this.projectId = projectId;
  this.template = null;
  }

  async loadTemplate() {
    const response = await fetch('/pages/projects/ProjectDetailPage.hbs');
    if (!response.ok) throw new Error('Не удалось загрузить шаблон ProjectDetailPage');
    const text = await response.text();
    this.template = Handlebars.compile(text);
  }

    async render() {
    if (!this.template) return 'Загрузка...';

    try {
      const ad = await getAdById(this.projectId);
      if (!ad) throw new Error('Нет данных об объявлении');

      const DEFAULT_IMG = 'http://localhost:8000/frontend/public/assets/default.jpg';
      
      let imageUrl = ad.image_url || ad.image || '';
      if (!imageUrl) {
        imageUrl = DEFAULT_IMG;
      } else if (!imageUrl.startsWith('data:image') && !imageUrl.startsWith('http')) {

        imageUrl = `data:image/jpeg;base64,${imageUrl}`;
      }

      return this.template({
        project: { ...ad, image_url: imageUrl },
        isNew: false,
      });
    } catch (err) {
      console.error('Ошибка при загрузке проекта:', err);
      return `
        <div style="padding:40px; text-align:center;">
          <h2>Не удалось загрузить проект</h2>
          <p>${err.body?.message || err.statusText || 'Ошибка сервера'}</p>
        </div>
      `;
    }
  }

  /** Навешивает события */
  attachEvents() {
    /** Кнопка Назад */
    const backBtn = document.querySelector('#back-btn');
    backBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.router.navigate('/projects');
    });

    /** Кнопка Удалить */
    const deleteBtn = document.querySelector('#delete-btn');
    deleteBtn?.addEventListener('click', () => {
      const modal = new ConfirmationModal({
        message: 'Вы уверены, что хотите удалить это объявление?',
        onConfirm: async () => {
          try {
            await deleteAd(this.projectId);
            this.router.navigate('/projects');
          } catch (err) {
            console.error('Ошибка при удалении:', err);
            new ConfirmationModal({
              message: 'Не удалось удалить объявление. Попробуйте позже.',
            }).show();
          }
        },
        onCancel: () => {},
      });
      modal.show();
    });

    /** Кнопка Сохранить изменения */
    const editBtn = document.querySelector('#edit-btn');
    if (!editBtn) return;

    editBtn.addEventListener('click', async (e) => {
      e.preventDefault();

      const title = document.getElementById('title-input').value.trim();
      const desc = document.getElementById('desc-input').value.trim();
      const site = document.getElementById('site-input').value.trim();
      const budget = document.getElementById('budget-input').value.trim();
      const imgFile = document.getElementById('img-file')?.files[0]; 

      console.log('Отправка данных на сервер...');
      console.table({ title, desc, site, budget, imgFile });

      // Очистка старых ошибок
      document.querySelectorAll('.error-message').forEach((el) => el.remove());
      document.querySelectorAll('.input--error').forEach((el) =>
        el.classList.remove('input--error')
      );

      // Валидация данных
      const errors = validateAdForm({
        title,
        description: desc,
        domain: site,
        budget,
      });

      // Маппинг id полей формы
      const fieldMap = {
        title: 'title-input',
        description: 'desc-input',
        domain: 'site-input',
        budget: 'budget-input',
        image: 'img-file',
      };

      // Если есть ошибки — подсветим поля и покажем текст
      if (Object.keys(errors).length > 0) {
        for (const [key, msg] of Object.entries(errors)) {
          const mappedId = fieldMap[key] || `${key}-input`;
          const input =
            document.getElementById(mappedId) || document.querySelector(`.${key}`);
          if (input) {
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

      // Формируем multipart/form-data
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', desc);
      formData.append('target_url', site);
      formData.append('budget', budget);
      if (imgFile) formData.append('image', imgFile);



      try {
        const token = localStorage.getItem('token');

        const response = await fetch(`http://89.208.230.119:8080/ads/${this.projectId}`, {
          method: 'PUT',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
          credentials: 'include',
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Ошибка при сохранении: ${text}`);
        }

        new ConfirmationModal({
          message: 'Изменения успешно сохранены!',
          onConfirm: () => this.router.navigate('/projects'),
        }).show();
      } catch (err) {
        console.error('Ошибка при сохранении:', err);
        new ConfirmationModal({
          message: 'Ошибка при сохранении. Попробуйте позже.',
        }).show();
      }  
    });

    /** Предпросмотр изображения */
    const titleInput = document.querySelector('#title-input');
    const descInput = document.querySelector('#desc-input');
    const imgInput = document.getElementById('img-file');
    const previewTitle = document.querySelector('.ads__preview-card h4');
    const previewDesc = document.querySelector('.ads__preview-card p');
    const previewImg = document.querySelector('.ads__preview-image');

    titleInput?.addEventListener('input', () => {
      previewTitle.textContent = titleInput.value || 'Без названия';
    });

    descInput?.addEventListener('input', () => {
      previewDesc.textContent = descInput.value || 'Без описания';
    });

    imgInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          previewImg.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }
}
