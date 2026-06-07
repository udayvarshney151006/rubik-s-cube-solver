FROM node:18-bullseye-slim

# Install GCC, Make, and CMake for C++ compilation
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy backend source
COPY . .

# Compile the C++ solver
RUN mkdir -p bin
RUN gcc -O3 -I./kociemba_api ./kociemba_api/*.c -o ./bin/kociemba_solver

# Expose port
EXPOSE 5000

# Start server
CMD [ "npm", "start" ]
