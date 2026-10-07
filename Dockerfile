# Baut das Frontend und startet den Server, der API, WebSockets und Frontend ausliefert.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3001
COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
RUN npm ci --workspace server --omit=dev
COPY server server
COPY shared shared
COPY --from=build /app/client/dist client/dist
EXPOSE 3001
CMD ["npm", "start"]
