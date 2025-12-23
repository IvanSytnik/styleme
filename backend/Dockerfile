FROM node:20-alpine

# Установка зависимостей для sharp
RUN apk add --no-cache vips-dev

WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm ci --only=production
RUN npm install typescript

# Копируем исходный код и собираем
COPY tsconfig.json ./
COPY src ./src
RUN npx tsc

# Запускаем собранный JS
CMD ["node", "dist/server.js"]
