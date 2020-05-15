var Docker = require("dockerode");
//tar = require("tar-fs")
path = require("path");
let docker = new Docker();
const request = require("request-promise");
var reqRate = 0;
var workerCount = [];
var workers = {};
var zookeeper = require("node-zookeeper-client");
var PID = {};

process.on('unhandledRejection', error => {
  console.log('unhandledRejection', error);
})


function initialiseWorkers() {
	docker.listContainers(async (err, containers) => {
		await containers.forEach((container) => {
			container.Names.forEach((name) => {
				console.log(name);
				if (name == "/dbworker_master") {
					if (workers["master"] == undefined) {
						workers["master"] = {};
					}
					workers["master"]["serverId"] = container.Id;
					console.log("master set");
				} else if (name == "/dbworker_slave") {
					if (workers["slave"] == undefined) {
						workers["slave"] = {};
					}
					workers["slave"]["serverId"] = container.Id;
				} else if (name == "/mongodb_master") {
					if (workers["master"] == undefined) {
						workers["master"] = {};
					}
					workers["master"]["dbId"] = container.Id;
				} else if (name == "/mongodb_slave") {
					if (workers["slave"] == undefined) {
						workers["slave"] = {};
					}
					workers["slave"]["dbId"] = container.Id;
				}
			});
		});
		await docker.listNetworks((err, networks) => {
			if (err) {
				console.log("Failed to List Networkss\n");
				console.log(err);
				return;
			}
			networks.forEach((network) => {
				if (network.Name == "master_network") {
					workers["master"]["networkId"] = network.Id;
				} else if (network.Name == "slave_network") {
					workers["slave"]["networkId"] = network.Id;
				}
			});
		});
	});
}

function getNextIndex() {
	var i = 1;
	while (i <= workerCount.length) {
		if (i != workerCount[i - 1]) {
			workerCount[i - 1] = i;
			break;
		}
		i += 1;
	}
	if (i == workerCount.length + 1) {
		workerCount.push(i);
	}
	return i;
}
async function createWorker(callback) {
	var workerIndex = await getNextIndex();
	await replicateContainer(
		"mongodb_master",
		"mongodb_slave_" + workerIndex,
		"mongodb_slave_" + workerIndex,
		(err, newSlaveId) => {
			if (err) {
				console.log(err);
				return callback(err);
			}
			console.log("Replicated mongo Successfully")
			docker.createNetwork(
				{
					Name: "slave_network_" + workerIndex,
					Driver: "bridge",
				},
				(err, network) => {
					if (err) {
						console.log(err);
						return callback(err);
					}
					
					console.log("Network Created\n");
					network.connect({ Container: newSlaveId }, (err, data) => {
						if (err) {
							console.log(
								"Failed to attach mongodb to slave network..."
							);
							console.log(err);
							return callback(err);
						}
						console.log("Connected Mongo to network : ","slave_network_" + workerIndex)
						docker.run(
							"dbworker_slave:latest",
							["./start.sh"],
							undefined,
							{
								name: "dbworker_slave_" + workerIndex,
								Env: ["ROLE=slave", "DB_HOST=mongodb_slave_"+workerIndex],
								HostConfig: { AutoRemove: true ,NetworkMode: "rabbitmq_network"},
							},
							(err, data, container) => {
								if (err) {
									console.log("network.connect Error:\n", err);
									return callback(err);
								}
								console.log(data.StatusCode)
								console.log("Container Stopped....")
							}).on("container",(container)=>{
								console.log("Container up...")
								console.log("Container up with ID: ", container.id);
								network.connect(
									{ Container: container.id },
									(err, data) => {
										if (err) {
											console.log(
												"Failed to attach slave to slave network..."
											);
											console.log(err);
											return callback(err);
										}
										console.log("Connected dbworker to slave network")
										docker.listNetworks((err, networks) => {
											if (err) {
												console.log(
													"failed to list networks"
												);
												return callback(err);
											}
											networks.forEach((network) => {
												if (
													network.Name ==
													"zookeeper_network"
												) {
													console.log("networks.forEach :", network);
													
													var net = docker.getNetwork(
														network.Id
													);
													// var newnet = docker.getNetwork(network.Id);
													console.log("Container ID (inside networks.forEach):", container);
													net.connect({ Container: container.id })
													.then(result => {
														console.log("connected...")
													})
													.catch(error => {
														console.log("There was an error connecting.", error);
													});
												}
											});
											workers[workerIndex] = {
												serverId: container.id,
												mongodbId: newSlaveId,
												networkId: network.id
											};
											console.log("worker created")
											return callback(null,
											workers[workerIndex]												
											);
										});
									}
								);
							} 
							
						).on("error",(err)=>{
						  console.log("createWorker error:");
						  
						  console.log(err);
						  return callback(err);
						})
					});
					
				}
			);
		}
	);
}

function replicateContainer(
	containerName,
	newImageName,
	newContainerName,
	callback
) {
	console.log("replicating")
	docker.listContainers((err, containers) => {
		if (err) {
			console.log("Failed to List Containers\n");
			console.log(err);
			return callback(err);
		}		
		containers.forEach((container) => {
			container.Names.forEach((name) => {
				if (name == "/" + containerName) {
					console.log(container.Id);
					var newContainer = docker.getContainer(container.Id);
					//console.log(c)
					newContainer.commit({ repo: newImageName },  (err, res) => {
						if (err) {
							console.log(err);
							return callback(err);
						}
						console.log("Commit Result",res);
						docker.run(
							newImageName,
							["/bin/bash"],
							undefined,
							{
								name: newContainerName,
								HostConfig: {
									Hostname: newContainerName,
									AutoRemove: true,
									NetworkMode: "rabbitmq_network",
								},
							},
							(err, data, container) => {
								if (err) {
									console.log(err);
									return callback(err);
								}
								console.log("Container Stopped...")
							}
						).on("container",(container)=>{
							console.log("Started new Container : ",container.id)
							// console.log(data)						
							return callback(null, container.id);
								
						}).on("error",(err)=>{
						  console.log("replicateContainer error:");
						  
						  console.log(err);
						  return callback(err);
						})
					});
				}
			});
		});
	});
}

function deleteWorker(workerIndex, callback) {
	console.log("Deleting Container...")
	var container = docker.getContainer(workers[workerIndex].serverId);//error here, serverId of undefined
	container.stop((err,data)=>{
	if (err) {
			console.log(err);
			return callback(err);
		}
	container.remove((err, data) => {
		if (err) {
			console.log(err);
			return callback(err);
		}
		console.log("worker container Deleted successfully");
		container = docker.getContainer(workers[workerIndex].mongodbId);
		var mongoImage = docker.getImage();
		container.stop( (err,data) =>{
			if (err) {
					return callback(err);
				}
			container.remove((err, data) => {
				if (err) {
					return callback(err);
				}
				console.log("mongodb container Deleted successfully");
				image.remove((err) => {
					if (err) {
						console.log("Failed to remove image");
						return;
					}
					return;
				});
				var network = docker.getNetwork(workers[workerIndex].networkId);
				network.remove((err, data) => {
					if (err) {
						return callback(err);
					}
					console.log(data);
					console.log("Slave Deleted successfully");
					delete workers[workerIndex];
					workerCount[workerIndex - 1] = 0;
					return callback(null, data);
				});
			});
		})
	});
	})
}

exports.updateRequests = (req, res, next) => {
	//console.log(req)
	reqRate = reqRate + 1;
	console.log("Request Count : "+ reqRate)
	return next()
};

async function updateWorkers() {
	// var newWorkers = Math.floor(reqRate / 20);
	var newWorkers= reqRate
	reqRate = 0;
	console.log("Scale Up needed : " + newWorkers);

	if (newWorkers > workerCount.length) {
		var diff = newWorkers - workerCount.length;
		console.log("Creating workers..")
		while (diff) {	
			console.log("Diff : ",diff)		
			await createWorker((err, retVal) => {
				if (err) {
					console.log(err);
					process.exit(0);
				}
				console.log(retVal)
				return;
			})
			diff = diff - 1;
			 
		}
		console.log("Scale Up succeeded")
		return
	} else if (newWorkers < workerCount.length) {
		var diff = workerCount.length - newWorkers;
		console.log("deleting workers..")
		while (diff) {
			console.log("Diff : ",diff)
			await deleteWorker(diff, (err, retVal) => {
				console.log(err);
				process.exit(0);
			});
			diff = diff - 1;
		}
		console.log("Scale down succeeded")
		return
	}
	
}

exports.crashMaster = (req, res, next) => {
	if (workers["master"] == undefined) res.status(404).send();

	for (var key in workers) {
		if (workers[key].serverId == workers["master"]["serverId"]) {
			deleteWorker(key, (err, data) => {
				if (err) {
					console.log(err);
					res.status(500).send({})
				}
				res.status(200).send({});
			})
		}
	}

	zookeeper.getChildren('/election', function (error, children, stats) {
		if (error) {
			console.log(error.stack);
			return;
		}
		let electionNodes = children.sort();
		let leader = electionNodes[0];
		console.log('Children are: %j.', children);

		zookeeper.getData(
			'/election/' + leader,
			function (error, data, stat) {
				if (error) {
					console.log(error.stack);
					return;
				}
				console.log('Got data: %s', data.toString('utf8'));
				CID = data.toString('utf8')
				workers["master"]["serverId"] = CID

				docker.getContainer(CID).inspect((err, data) => {
					docker.getContainer(data["NetworkSettings"]["Networks"]["bridge"]["NetworkID"]).inspect((err_1, data_1) => {
						data_1["Containers"].forEach((containerID) => {
							if (containerID != CID) {
								workers["master"]["dbId"] = containerID
							}
						})
					})

				})
			}
		);

	});

	createWorker(() => {
		console.log("Worker Created.");
	})

	// docker.getContainer(workers["master"]["serverId"]).stop();
	// docker.getContainer(workers["master"]["dbId"]).stop();
	res.status(200).send({});

	return;
};

exports.crashSlave = (req, res, next) => {

	let maxPID = Number;
	let CID = String;

	docker.listContainers((err, containers) => {
		if (err) return res.status(500).send(err)
		containers.forEach((containerInfo) => {
			docker.getContainer(containerInfo).inspect((err, data) => {
				console.log(data["State"]["Pid"]);
				if (data["Name"] == "/dbworker_slave" && data["State"]["Pid"] > maxPID) {
					maxPID = data["State"]["Pid"]
					CID = containerInfo.Id
				}
			})
		})
		for (var key in workers) {
			if (workers[key].serverId == CID) {
				deleteWorker(key, (err, data) => {
					if (err) {
						console.log(err);
						res.status(500).send({})
					}
					res.status(200).send({});
				})
			}
		}		
	});
	return;
};

exports.workerList = (req, res, next) => {
	docker.listContainers((err, containers) => {
		if (err) {
			return res.status(500).send(err);
		}
		let IDs = [];
		containers.forEach((containerInfo) => {
			container = docker.getContainer(containerInfo.Id)
			container.inspect((err, data) => {
				console.log(data["State"]["Pid"]);
				// if (data["Name"].startsWith("/dbworker"))
				IDs.push(data["State"]["Pid"]);
			});
			console.log("in", IDs);
		});
		console.log("out", IDs);
		res.status(200).send(IDs.sort());
	});

	return;
};

initialiseWorkers();
setInterval(updateWorkers, 1000 * 120);
setInterval(updateWorkers, 1000 * 30);
