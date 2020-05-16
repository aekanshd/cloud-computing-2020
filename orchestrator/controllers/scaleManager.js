var Docker = require('dockerode');
// tar = require("tar-fs")
// const path = require('path');
const docker = new Docker();
// const request = require('request-promise');
var reqRate = 0;
var workerCount = [];
var workers = {};
var zookeeper = require('node-zookeeper-client');
// var PID = {};

process.on('unhandledRejection', error => {
	console.log('unhandledRejection', error);
});

function initialiseWorkers () {
	docker.listContainers(async (err, containers) => {
		if (err) console.error(err);
		await containers.forEach((container) => {
			container.Names.forEach((name) => {
				console.log(name);
				if (name === '/dbworker_master') {
					if (workers.master === undefined) {
						workers.master = {};
					}
					workers.master.serverId = container.Id;

					console.log('master set : ', container.Id);
				} else if (name === '/dbworker_slave') {
					if (workers[0] === undefined) {
						workers[0] = {};
						workerCount[0] = 0;
					}
					workers[0].serverId = container.Id;
					console.log('slave set : ', container.Id);
				} else if (name === '/mongodb_master') {
					if (workers.master === undefined) {
						workers.master = {};
					}
					workers.master.mongodbId = container.Id;
					console.log('mongodb_master : ', container.Id);
				} else if (name === '/mongodb_slave') {
					if (workers[0] === undefined) {
						workers[0] = {};
						workerCount[0] = 0;
					}
					workers[0].mongodbId = container.Id;
					console.log('mongodb_slave : ', container.Id);
				}
			});
		});
		await docker.listNetworks((err, networks) => {
			if (err) {
				console.log('Failed to List Networkss\n');
				console.log('53:', err);
				return;
			}
			networks.forEach((network) => {
				if (network.Name === 'master_network') {
					workers.master.networkId = network.Id;
					console.log('master Network: ', network.Id);
				} else if (network.Name === 'slave_network') {
					workers[0].networkId = network.Id;
					console.log('slave Network: ', network.Id);
				}
			});
		});
	});
}

function getNextIndex () {
	var i = 0;
	while (i < workerCount.length) {
		if (i !== workerCount[i]) {
			workerCount[i] = i;
			break;
		}
		i += 1;
	}
	if (i === workerCount.length) {
		workerCount.push(i);
	}
	return i;
}

function liveWorkersCount () {
	let i = 0;
	let count = 0;
	while (i < workerCount.length) {
		if (workerCount[i] !== -1) {
			count += 1;
		}
		i += 1;
	}
	return count;
}

async function createWorker (callback) {
	var workerIndex = await getNextIndex();
	console.log('Worker Index : ', workerIndex);
	await replicateContainer(
		'mongodb_master',
		'mongodb_slave_' + workerIndex,
		'mongodb_slave_' + workerIndex,
		(err, newSlaveId) => {
			if (err) {
				console.log('92', err);
				return;
				// callback(err); // Unreachable Code.
			}

			console.log('Replicated mongo Successfully');

			docker.createNetwork(
				{
					Name: 'slave_network_' + workerIndex,
					Driver: 'bridge',
				},
				(err, network) => {
					if (err) {
						console.log('104', err);
						return;
						// callback(err); // Unreachable Code.
					}

					console.log('Network Created\n');
					network.connect({ Container: newSlaveId }, (err, data) => {
						if (err) {
							console.log(
								'Failed to attach mongodb to slave network...'
							);
							console.log(err);
							return;
							// callback(err); // Unreachable Code.
						}
						console.log('Connected Mongo to network : ', 'slave_network_' + workerIndex);
						docker.run(
							'dbworker_slave:latest',
							['./start.sh'],
							undefined,
							{
								name: 'dbworker_slave_' + workerIndex,
								Env: ['ROLE=slave', 'DB_HOST=mongodb_slave_' + workerIndex],
								HostConfig: { AutoRemove: true, NetworkMode: 'rabbitmq_network' },
							},
							(err, data, container) => {
								if (err) {
									console.log('network.connect Error:\n', err);
									return callback(err);
								}
								console.log(data.StatusCode);
								console.log('Container Stopped....');
							}).on('container', (container) => {
							console.log('Container up...');
							console.log('Container up with ID: ', container.id);

							network.connect(
								{ Container: container.id },
								(err, data) => {
									if (err) {
										console.log(
											'Failed to attach slave to slave network...'
										);
										console.log(err);
										return;
										// callback(err); // Unreachable Code.
									}
									console.log('Connected dbworker to slave network');
									docker.listNetworks((err, networks) => {
										if (err) {
											console.log(
												'failed to list networks'
											);
											return;
											// callback(err); // Unreachable Code.
										}
										networks.forEach((network) => {
											if (
												network.Name ===
													'zookeeper_network'
											) {
												console.log('networks.forEach :', network);

												var net = docker.getNetwork(

													network.Id
												);
													// var newnet = docker.getNetwork(network.Id);
												console.log('Container ID (inside networks.forEach):', container);
												net.connect({ Container: container.id })
													.then(result => {
														console.log('connected...');
													})
													.catch(error => {
														console.log('There was an error connecting.', error);
													});
											}
										});
										workers[workerIndex] = {
											serverId: container.id,
											mongodbId: newSlaveId,
											networkId: network.id
										};
										console.log('worker created');

										/* return callback(null,
											workers[workerIndex]
											); */
									});
								}
							);
						}

						).on('error', (err) => {
							console.log('createWorker error:');
							console.log(err);
							// return callback(err);
						});
					});
				}
			);
		}
	);
}

function replicateContainer (
	containerName,
	newImageName,
	newContainerName,
	callback
) {
	console.log('replicating');
	docker.listContainers((err, containers) => {
		if (err) {
			console.log('Failed to List Containers\n');
			console.log(err);
			return callback(err);
		}
		containers.forEach((container) => {
			container.Names.forEach((name) => {
				if (name === '/' + containerName) {
					console.log(container.Id);
					var newContainer = docker.getContainer(container.Id);
					// console.log(c)
					newContainer.commit({ repo: newImageName }, (err, res) => {
						if (err) {
							console.log('221', err);
							return callback(err);
						}
						console.log('Commit Result', res);
						docker.run(
							newImageName,
							['/bin/bash'],
							undefined,
							{
								name: newContainerName,
								HostConfig: {
									Hostname: newContainerName,
									AutoRemove: true,
									NetworkMode: 'rabbitmq_network',
								},
							},
							(err, data, container) => {
								if (err) {
									console.log('239', err);
									return callback(err);
								}
								console.log('Container Stopped...');
							}
						).on('container', (container) => {
							console.log('Started new Container : ', container.id);

							// console.log(data)
							return callback(null, container.id);
						}).on('error', (err) => {
							console.log('replicateContainer error:');
							console.log(err);
							return callback(err);
						});
					});
				}
			});
		});
	});
}

function deleteWorker (workerIndex, callback) {
	console.log('Deleting Container...');
	var container = docker.getContainer(workers[workerIndex].serverId);// error here, serverId of undefined
	console.log('Container to be deleted : ', container.modem.host);

	container.stop((err, data) => {
		if (err) {
			console.log('265', err);
			return;
			// callback(err); // Unreachable Code.
		}
		/*
		container.remove((err, data) => {
		if (err) {
			console.log("271",err);
			return
			callback(err);
		} */
		console.log('worker container Deleted successfully');
		console.log('mongodb ID to be deleted:', workers[workerIndex].mongodbId);
		container = docker.getContainer(workers[workerIndex].mongodbId);
		var mongoImage = docker.getImage('mongodb_slave_' + workerIndex);
		container.stop((err, data) => {
			if (err) {
				console.log('280', err);
				return;
				// callback(err); // Unreachable Code.
			}
			/* container.remove((err, data) => {
				if (err) {
					console.log("286",err)
					return
					callback(err);
				} */
			console.log('mongodb container Deleted successfully');
			// console.log("Image to be deleted: ",mongoImage)
			mongoImage.remove({ force: true }, (err, data) => {
				if (err) {
					console.log('Failed to remove image:', err);
				}
			});
			console.log('Deleted Mongo Image');
			var network = docker.getNetwork(workers[workerIndex].networkId);
			console.log('Network to be deleted: ', network);
			network.remove((err, data) => {
				if (err) {
					console.log('301', err);
					return;
					// callback(err); // Unreachable Code.
				}
				console.log(data);
				console.log('Slave Deleted successfully');
				delete workers[workerIndex];
				workerCount[workerIndex] = -1;
				console.log(workers, workerCount);
				// callback(null, data);
			});
			// });
		});
		return '200';
	// });
	});
}

exports.updateRequests = (req, res, next) => {
	// console.log(req)
	reqRate = reqRate + 1;
	console.log('Request Count : ' + reqRate);
	return next();
};

async function updateWorkers () {
	var newWorkers = Math.floor(reqRate / 20);

	// var newWorkers = reqRate
	if (reqRate === 0) {
		newWorkers = 1;
	}
	reqRate = 0;
	console.log('Required Slaves : ' + newWorkers);
	var count = liveWorkersCount();
	console.log('Current slaves count :', count);
	if (newWorkers > count) {
		let diff = newWorkers - count;
		console.log('Creating workers..');
		while (diff) {
			console.log('Diff : ', diff);
			await createWorker((err, data) => {
				if (err) {
					throw err;
					// return;
				}
				console.log(data);
			});
			diff = diff - 1;
			console.log('Diff (line 330): ', diff);
		}
		console.log('Scale Up succeeded');
	} else if (newWorkers < count) {
		let diff = count - newWorkers;
		console.log('deleting workers..');
		while (diff) {
			console.log('Diff : ', diff);
			await deleteWorker(diff, (err, data) => {
				if (err) {
					throw err;
				}
			});
			diff = diff - 1;
		}
		console.log('Scale down succeeded');
	}
}

exports.crashMaster = (req, res, next) => {
	console.log('Crash master API');
	if (workers.master === undefined) res.status(404).send();
	for (var key in workers) {
		if (workers[key].serverId === workers.master.serverId) {
			deleteWorker(key, (err, data) => {
				if (err) {
					console.log('364', err);
					res.status(500).send({});
				}
				res.status(200).send({});
			});
		}
	}

	zookeeper.getChildren('/election', function (error, children, stats) {
		if (error) {
			console.log('374', error);
			return;
		}
		const electionNodes = children.sort();
		const leader = electionNodes[0];
		console.log('Children are: %j.', children);

		zookeeper.getData(
			'/election/' + leader,
			function (error, data, stat) {
				if (error) {
					console.log('385', error);
					return;
				}
				console.log('Got data: %s', data.toString('utf8'));
				const CID = data.toString('utf8');
				workers.master.serverId = CID;

				docker.getContainer(CID).inspect((err, data) => {
					if (err) console.error(err);
					docker.getContainer(data.NetworkSettings.Networks.bridge.NetworkID).inspect((err_1, data_1) => {
						data_1.Containers.forEach((containerID) => {
							if (containerID !== CID) {
								workers.master.mongodbId = containerID;
							}
						});
					});
				});
			}
		);
	});

	createWorker((err, data) => {
		if (err) console.error(err);
		console.log('Worker Created.');
	});

	// docker.getContainer(workers["master"]["serverId"]).stop();
	// docker.getContainer(workers["master"]["mongodbId"]).stop();
	res.status(200).send({});
};

exports.crashSlave = (req, res, next) => {
	let maxPID = -1;
	let CID = 'String';
	console.log('Crash API');
	docker.listContainers((err, containers) => {
		if (err) return res.status(500).send(err);
		console.log('Before for each..');
		containers.forEach((containerInfo) => {
			docker.getContainer(containerInfo.Id).inspect((err, data) => {
				console.log('Docker Insepect');
				if (err) { console.error(err); return res.status(500).send({}); }

				console.log(data.State.Pid);
				if (data.Name === '/dbworker_slave' && data.State.Pid > maxPID) {
					maxPID = data.State.Pid;
					CID = containerInfo.Id;
					console.log('max:', maxPID);
				}
			});
		});
		console.log('End of Foreach');
		setTimeout(() => {
			console.log('Inside Delete Logic');
			for (var key in workers) {
				if (workers[key].serverId === CID) {
					console.log('Preparing to delete worker with containerID', CID);
					deleteWorker(key, (err, data) => {
						if (err) {
							console.log(err);
							res.status(200).send({});
						}
						console.log('Delete Success..');
						res.status(200).send({});
					});
					console.log('Delete Success..');
					res.status(200).send({});
				}
			}
		}, 1000);
	});
};

exports.workerList = async (req, res, next) => {
	docker.listContainers((err, containers) => {
		if (err) {
			return res.status(500).send(err);
		}
		const IDs = [];
		containers.forEach((containerInfo) => {
			docker.getContainer(containerInfo.Id).inspect((err, data) => {
				if (err) console.error(err);
				if (data.Name.startsWith('/dbworker')) {
					console.log('Adding PID:', data.State.Pid);
					IDs.push(data.State.Pid);
				}
			});
			console.log('in', IDs);
		});
		console.log('out', IDs);
		setTimeout(() => {
			console.log('IDs are:', IDs.sort());
			res.status(200).send(IDs.sort());
		}, 1000);
	});
};

initialiseWorkers();

setInterval(updateWorkers, 1000 * 120);
// setInterval(updateWorkers, 1000 * 60);
