# ============================================================
# ESTÁGIO 1 — BUILD (compila o React com Node + Vite)
# ============================================================
# FROM node:18-alpine AS build
FROM node:18 AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ============================================================
# ESTÁGIO 2 — NGINX (serve os arquivos estáticos + proxy)
# ============================================================
FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
