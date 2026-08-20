FROM node:22-bookworm-slim AS build

RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY vendor ./vendor
RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
COPY contracts ./contracts
RUN pnpm build

FROM node:22-bookworm-slim AS runtime

RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4200

COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/vendor ./vendor
COPY --from=build /app/contracts ./contracts
COPY --from=build /app/dist ./dist

EXPOSE 4200
CMD ["pnpm", "start"]
