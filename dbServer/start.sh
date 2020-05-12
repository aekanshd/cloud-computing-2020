#!/bin/bash
sleep 5
node load_locations.js &
#node zooClient.js
node controllers/mainController.js
