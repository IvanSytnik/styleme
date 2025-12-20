/**
 * Конфигурация приложения
 * Все секретные ключи берутся из .env файла
 */

require('dotenv').config();

module.exports = {
  // Сервер
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // CORS - разрешённые домены фронтенда
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Replicate API (nano-banana)
  replicate: {
    apiToken: process.env.REPLICATE_API_TOKEN,
    model: 'google/nano-banana',
  },
  
  // Лимиты
  limits: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxImageDimension: 1024,
  },
};
