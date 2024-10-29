FROM node:18 AS builder
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

FROM node:18
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/dist ./dist
COPY package*.sjoon ./

RUN npm install --only=production

EXPOSE 3000

CMD ["sh", "-c", "npm run ${NODE_ENV}"]