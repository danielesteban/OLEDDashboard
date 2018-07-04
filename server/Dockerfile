FROM node:carbon

# Set timezone
RUN rm -f /etc/localtime && ln -s /usr/share/zoneinfo/Europe/Madrid /etc/localtime

# Install forever
ENV NODE_ENV=production
RUN yarn global add forever

# Create working directory
RUN mkdir -p /usr/src/server
WORKDIR /usr/src/server

# Install dependencies
COPY package.json .
COPY yarn.lock .
RUN yarn install

# Bundle js
COPY *.js gmail ./

# De-escalate privileges
USER node

# Start server
EXPOSE 8080
CMD [ "yarn", "start" ]
