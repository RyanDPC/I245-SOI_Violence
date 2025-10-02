FROM node:18-slim

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package.json
RUN npm install --production
COPY server.js server.js
COPY static static
EXPOSE 3000
CMD ["node", "server.js"]
