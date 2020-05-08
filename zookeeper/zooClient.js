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
	console.log("Connected to the server.");

	createPath(client, "/election");
	createPath(client, "/liveNodes");
	createPath(client, "/allNodes");

	listChildren(client, "/");

	createPath(client, "/test");

	// client.close();
});

client.connect();
