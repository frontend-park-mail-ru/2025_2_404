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
  if (!formData.budget || isNaN(budgetNum) || budgetNum < 0) {
    errors.budget = 'Бюджет должен быть не отрицательным числом';
  }

  if (formData.file) {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(formData.file.type)) {
      errors.image = 'Поддерживаются только JPG или PNG';
    }
  }

  // Валидация дат
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Начало текущего дня
  
  const startDate = formData.start_at ? new Date(formData.start_at) : null;
  const endDate = formData.end_at ? new Date(formData.end_at) : null;
  
  if (startDate) {
    if (startDate < now) {
      errors.start_at = 'Дата начала не может быть в прошлом';
    }
  }
  
  if (endDate) {
    if (startDate && endDate < startDate) {
      errors.end_at = 'Дата окончания должна быть позже даты начала';
    }
    
    if (startDate) {
      const oneYearLater = new Date(startDate);
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
      
      if (endDate > oneYearLater) {
        errors.end_at = 'Длительность рекламы не может превышать 1 год';
      }
    }
  }

  return errors;
}
