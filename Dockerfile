FROM node:latest AS builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

FROM node:latest AS final
WORKDIR /app
COPY --from=builder ./app/dist ./dist
COPY /app/src/graphql/*.graphql /app/dist/graphql
COPY /app/src/views/* app/dist
COPY package*.json .
RUN npm install --production
CMD ["npm","start"]