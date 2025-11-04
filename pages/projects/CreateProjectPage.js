import { createAd } from '../../public/api/ads.js';
import ConfirmationModal from '../components/ConfirmationModal.js';

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
    const emptyProject = {
      title: '',
      description: '',
      image: '',
      domain: '',
    };
    return this.template({ project: emptyProject, isNew: true });
  }

  attachEvents() {
  const titleInput = document.querySelector('#title-input');
  const descInput = document.querySelector('#desc-input');
  const siteInput = document.querySelector('#site-input');
  const imgInput = document.querySelector('#img-input');
  const previewTitle = document.querySelector('.preview-card h4');
  const previewDesc = document.querySelector('.preview-card p');
  const previewImg = document.querySelector('.preview-card img');

  //  обновление предпросмотра
  titleInput?.addEventListener('input', () => {
    previewTitle.textContent = titleInput.value || 'Без названия';
  });

  descInput?.addEventListener('input', () => {
    previewDesc.textContent = descInput.value || 'Без описания';
  });

  imgInput?.addEventListener('input', () => {
    previewImg.src = imgInput.value || 'https://via.placeholder.com/300x200?text=Нет+изображения';
  });

  // обработчик кнопки назад
  const backBtn = document.querySelector('#back-btn');
  backBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    this.router.navigate('/projects');
  });

  // обработчик кнопки "Создать"
  const saveBtn = document.querySelector('#edit-btn');
  saveBtn?.addEventListener('click', async () => {
    const title = titleInput?.value.trim();
    const desc = descInput?.value.trim();
    const site = siteInput?.value.trim();
    const img = imgInput?.value.trim();
    const budget = document.querySelector('#budget-input')?.value;

    if (!title || !desc) {
      alert('Введите заголовок и описание');
      return;
    }

    await createAd({
        title,
        content: desc,
        target_url: site,
        img_bin: img,
        budget,
    });

    const modal = new ConfirmationModal({
    message: 'Объявление успешно создано!',
    onConfirm: () => {
        this.router.navigate('/projects'); 
    },
    });
    modal.show();

   
  });
}

}


