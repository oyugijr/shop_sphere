# Use Node.js official image as base
FROM node:18

# Set author metadata
LABEL author="Oyugi <oyugimaurice22@gmail.com>"

# Set working directory inside container
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose the service port
EXPOSE 5002

# Command to start the service
CMD ["npm", "start"]
