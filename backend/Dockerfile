FROM node:20-alpine

# Установка зависимостей для sharp
RUN apk add --no-cache vips-dev

WORKDIR /app

# Копируем package.json
COPY package*.json ./

# Устанавливаем ВСЕ зависимости (включая dev для компиляции)
RUN npm ci

# Копируем исходный код
COPY tsconfig.json ./
COPY src ./src

# Компилируем TypeScript
RUN npx tsc

# Удаляем devDependencies для production
RUN npm prune --production

# Запускаем
CMD ["node", "dist/server.js"]
