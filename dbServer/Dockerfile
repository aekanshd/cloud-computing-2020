FROM node:carbon

# Create app directory
WORKDIR /usr/src/app
#Set environment variables
ENV DB_DATABASE="rideshare" DB_SERVER="mongodb://mongodb:27017/" ROLE="master"
# Install app dependencies
COPY package*.json ./
RUN npm install
# Copy app source code
COPY . .
#Expose port and start application
EXPOSE 8000
CMD ["/start.sh"]

