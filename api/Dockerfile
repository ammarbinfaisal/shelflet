FROM node:22-slim

WORKDIR /app

COPY package.json ./
RUN npm install

COPY tsconfig.json ./
COPY books.xlsx ./
COPY src/ ./src/

RUN npm run build

# Create data directory for SQLite
RUN mkdir -p /data

# Seed the database
RUN node --import tsx src/seed.ts

EXPOSE 3001

ENV PORT=3001
ENV DB_PATH=/data/shelflet.db

CMD ["node", "dist/index.js"]
