#!/bin/sh

docker-compose -f rabbitmq/docker-compose.yml up --build --force-recreate -d
docker-compose -f zookeeper/docker-compose.yml up --build --force-recreate -d
docker-compose -f dbServer/docker-compose-master.yml up --force-recreate --build -d
docker-compose -f dbServer/docker-compose-slave.yml up --force-recreate --build -d
docker-compose -f orchestrator/docker-compose.yml up --force-recreate --build


