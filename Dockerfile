FROM node:12

WORKDIR /project

COPY . .

RUN npm install

CMD ["npm", "run", "start"]