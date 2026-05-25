FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

ARG SITE_URL=https://okhlopkov.com
ARG VITE_SITE_URL=https://okhlopkov.com
ENV SITE_URL=$SITE_URL
ENV VITE_SITE_URL=$VITE_SITE_URL

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
