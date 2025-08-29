FROM node:22-alpine
WORKDIR /app

# Copy files
COPY ./package.json .
COPY ./package-lock.json .
COPY ./tsconfig.json .
COPY ./tsconfig.build.json .

# Install dependencies
RUN npm install

EXPOSE 3000

CMD ["npm","run","start:dev"]