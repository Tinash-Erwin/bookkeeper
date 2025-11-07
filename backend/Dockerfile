# syntax=docker/dockerfile:1
FROM node:20-slim AS base
WORKDIR /usr/src/app

FROM base AS deps
COPY package*.json ./
RUN npm install

FROM base AS build
ENV NODE_ENV=development
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY package*.json tsconfig.json ./
COPY src ./src
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /usr/src/app/dist ./dist
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force
EXPOSE 8080
CMD ["node", "dist/server.js"]
