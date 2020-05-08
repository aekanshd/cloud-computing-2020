#!/bin/sh

docker-compose -f rabbitmq/docker-compose.yml up --build -d
docker-compose -f zookeeper/docker-compose.yml up --build -d
docker-compose -f orchestrator/docker-compose.yml up --build -d
docker-compose -f dbserver/docker-compose.yml up --build -d
docker-compose -f dbserver/docker-compose.yml up --build -d
docker network connect rabbitmq_rabbitmq_network orchestrator
docker network connect zookeeper_zookeeper dbserver_masterdb_1
