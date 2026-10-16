FROM node:22-alpine

WORKDIR /frontend

COPY package.json yarn.lock ./
RUN corepack enable && yarn install --immutable

COPY . ./

EXPOSE 7777
CMD ["yarn", "dev", "--host", "0.0.0.0", "--port", "7777"]
