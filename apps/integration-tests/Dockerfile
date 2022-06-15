FROM node:16.14.2-alpine as base
WORKDIR /code
COPY lerna.json .
COPY tsconfig.json .
COPY package.json .
COPY yarn.lock .
COPY turbo.json .

FROM base as prune
RUN yarn global add turbo
COPY . .
ARG APP
RUN turbo prune --scope=${APP} --docker

FROM base as build
COPY --from=base /code /code

# Install dependencies
COPY --from=prune /code/out/json .
RUN yarn install --frozen-lockfile

# Build typescript
COPY --from=prune /code/out/full .
RUN yarn build

# Clean up dev dependencies
RUN yarn install --production

FROM base
ARG APP

COPY --from=build /code/libs /code/libs
COPY --from=build /code/node_modules /code/node_modules
COPY --from=build /code/apps/${APP} /code/apps/${APP}

WORKDIR /code/apps/${APP}
CMD [ "yarn", "start" ]
