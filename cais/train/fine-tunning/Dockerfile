FROM node:24-alpine AS build
WORKDIR /srv
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:24-bookworm-slim AS node

FROM ghcr.io/ggml-org/llama.cpp:full
COPY --from=node /usr/local/bin/node /usr/local/bin/node
WORKDIR /srv
ENV NODE_ENV=production LLAMA_BIN_DIR=/app
COPY --from=build /srv/package.json ./
COPY --from=build /srv/node_modules ./node_modules
COPY --from=build /srv/dist ./dist
USER 1000:1000
EXPOSE 3000
ENTRYPOINT []
CMD ["node", "dist/main"]
