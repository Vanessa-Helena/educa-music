FROM node:18-slim

# Instala dependências do sistema necessárias
RUN apt-get update && \
    apt-get install -y \
    python3 \
    build-essential \
    g++ \
    make \
    cmake \
    libgflags-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 3000
CMD ["node", "src/server.js"]