# Retrograde — çok aşamalı Docker build (Next.js standalone).
# Emülatör binary'leri build sırasında setup:emu ile hazırlanır (ağ gerekir).

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# postinstall (setup:emu) node_modules'a ihtiyaç duyar; scripts kopyalanır
COPY scripts ./scripts
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# emülatör binary'lerini public/ altına üret (wasm/bios/kolibri)
RUN npm run setup:emu
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# standalone runtime + statik + public (emülatör binary'leri dahil)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
