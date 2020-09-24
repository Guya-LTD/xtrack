FROM node:13.12.0-alpine AS production

# Create app directory
ENV WORK_DIR /usr/src/app
WORKDIR ${WORK_DIR}

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
ENV NODE_ENV=production
RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 3000
CMD [ "npm", "start" ]