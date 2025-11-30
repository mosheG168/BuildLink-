FROM node:18-slim

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm install

# Copy source
COPY backend/src ./src
COPY backend/index.js .
COPY backend/scripts ./scripts
COPY shared /shared

# Set environment
ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["node", "index.js"]