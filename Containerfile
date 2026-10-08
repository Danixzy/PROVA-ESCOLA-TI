# Subida: docker build + docker run -p <PORTA>:8080 [-v vol:/data]  → Postgres embutido em /data
#      ou: docker compose up --build                               → Postgres no serviço "db"
# API escuta em 8080 dentro do container; nenhuma variável obrigatória.

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
RUN apt-get update && apt-get install -y --no-install-recommends openssl postgresql \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /data

ENV NODE_ENV=production \
    PORT=8080

COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY variante ./variante
COPY docker-entrypoint.sh ./

EXPOSE 8080
HEALTHCHECK --interval=5s --timeout=3s --retries=20 \
  CMD node -e "fetch('http://localhost:8080/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["sh", "./docker-entrypoint.sh"]