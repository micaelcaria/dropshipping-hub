FROM node:22-alpine
WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

COPY backend/dist ./dist
COPY backend/public ./public
COPY backend/scraper-output.json ./scraper-output.json

ENV PORT=8000
EXPOSE 8000
CMD ["node", "dist/index.js"]
