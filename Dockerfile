FROM 'mhart/alpine-node:8'
MAINTAINER Rich Dillon <richraid21@gmail.com>

COPY package.json /app/package.json

RUN cd /app; yarn install

COPY . /app
RUN cd /app; yarn build

EXPOSE 8080
CMD ["node", "/app/lib/main.js"]
