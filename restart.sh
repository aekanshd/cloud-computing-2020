#!/bin/sh

echo "Stopping all containers:"
docker stop $(docker ps -q)
echo "Listing containers:"
docker ps
echo "Composing new..."
./dbaas.sh
#docker-compose -f orchestrator/docker-compose.yml up --build
