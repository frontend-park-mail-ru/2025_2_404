// import { createAd } from '../../public/api/ads.js';
// import ConfirmationModal from '../components/ConfirmationModal.js';
// import { validateAdForm } from '../../public/utils/ValidateAdForm.js';

// export default class CreateProjectPage {
//   constructor(router) {
//     this.router = router;
//     this.template = null;
//   }

//   async loadTemplate() {
//     const response = await fetch('/pages/projects/ProjectDetailPage.hbs');
//     if (!response.ok) throw new Error('Не удалось загрузить шаблон');
//     const templateText = await response.text();
//     this.template = Handlebars.compile(templateText);
//   }

//   async render() {
//     if (!this.template) return 'Загрузка...';
//     const emptyProject = {
//       title: '',
//       description: '',
//       image: '',
//       domain: '',
//     };
//     return this.template({ project: emptyProject, isNew: true });
//   }

//   attachEvents() {
//   const titleInput = document.querySelector('#title-input');
//   const descInput = document.querySelector('#desc-input');
//   const siteInput = document.querySelector('#site-input');
//   const imgInput = document.querySelector('#img-file');
//   const previewTitle = document.querySelector('.preview-card h4');
//   const previewDesc = document.querySelector('.preview-card p');
//   const previewImg = document.querySelector('.preview-card img');

//   //  обновление предпросмотра
//   titleInput?.addEventListener('input', () => {
//     previewTitle.textContent = titleInput.value || 'Без названия';
//   });

//   descInput?.addEventListener('input', () => {
//     previewDesc.textContent = descInput.value || 'Без описания';
//   });

//   imgInput?.addEventListener('change', (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onload = (event) => {
//         previewImg.src = event.target.result;
//       };
//       reader.readAsDataURL(file);
//     } else {
//       previewImg.src = 'https://via.placeholder.com/300x200?text=Нет+изображения';
//     }
//   });

//   // обработчик кнопки назад
//   const backBtn = document.querySelector('#back-btn');
//   backBtn?.addEventListener('click', (e) => {
//     e.preventDefault();
//     this.router.navigate('/projects');
//   });

//   // обработчик кнопки "Создать"
//   const saveBtn = document.querySelector('#edit-btn');
//   saveBtn?.addEventListener('click', async () => {
//     const title = titleInput?.value.trim();
//     const desc = descInput?.value.trim();
//     const site = siteInput?.value.trim();
//     const img = imgInput?.value.trim();
//     const budget = document.querySelector('#budget-input')?.value;

//     if (!title || !desc) {
//       alert('Введите заголовок и описание');
//       return;
//     }

//     await createAd({
//         title,
//         content: desc,
//         target_url: site,
//         img_bin: img,
//         budget,
//     });

//     const modal = new ConfirmationModal({
//     message: 'Объявление успешно создано!',
//     onConfirm: () => {
//         this.router.navigate('/projects'); 
//     },
//     });
//     modal.show();

   
//   });
// }

// }



import ConfirmationModal from '../components/ConfirmationModal.js';
import { validateAdForm } from '../../public/utils/ValidateAdForm.js';

export default class CreateProjectPage {
  constructor(router) {
    this.router = router;
    this.template = null;
  }

  async loadTemplate() {
    const response = await fetch('/pages/projects/ProjectDetailPage.hbs');
    if (!response.ok) throw new Error('Не удалось загрузить шаблон');
    const templateText = await response.text();
    this.template = Handlebars.compile(templateText);
  }

  async render() {
    if (!this.template) return 'Загрузка...';
    const emptyProject = { title: '', description: '', image: '', domain: '' };
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

    // предпросмотр
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
        reader.onload = (event) => (previewImg.src = event.target.result);
        reader.readAsDataURL(file);
      } else {
        previewImg.src = 'https://via.placeholder.com/300x200?text=Нет+изображения';
      }
    });

    // кнопка Назад
    document.querySelector('#back-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.router.navigate('/projects');
    });

    // кнопка Создать
    document.querySelector('#edit-btn')?.addEventListener('click', async (e) => {
      e.preventDefault();

      const title = titleInput.value.trim();
      const desc = descInput.value.trim();
      const site = siteInput.value.trim();
      const budget = budgetInput.value.trim();
      const imgFile = imgInput.files[0];

      // валидация
      document.querySelectorAll('.error-msg').forEach((el) => el.remove());
      document.querySelectorAll('.input-error').forEach((el) => el.classList.remove('input-error'));

      const errors = validateAdForm({
        title,
        description: desc,
        domain: site,
        budget,
      });

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

      // формируем данные
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', desc);
      formData.append('target_url', site);
      formData.append('budget', budget);
      if (imgFile) formData.append('image', imgFile);

      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8080/ads/', {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Ошибка при создании объявления: ${text}`);
        }

        new ConfirmationModal({
          message: 'Объявление успешно создано!',
          onConfirm: () => this.router.navigate('/projects'),
        }).show();
      } catch (err) {
        console.error('Ошибка при создании:', err);
        new ConfirmationModal({
          message: 'Ошибка при создании. Попробуйте позже.',
        }).show();
      }
    });
  }
}

