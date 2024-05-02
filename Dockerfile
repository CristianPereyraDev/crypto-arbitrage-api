FROM node:latest AS builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

FROM node:20-alpine AS final
WORKDIR /app
COPY --from=builder ./app/dist ./dist
COPY --from=builder ./app/src/graphql/*.graphql /app/dist/src/graphql
RUN mkdir -p app/dist/src/views
COPY --from=builder ./app/src/views/ /app/dist/src/views/
COPY package*.json .
RUN npm install --production
CMD ["npm","start"]