FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy package files first for better Docker cache utilisation
COPY package.json package-lock.json* ./

# Install ALL dependencies (dev deps needed for Vite)
RUN npm ci

# Copy application source code
COPY . .

# Make entrypoint executable (belt-and-suspenders)
RUN chmod +x ./docker/entrypoint.sh

# Expose Vite dev server port
EXPOSE 5174

# Call sh explicitly so no execute bit is required on the host file
ENTRYPOINT ["sh", "./docker/entrypoint.sh"]
