var express = require("express");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

var os = require("os");
var hostname = os.hostname();
const Docker = require("dockerode");
const docker = new Docker();

console.log("Container ID:", hostname)

docker.getContainer(hostname).inspect(function (err, data) {
  console.log("Container PID:", data["State"]["Pid"]);
});


/*--------------------
  Initialize express
  --------------------*/
var app = express();

/*-----------------------
  Parse request content
  -----------------------*/
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

/*--------
  Routes
  --------*/

// Index API Route
app.get("/", function (req, res) {
  var api_routes = "";
  api_routes += "GET /" + "<br>";
  api_routes += "GET /api/v1/db" + "<br>";
  res.send("Available APIs:<br><br>" + api_routes);
});

// API routes
app.use("/api/v1/", require("./routes/index"));

/*---------------
  Server startup
  ---------------*/

var zookeeper = require("node-zookeeper-client");

var client = zookeeper.createClient("zoo:2181");

let createPath = (client, path) => {
  client.create(path, (error) => {
    if (error)
      console.log("Failed to create node: %s due to: %s.", path, error);
    else console.log("Node: %s is successfully created.", path);
  });
};

let listChildren = (client, path) => {
  client.getChildren(
    path,
    (event) => {
      console.log("Got watcher event: %s", event);
      listChildren(client, path);
    },
    (error, children, stat) => {
      if (error) {
        console.log(
          "Failed to list children of %s due to: %s.",
          path,
          error
        );
        return;
      }

      console.log("Children of %s are: %j.", path, children);
    }
  );
};

client.once("connected", () => {
  console.log("Connected to the Zookeeper server.");

  createPath(client, "/election");
  createPath(client, "/liveNodes");
  createPath(client, "/allNodes");

  listChildren(client, "/");

  createPath(client, "/test");

  console.log("Initialized Zookeeper.");
  // client.close();
});

client.connect();

var server = require("http").createServer(app);
server.listen(8000);
console.log("Orchestrator Initialized.");
