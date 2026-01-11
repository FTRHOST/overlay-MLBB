# Stage 1: Build the application
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the server
RUN npm run build:server

# Stage 2: Create the production image
FROM node:20-slim

WORKDIR /app

# Copy dependencies from the builder stage
COPY --from=builder /app/node_modules ./node_modules
# Copy the compiled server code from the builder stage
COPY --from=builder /app/dist ./dist
# Copy public assets
COPY --from=builder /app/public ./public


# Expose the port the server will run on
EXPOSE 3002

# The command to run the application
CMD ["npm", "start"]
