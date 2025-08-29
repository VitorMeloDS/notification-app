FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install -g @angular/cli
RUN npm install

EXPOSE 4200

# O código fonte será montado via volume
CMD ["ng", "serve", "--host", "0.0.0.0", "--poll", "1000"]
