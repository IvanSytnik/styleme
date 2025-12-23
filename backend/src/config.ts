/**
 * Конфигурация приложения
 * Все секретные ключи берутся из .env файла
 */

import dotenv from 'dotenv';
import { AppConfig } from './types';

dotenv.config();

const config: AppConfig = {
  // Сервер
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // CORS - разрешённые домены фронтенда
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Replicate API (nano-banana)
  replicate: {
    apiToken: process.env.REPLICATE_API_TOKEN || '',
    model: 'google/nano-banana',
  },
  
  // Лимиты
  limits: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxImageDimension: 1024,
  },
};

export default config;
