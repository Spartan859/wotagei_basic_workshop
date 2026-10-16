# syntax=docker/dockerfile:1.7

FROM node:16-alpine AS build

WORKDIR /app

COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

FROM node:16-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# 复制依赖和代码
COPY --from=build /app/node_modules ./node_modules
COPY server/package.json ./
COPY server/*.js ./
COPY server/routes ./routes
COPY public ./public

# 创建非 root 用户
RUN chown -R node:node /app

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O - http://127.0.0.1:3000/presentation/index.html >/dev/null || exit 1

CMD ["node", "app.js"]
