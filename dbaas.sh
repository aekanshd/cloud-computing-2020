#!/bin/sh

docker-compose -f rabbitmq/docker-compose.yml up -d
docker-compose -f orchestrator/docker-compose.yml up -d
docker network connect rabbitmq_network orchestrator
