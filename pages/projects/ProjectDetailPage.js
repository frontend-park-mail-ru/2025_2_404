import { getAdById, deleteAd, updateAd } from '../../public/api/ads.js';
import ConfirmationModal from '../components/ConfirmationModal.js';

export default class ProjectDetailPage {
  constructor(router, projectId) {
    this.router = router;
    this.projectId = projectId;
    this.template = null;
  }

  /** Загружает шаблон страницы */
  async loadTemplate() {
    const response = await fetch('/pages/projects/ProjectDetailPage.hbs');
    if (!response.ok) throw new Error('Не удалось загрузить шаблон ProjectDetailPage');
    const templateText = await response.text();
    this.template = Handlebars.compile(templateText);
  }

  /** Рендер страницы */
  async render() {
    if (!this.template) return 'Загрузка...';

    try {
      const ad = await getAdById(this.projectId);
      return this.template({ project: ad });
    } catch (err) {
      console.error('Ошибка при загрузке:', err);
      return `
        <div style="padding: 40px; text-align:center">
          <h2>Не удалось загрузить проект</h2>
          <p>${err.body?.message || err.statusText || 'Ошибка сервера'}</p>
        </div>
      `;
    }
  }

  /** Навешивает события */
  attachEvents() {
    // Кнопка "Назад"
    const backBtn = document.querySelector('#back-btn');
    backBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.router.navigate('/projects');
    });

    // Кнопка "Сохранить изменения"
    const editBtn = document.querySelector('#edit-btn');
    if (editBtn) {
      editBtn.textContent = 'Сохранить изменения';
      editBtn.addEventListener('click', async () => {
        const title = document.querySelector('#title-input')?.value.trim();
        const desc = document.querySelector('#desc-input')?.value.trim();
        const site = document.querySelector('#site-input')?.value.trim();
        const img = document.querySelector('#img-input')?.value.trim();

        if (!title || !desc) {
          const modal = new ConfirmationModal({
            message: 'Поля "Заголовок" и "Описание" обязательны!',
            onConfirm: null,
          });
          modal.show();
          return;
        }

        try {
          // Отправляем обновлённые данные
          await updateAd(this.projectId, {
            title,
            content: desc,
            target_url: site,
            img_bin: img,
          });

          // ✅ Модалка при успешном сохранении
          const modal = new ConfirmationModal({
            message: 'Изменения успешно сохранены!',
            onConfirm: () => this.router.navigate('/projects'),
          });
          modal.show();
        } catch (err) {
          console.error('Ошибка при сохранении:', err);
          const modal = new ConfirmationModal({
            message: 'Не удалось сохранить изменения. Попробуйте позже.',
            onConfirm: null,
          });
          modal.show();
        }
      });
    }

    // Кнопка "Удалить"
    const deleteBtn = document.querySelector('#delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        const modal = new ConfirmationModal({
          message: 'Вы уверены, что хотите удалить это объявление?',
          onConfirm: async () => {
            try {
              await deleteAd(this.projectId);
              this.router.navigate('/projects');
            } catch (err) {
              console.error('Ошибка при удалении:', err);
              const errorModal = new ConfirmationModal({
                message: 'Не удалось удалить объявление. Попробуйте позже.',
                onConfirm: null,
              });
              errorModal.show();
            }
          },
          onCancel: () => {},
        });
        modal.show();
      });
    }

    // Обновление предпросмотра
    const titleInput = document.querySelector('#title-input');
    const descInput = document.querySelector('#desc-input');
    const siteInput = document.querySelector('#site-input');
    const imgInput = document.querySelector('#img-input');
    const previewTitle = document.querySelector('.preview-card h4');
    const previewDesc = document.querySelector('.preview-card p');
    const previewImg = document.querySelector('.preview-card img');

    titleInput?.addEventListener('input', () => {
      previewTitle.textContent = titleInput.value || 'Без названия';
    });

    descInput?.addEventListener('input', () => {
      previewDesc.textContent = descInput.value || 'Без описания';
    });

    siteInput?.addEventListener('input', () => {
      previewDesc.textContent = `${descInput.value}\nСайт: ${siteInput.value}`;
    });

    imgInput?.addEventListener('input', () => {
      previewImg.src =
        imgInput.value || 'https://via.placeholder.com/300x200?text=Нет+изображения';
    });
  }
}
