# loosely based on redwoodjs's dockerfile
FROM node:16.13.0-alpine as base

RUN mkdir /app
WORKDIR /app

FROM base as dependencies

COPY .yarn .yarn
COPY .yarnrc.yml .yarnrc.yml
COPY package.json package.json
COPY vendor/protoc vendor/protoc
COPY shared/package.json shared/package.json
COPY server/package.json server/package.json
COPY www/package.json www/package.json
COPY yarn.lock yarn.lock

# RUN --mount=type=cache,target=/root/.yarn/berry/cache \
# --mount=type=cache,target=/root/.cache yarn install --immutable
RUN yarn install --immutable --immutable-cache

# protoc won't run in alpine containers - needs libc stuff
FROM node:16.13.0 as build

COPY --from=dependencies /app /app
WORKDIR /app

FROM build as shared_build

COPY shared shared
RUN yarn workspace shared build

FROM shared_build as server_build

COPY server server
RUN yarn workspace server build

FROM shared_build as www_build

COPY www www
RUN yarn workspace www build

# after building, `www` is static html
# https://hub.docker.com/_/nginx
FROM nginx as www
COPY --from=www_build /app/www/dist /usr/share/nginx/html

# back to the production alpine container
FROM dependencies as server

ENV NODE_ENV production

COPY --from=server_build /app/server /app/server
COPY --from=shared_build /app/shared /app/shared

EXPOSE 3000
CMD ["/usr/local/bin/yarn","workspace","server","start"]
