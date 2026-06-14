# Build stage
FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Run stage
FROM node:20-slim

WORKDIR /usr/src/app

COPY package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

RUN mkdir -p data

ENV PORT=8080
EXPOSE 8080

CMD ["npm", "run", "start"]
