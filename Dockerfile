# Dockerfile for Pokemon Showdown Server
FROM node:13

# Create app directory
WORKDIR /usr/src/app

# Copy package and cache things
COPY package*.json ./
RUN npm install

# Copy the application into the docker image
COPY . .

# Expose the server on port 8000
EXPOSE 8000

# Start the server
CMD ["pokemon-showdown"]
