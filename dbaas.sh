#!/bin/sh

docker-compoose up -f rabbitmq/docker-compose.yml -d
docker-compoose up -f orchestrator/docker-compose.yml -d
docker network connect rabbitmq_network orchestrator_network
