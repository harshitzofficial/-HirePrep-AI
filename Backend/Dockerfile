# Use a lightweight Node.js image
FROM node:22-alpine

# Set the environment to production (Optimizes Express and React!)
ENV NODE_ENV=production

# Set the working directory inside the container
WORKDIR /usr/src/app

# 🚀 THE FIX: Install Alpine's native Chromium and font rendering libraries
# This must run as the root user before we switch to the 'node' user below
RUN apk update && apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# 🚀 THE FIX: Tell Puppeteer NOT to download its own Chrome, and where to find the Alpine one
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Change ownership of the directory to the safe 'node' user
RUN chown -R node:node /usr/src/app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Switch to the low-privileged user BEFORE installing npm packages
USER node

# Install strictly production dependencies (ignores devDependencies)
# 'npm ci' is faster and more reliable than 'npm install' for CI/CD
RUN npm ci --omit=dev

# Copy the rest of your backend code (Make sure you have a .dockerignore!)
COPY --chown=node:node . .

# Expose the port your Express app runs on
EXPOSE 3000

# Start the application directly (Do NOT use nodemon here!)
CMD ["node", "server.js"]