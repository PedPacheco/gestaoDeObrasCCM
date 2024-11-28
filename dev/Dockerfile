FROM node:20-alpine AS builder
WORKDIR /src

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

FROM node:20-alpine AS development
WORKDIR /src

COPY --from=builder /src /src

COPY package*.json ./

RUN npm install

EXPOSE 8080

ENV NODE_ENV=development

CMD ["npm", "run", "start:dev"]

FROM node:20-alpine AS production
WORKDIR /src

COPY --from=builder /src/dist ./dist
COPY package*.json ./

RUN npm install --only=production

RUN rm -rf /src/dev/src /src/dev/test

EXPOSE 8080

ENV NODE_ENV=production

CMD ["npm", "run", "start:prod"]