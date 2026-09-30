FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .
RUN chmod +x /app/docker_entry.sh

CMD ["/bin/sh", "/app/docker_entry.sh"]