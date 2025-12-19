FROM node:current-alpine3.21

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Собираем TypeScript через Vite
RUN npm run build

# Копируем шаблоны и статику в dist (Vite их не включает в бандл)
RUN cp -r pages dist/pages
RUN cp -r public dist/public
RUN cp -r services dist/services
RUN cp style.css dist/style.css || true
RUN cp kit.jpg dist/kit.jpg || true

EXPOSE 8000

CMD ["node", "server/app.cjs"]