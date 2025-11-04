export function validateAdForm(formData) {
  const errors = {};

  // // Заголовок
  // if (!formData.title || formData.title.trim().length < 3) {
  //   errors.title = 'Введите заголовок (минимум 3 символа)';
  // }

  // // Описание
  // if (!formData.description || formData.description.trim().length < 10) {
  //   errors.description = 'Описание должно быть не короче 10 символов';
  // }

  // // Ссылка на сайт
  // const urlRegex = /^(https?:\/\/)[\w.-]+(\.[\w.-]+)+[/#?]?.*$/;
  // if (!formData.domain || !urlRegex.test(formData.domain)) {
  //   errors.domain = 'Введите корректный URL (например https://example.com)';
  // }

  // // Бюджет
  // if (!formData.budget || isNaN(formData.budget) || Number(formData.budget) < 100) {
  //   errors.budget = 'Бюджет должен быть числом не меньше 100 ₽';
  // }

  // // Изображение (проверяем только тип, если есть файл)
  // if (formData.file) {
  //   const allowedTypes = ['image/jpeg', 'image/png'];
  //   if (!allowedTypes.includes(formData.file.type)) {
  //     errors.image = 'Поддерживаются только JPG или PNG';
  //   }
  // }

  return errors;
}
