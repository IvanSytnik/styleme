/**
 * API клиент для работы с бэкендом
 */

import config from './config';
import { 
  ApiResponse, 
  TransformResult, 
  HealthCheckResponse, 
  HairstyleListItem 
} from './types';

const API_URL = config.apiUrl;

/**
 * Проверка здоровья сервера
 */
export async function healthCheck(): Promise<HealthCheckResponse> {
  const response = await fetch(`${API_URL}/health`);
  return response.json();
}

/**
 * Получить список всех причесок
 */
export async function getHairstyles(): Promise<ApiResponse<HairstyleListItem[]>> {
  const response = await fetch(`${API_URL}/api/hairstyles`);
  return response.json();
}

/**
 * Получить список женских причесок
 */
export async function getFemaleHairstyles(): Promise<ApiResponse<HairstyleListItem[]>> {
  const response = await fetch(`${API_URL}/api/hairstyles/female`);
  return response.json();
}

/**
 * Получить список мужских причесок
 */
export async function getMaleHairstyles(): Promise<ApiResponse<HairstyleListItem[]>> {
  const response = await fetch(`${API_URL}/api/hairstyles/male`);
  return response.json();
}

/**
 * Трансформировать прическу по ID
 */
export async function transformHairstyle(
  imageBase64: string, 
  styleId: number
): Promise<ApiResponse<TransformResult>> {
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
 */
export async function transformCustom(
  imageBase64: string, 
  hairstyleName: string
): Promise<ApiResponse<TransformResult>> {
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
 * Трансформация с фото-референсом прически
 */
export async function transformWithReference(
  imageBase64: string, 
  referenceBase64: string
): Promise<ApiResponse<TransformResult>> {
  const response = await fetch(`${API_URL}/api/transform/reference`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: imageBase64,
      reference: referenceBase64,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка при обработке');
  }

  return response.json();
}

const api = {
  healthCheck,
  getHairstyles,
  getFemaleHairstyles,
  getMaleHairstyles,
  transformHairstyle,
  transformCustom,
  transformWithReference,
};

export default api;
