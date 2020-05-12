// Not needed anymore but on hold. (Master/Slave solution)

// Import Zookeeper
var zookeeper = require("node-zookeeper-client");
const { spawn } = require("child_process");
var os = require("os");
var hostname = os.hostname();
const Docker = require("dockerode");
const docker = new Docker();

CreateMode = zookeeper.CreateMode;
Event = zookeeper.Event;

// Declare Global Variables
state = {
	id: String,
	allNodes: Array,
	liveNodes: Array,
	electionNodes: Array,
	leader: null,
	cid: null,
	pid: null
};

console.log("Container ID:", hostname)

docker.getContainer(hostname).inspect(function (err, data) {
	console.log("Container PID:", data["State"]["Pid"]);
	state.pid = data["State"]["Pid"];
});

// Connect to server at localhost and initiate client
var client = zookeeper.createClient("zoo:2181", { retries: 3 });

// Function to create a path
let createPath = (client, path, mode = CreateMode.PERSISTENT) => {
	client.create(path, Buffer.from(hostname), mode, (error) => {
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
				state.SERVER.kill();
				const server = spawn("node", [
					"./controllers/mainController.js",
				]);

				server.on("close", (code) => {
					console.log(`Child process exited with code ${code}\nStanding by until manual exit.`);
					process.exit(1);
				});

				server.on("error", (error) => {
					console.log(`error: ${error.message}`);
				});

				server.stdout.on("data", (data) => {
					console.log(`stdout: ${data}`);
				});

				server.stderr.on("data", (data) => {
					console.log(`stderr: ${data}`);
				});

				state.SERVER = server;
			} else console.log("My leader is %s", state.leader);
		}
	);
};

client.once("connected", () => {
	console.log("Connected to the Zookeeper server.");
	state.id = client.getSessionId().toString("hex");

	console.log("Creating child ephemeral node under Zookeeper for PID %s", state.pid);

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

	const server = spawn("node", ["./controllers/mainController.js"]);

	server.on("close", (code) => {
		console.log(`Child process exited with code ${code}\nStanding by until manual exit.`);
		//process.exit(1);
	});

	server.on("error", (error) => {
		console.log(`error: ${error.message}`);
	});

	server.stdout.on("data", (data) => {
		console.log(`stdout: ${data}`);
	});

	server.stderr.on("data", (data) => {
		console.log(`stderr: ${data}`);
	});

	state.SERVER = server;
	// createPath(client, "/test");

	// client.close();
});

client.connect();
