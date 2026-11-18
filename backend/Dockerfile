# Imagen del backend en dos etapas:
# 1) build: instala todo y compila TypeScript a JavaScript (carpeta dist/).
# 2) runtime: imagen liviana solo con lo necesario para ejecutar.

FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
EXPOSE 3000
USER node
CMD ["node", "dist/main"]
