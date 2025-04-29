FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN echo "Using VITE_API_URL=$VITE_API_URL"

COPY package.json package-lock.json ./
RUN npm install

COPY . .

RUN npm run build

FROM nginx:1.25-alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/dist /usr/share/nginx/html

# COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
