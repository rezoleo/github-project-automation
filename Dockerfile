FROM node:12.16-alpine as builder

WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build


FROM node:12.16-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production
COPY --from=builder /app/lib ./lib

EXPOSE 3000
CMD ["npm", "start"]
