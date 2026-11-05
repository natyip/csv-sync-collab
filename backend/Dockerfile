FROM node:22-alpine

WORKDIR /app

# Install build essentials and python3 required for native modules like better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000
CMD ["npm", "run", "dev"]