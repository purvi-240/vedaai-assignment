# Backend (Express + WebSocket + in-process BullMQ worker) for Railway.
# Treats backend/ as a standalone package so the monorepo workspace/Nixpacks
# quirks don't interfere with the build.
FROM node:22-slim

WORKDIR /app

# Install backend dependencies (incl. dev deps so `tsc` is available to build).
COPY backend/package.json ./package.json
RUN npm install --include=dev

# Copy backend source and build to ./dist
COPY backend/tsconfig.json ./tsconfig.json
COPY backend/src ./src
COPY backend/assets ./assets
RUN npm run build

ENV NODE_ENV=production

# Railway injects PORT; the server reads process.env.PORT.
CMD ["node", "dist/index.js"]
