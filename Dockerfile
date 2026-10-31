FROM node:26-bookworm-slim@sha256:bc0a2afd3b74ce12222fc8bab99271e66257f021078f5f4a5d687a77d280c1d9 AS dependencies
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/domain/package.json ./packages/domain/package.json
COPY packages/application/package.json ./packages/application/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY packages/infrastructure/package.json ./packages/infrastructure/package.json
COPY packages/editor/package.json ./packages/editor/package.json
RUN npm ci --no-audit --no-fund
COPY . .

FROM dependencies AS api
ENV NODE_ENV=production
USER node
EXPOSE 3001
CMD ["node", "--import", "tsx", "apps/api/src/server.ts"]

FROM dependencies AS web-build
ENV API_INTERNAL_URL=http://api:3001
RUN npm run build --workspace @storymaster/web

FROM web-build AS web
ENV NODE_ENV=production
USER node
EXPOSE 3000
CMD ["npm", "run", "start", "--workspace", "@storymaster/web"]
