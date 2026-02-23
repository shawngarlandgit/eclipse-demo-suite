FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY src ./src
COPY tsconfig.json ./
RUN npx tsc -p tsconfig.json
EXPOSE 8787
CMD ["node", "dist/index.js"]
