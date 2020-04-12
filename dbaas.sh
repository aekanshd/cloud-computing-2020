#!/bin/sh

docker-compose up -f rabbitmq/docker-compose.yml -d
docker-compose up -f orchestrator/docker-compose.yml -d
docker network connect rabbitmq_network orchestrator_network
