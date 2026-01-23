FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY . .
RUN npm install && npm run build

FROM node:20-bookworm-slim
WORKDIR /app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
