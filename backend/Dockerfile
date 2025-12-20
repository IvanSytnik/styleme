# StyleMe Backend - Dockerfile
# Используй если деплоишь на Docker-based хостинги

FROM node:20-alpine

# Установка зависимостей для sharp
RUN apk add --no-cache python3 make g++ vips-dev

WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm ci --only=production

# Копируем исходники
COPY server.js config.js ./

# Порт
ENV PORT=3001
EXPOSE 3001

# Запуск
CMD ["node", "server.js"]
