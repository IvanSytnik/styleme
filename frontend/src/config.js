/**
 * Конфигурация фронтенда
 * API URL берётся из переменных окружения
 */

const config = {
  // URL бэкенда
  // В development: http://localhost:3001
  // В production: берётся из .env
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
};

export default config;
