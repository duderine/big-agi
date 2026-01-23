FROM node:20-bookworm-slim AS builder
# Instalando git rápido só para o build não reclamar
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY . .
ENV NEXT_PRIVATE_STANDALONE true
RUN npm install && npm run build

FROM node:20-bookworm-slim
WORKDIR /app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]