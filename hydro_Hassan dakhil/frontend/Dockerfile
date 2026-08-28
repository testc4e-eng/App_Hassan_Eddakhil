FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_API_BASE=/api/v1
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_API_URL=/api

ENV VITE_API_BASE=$VITE_API_BASE
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html nginx.conf vite.config.ts postcss.config.js tailwind.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY scripts/check-utf8.mjs ./scripts/check-utf8.mjs
COPY public ./public
COPY src ./src

RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
