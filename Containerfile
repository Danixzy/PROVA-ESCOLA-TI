# Subida: docker compose up --build  (API na 8080, Postgres no serviço "db")
# API escuta em 8080 dentro do container; nenhuma variável obrigatória (defaults abaixo).

# ---------- build ----------
FROM node:20-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY src/package.json src/package-lock.json ./
COPY src/prisma ./prisma
RUN npm ci

COPY src/ ./
RUN npm run build && npm prune --omit=dev

# ---------- runtime ----------
FROM node:20-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    PORT=8080 \
    DATABASE_URL=postgresql://app:app@db:5432/app?schema=public

COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY variante ./variante

USER node
EXPOSE 8080
HEALTHCHECK --interval=5s --timeout=3s --retries=10 \
  CMD node -e "fetch('http://localhost:8080/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && exec node dist/server.js"]