# frontend/Dockerfile

# 1) Сборка приложения
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2) Сервируем статические файлы через nginx
FROM nginx:stable-alpine
# Копируем собранный билд
COPY --from=builder /app/dist /usr/share/nginx/html
# Копируем ваш локальный конфиг прямо из контекста (не из build-стадии)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# nginx по-умолчанию слушает 80 порт
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
