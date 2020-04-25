var express = require("express");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

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
	api_routes += "GET /api" + "<br>";
	res.send("Available APIs:<br><br>" + api_routes);
});

// API routes
// app.use('/api', require('./routes/index'));

// Zookeeper
var zookeeper = require("node-zookeeper-client");
CreateMode = zookeeper.CreateMode;
Event = zookeeper.Event;

// Declare Global Variables
state = {
	id: String,
	allNodes: Array,
	liveNodes: Array,
	electionNodes: Array,
	leader: null,
};

// Connect to server at localhost and initiate client
var client = zookeeper.createClient("localhost:2181", { retries: 3 });

// Function to create a path
let createPath = (client, path, mode = CreateMode.PERSISTENT) => {
	client.create(path, mode, (error) => {
		if (error)
			console.log("Failed to create node: %s due to: %s.", path, error);
		else console.log("Node: %s is successfully created.", path);
	});
};

setLeaderWatch = (client) => {
	client.getChildren(
		"/election",
		(event) => {
			console.log("Got watcher event: %s", event);
			setLeaderWatch(client);
		},
		(error, children, stat) => {
			if (error) {
				console.log(
					"Failed to list children of /election due to: %s.",
					error
				);
				return;
			}

			console.log("Children of %s are: %j.", "/election", children);

			state.electionNodes = children.sort();
			state.leader = state.electionNodes[0];

			if (state.leader == "leader-" + state.id) {
				// Switch to master
				console.log("Switching to master");
				process.env.ROLE = "master";
				// This doesn't work as of now...
				process.exit();
			} else console.log("My leader is %s", state.leader);
		}
	);
};

client.once("connected", () => {
	console.log("Connected to the server.");
	state.id = client.getSessionId().toString("hex");

	createPath(
		client,
		"/election/leader-" + state.id,
		CreateMode.EPHEMERAL | CreateMode.SEQUENCE
	);

	// createPath(client, "/liveNodes");
	// createPath(client, "/allNodes");

	client.getChildren("/", (error, children, stat) =>
		console.log("Children of %s are: %j.", "/", children)
	);

	setLeaderWatch(client);

	// createPath(client, "/test");

	// client.close();
});

client.connect();

/*---------------
  Server startup
  ---------------*/
console.log("Server has been started.");
var server = require("http").createServer(app);
server.listen(8000);


if (process.env.ROLE == "master") {
	console.log("Acting as Master");
} else {
	console.log("Acting as Slave");
}
