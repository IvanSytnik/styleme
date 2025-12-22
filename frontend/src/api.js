/**
 * API клиент для работы с бэкендом
 */

import config from './config';

const API_URL = config.apiUrl;

/**
 * Проверка здоровья сервера
 */
export async function healthCheck() {
  const response = await fetch(`${API_URL}/health`);
  return response.json();
}

/**
 * Получить список всех причесок
 */
export async function getHairstyles() {
  const response = await fetch(`${API_URL}/api/hairstyles`);
  return response.json();
}

/**
 * Получить список женских причесок
 */
export async function getFemaleHairstyles() {
  const response = await fetch(`${API_URL}/api/hairstyles/female`);
  return response.json();
}

/**
 * Получить список мужских причесок
 */
export async function getMaleHairstyles() {
  const response = await fetch(`${API_URL}/api/hairstyles/male`);
  return response.json();
}

/**
 * Трансформировать прическу по ID
 * @param {string} imageBase64 - Изображение в base64
 * @param {number} styleId - ID выбранной прически
 */
export async function transformHairstyle(imageBase64, styleId) {
  const response = await fetch(`${API_URL}/api/transform`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: imageBase64,
      styleId: styleId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка при обработке');
  }

  return response.json();
}

/**
 * Трансформация с кастомным названием прически
 * @param {string} imageBase64 - Изображение в base64
 * @param {string} hairstyleName - Название прически (свободный ввод)
 */
export async function transformCustom(imageBase64, hairstyleName) {
  const response = await fetch(`${API_URL}/api/transform/custom`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: imageBase64,
      hairstyle: hairstyleName,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка при обработке');
  }

  return response.json();
}

/**
 * Трансформация по референсному фото
 * @param {string} imageBase64 - Основное фото пользователя
 * @param {string} referenceImageBase64 - Фото с желаемой прической
 */
export async function transformWithReference(imageBase64, referenceImageBase64) {
  const response = await fetch(`${API_URL}/api/transform/reference`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
    image: imageBase64,
    referenceImage: referenceImageBase64,
  }),

  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка при обработке');
  }

  return response.json();
}

export default {
  healthCheck,
  getHairstyles,
  getFemaleHairstyles,
  getMaleHairstyles,
  transformHairstyle,
  transformCustom,
  transformWithReference,
};