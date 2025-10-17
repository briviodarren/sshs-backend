# Use an official lightweight Node.js image
FROM node:18-alpine

# Create and set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json for dependency installation
COPY package*.json ./

# Install the project dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Tell Docker that the app runs on port 5000
EXPOSE 5000

# The command to start your server
CMD ["node", "index.js"]