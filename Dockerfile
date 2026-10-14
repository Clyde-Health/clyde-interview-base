# Same base image and Yarn setup as production (clyde-api), split into build and runtime stages so the
# shipped image carries no compiler or dev dependencies.

# ---- build ----
FROM node:22-slim AS build

WORKDIR /app

# Copy only manifests first for better layer caching
COPY package.json yarn.lock .yarnrc.yml ./

# Corepack reads the Yarn version from `packageManager` in package.json
RUN corepack enable && yarn -v

RUN yarn install --immutable

COPY . .

RUN yarn build \
 # Drop dev dependencies (typescript, jest, eslint...) before copying node_modules into the runtime image
 && yarn workspaces focus --all --production

# ---- runtime ----
FROM node:22-slim

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json /app/knexfile.js ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/migrations ./migrations

USER node

EXPOSE 4000

# Apply pending migrations, then start the API. On a paid Render plan you can move the migration into
# `preDeployCommand` in render.yaml instead, so a failed migration never takes the running service down.
CMD ["sh", "-c", "node_modules/.bin/knex migrate:latest && node dist/index.js"]
