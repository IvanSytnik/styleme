// ============================================
// ТИПЫ ДЛЯ STYLEME FRONTEND
// ============================================

// Экраны приложения
export type Screen = 'upload' | 'select' | 'processing' | 'result';

// Табы выбора
export type TabType = 'female' | 'male' | 'reference';

// Пол
export type Gender = 'male' | 'female';

// Прическа для отображения
export interface Hairstyle {
  id: number;
  name: string;
  emoji: string;
}

// API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Результат трансформации
export interface TransformResult {
  resultImage: string;
  style: string;
  processingTime: number;
}

// Health check response
export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  model: string;
  totalStyles: number;
}

// Список причесок с сервера
export interface HairstyleListItem {
  id: number;
  name: string;
  gender?: Gender;
}
