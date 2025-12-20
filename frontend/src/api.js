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
 * Получить список причесок
 */
export async function getHairstyles() {
  const response = await fetch(`${API_URL}/api/hairstyles`);
  return response.json();
}

/**
 * Трансформировать прическу
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
 * Трансформация с кастомным промптом
 * @param {string} imageBase64 - Изображение в base64
 * @param {string} prompt - Кастомный промпт
 */
export async function transformCustom(imageBase64, prompt) {
  const response = await fetch(`${API_URL}/api/transform/custom`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: imageBase64,
      prompt: prompt,
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
  transformHairstyle,
  transformCustom,
};
