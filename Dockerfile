# Build stage
FROM node:18-bullseye AS builder

WORKDIR /app

# Install Python 3 and system dependencies for rembg
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    gcc \
    g++ \
    make \
    libpython3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy app source (entire apps folder with package.json and package-lock.json)
COPY apps/ ./

# Install Node dependencies
# Use npm install instead of npm ci to handle cases where package-lock.json might not be available
RUN npm install

# Install Python dependencies
RUN pip3 install --no-cache-dir rembg onnxruntime pillow

# Build Next.js application
RUN npm run build

# Runtime stage
FROM node:18-bullseye

WORKDIR /app

# Install Python 3 and runtime dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

# Install Python dependencies in runtime
RUN pip3 install --no-cache-dir rembg onnxruntime pillow

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
