FROM node:20-alpine

WORKDIR /app

# Copy only the files that actually exist in your project
COPY package.json package-lock.json ./

RUN npm install

# Copy the rest of the frontend code
COPY . /app
