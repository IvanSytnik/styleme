// ============================================
// ТИПЫ ДЛЯ STYLEME BACKEND
// ============================================

// Пол для причесок
export type Gender = 'male' | 'female';

// Прическа
export interface Hairstyle {
  name: string;
  gender: Gender;
  prompt: string;
}

// Каталог причесок
export interface HairstyleCatalog {
  [id: number]: Hairstyle;
}

// API Response базовый
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Ответ трансформации
export interface TransformResult {
  resultImage: string;
  style: string;
  processingTime: number;
}

// Список причесок для клиента
export interface HairstyleListItem {
  id: number;
  name: string;
  gender?: Gender;
}

// Конфигурация приложения
export interface AppConfig {
  port: number;
  nodeEnv: string;
  frontendUrl: string;
  replicate: {
    apiToken: string;
    model: string;
  };
  limits: {
    maxFileSize: number;
    maxImageDimension: number;
  };
}

// Health check response
export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  model: string;
  totalStyles: number;
}

// Request body для transform
export interface TransformRequestBody {
  image?: string;
  styleId?: number;
}

// Request body для custom transform
export interface CustomTransformRequestBody {
  image?: string;
  hairstyle?: string;
  prompt?: string;
}

// Request body для reference transform
export interface ReferenceTransformRequestBody {
  image?: string;
  reference?: string;
}
