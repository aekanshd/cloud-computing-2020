# cloud-computing-2020
A repository for Mini Project of Cloud Computing, 6th Sem, Computer Science, PES University.

## Project Strucutre

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

## How to Add a Path?

- If it belongs to main, add the path in `api/routes/main.js` and then its controller in `api/controllers/mainController.js`.

- If it does not belong to main, add a new `.js` file under [api/routes](api/routes) (take main.js as example) and then its function in a separate controller under [api/controllers](api/controllers).

## Why the split?

It helps keeping the code clean, and having related code together.

## Branches

Check out the branches to view the assignments and the final project
