# syntax=docker/dockerfile:1
FROM node:20-slim AS base
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY tsconfig*.json ./
COPY index.html ./
COPY tailwind.config.ts vite.config.ts postcss.config.cjs ./
COPY public ./public
COPY src ./src

RUN npm run build

EXPOSE 5173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
