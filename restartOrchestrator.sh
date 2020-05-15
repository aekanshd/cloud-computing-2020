#!/bin/sh

clear
sudo docker container stop mongodb_slave_1
sudo docker container stop dbworker_slave_1
sudo docker image  rm  mongodb_slave_1
sudo docker network prune
docker-compose -f orchestrator/docker-compose.yml up --build
