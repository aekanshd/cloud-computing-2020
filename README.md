# cloud-computing-2020
A repository for Mini Project of Cloud Computing, 6th Sem, Computer Science, PES University.

## Quick Start and Management

To start the project, run the commands:
```bash
sudo chmod +x ./*.sh
sudo ./dbaas.sh
```

### `dbaas.sh`

This script start 7 docker containers:

1. RabbitMQ
2. ZooKeeper
3. Orchestrator
4. MongoDB
5. dbServer

### `restart.sh`

This script removes all the running containers (orphans might be excluded), and then runs `./dbaas.sh`.

### `restartOrchestrator.sh`

This script removes all the slaves and the master container of MongoDB, prunes the network and rebuils the orchestrator image from source. Used for debugging purposes.

## Project Structure

1. Four directories, each acting as a docker image. (build using `docker-compose.yml`)
2. The [dbserver](/dbServer), and [orchestrator](/orchestrator) are NodeJS apps. We use these to build up the images for their respective containers.

## Node App Structure

Each of the NodeJS app mentioned above follow the same hierarchical order as we explain below.

### Installation

1. Install the npm modules from `package.json`.
2. Use `npm start` to begin. 
3. Visit at [http://localhost:8000](http://localhost:8000).

### server.js

This serves as the starting point of the Express App server. It attaches route path modules from [api/routes](/api/routes/).

### api/routes

#### index.js

This is the starting module of the routes module. Each specific set of related paths are available in their `.js` files.

#### main.js

Each module contains the paths of controllers that are related to it.

### api/controllers

This folder contains all the path's functions which are related to one another. Each `.js` file contains functions that are required by its path.

### How to Add a Path?

- If it belongs to main, add the path in `api/routes/main.js` and then its controller in `api/controllers/mainController.js`.

- If it does not belong to main, add a new `.js` file under [api/routes](api/routes) (take main.js as example) and then its function in a separate controller under [api/controllers](api/controllers).

### Why the split?

It helps keeping the code clean, and having related code together.