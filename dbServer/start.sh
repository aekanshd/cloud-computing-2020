#!/bin/sh

(node load_locations.js;\
node zooClient.js & \
node controllers/mainController.js )
