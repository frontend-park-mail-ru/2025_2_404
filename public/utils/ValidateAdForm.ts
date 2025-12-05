import type { AdFormData, AdValidationErrors } from '../../src/types';

export function validateAdForm(formData: AdFormData): AdValidationErrors {
  const errors: AdValidationErrors = {};

  if (!formData.title || formData.title.trim().length < 3) {
    errors.title = 'Введите заголовок (минимум 3 символа)';
  }

  if (!formData.description || formData.description.trim().length < 5) {
    errors.description = 'Описание должно быть не короче 5 символов';
  }

  const urlRegex = /^(https?:\/\/)?[-a-zA-Z0-9@:%_\+.~#?&\/=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&\/=]*)?$/i;
  if (!formData.domain || !urlRegex.test(formData.domain)) {
    errors.domain = 'Введите корректный URL (например https://example.com)';
  }

  const budgetNum = Number(formData.budget);
  if (!formData.budget || isNaN(budgetNum) || budgetNum < 100) {
    errors.budget = 'Бюджет должен быть числом не меньше 100 ₽';
  }

  if (formData.file) {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(formData.file.type)) {
      errors.image = 'Поддерживаются только JPG или PNG';
    }
  }

  return errors;
}
