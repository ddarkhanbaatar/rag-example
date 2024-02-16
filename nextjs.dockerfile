FROM node:18.18.0-buster
WORKDIR /app

EXPOSE 3000
ENV PORT 3000

CMD [ "npm", "dev", "run" ]