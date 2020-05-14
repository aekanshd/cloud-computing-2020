#!/bin/bash
sleep 10
node load_locations.js &
#node zooClient.js
node controllers/mainController.js
