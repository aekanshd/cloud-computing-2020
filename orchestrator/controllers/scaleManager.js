Docker = require("dockerode")
//tar = require("tar-fs")
path = require("path")
let docker = new Docker();
const request = require('request-promise')
var reqRate = 0
var workerCount = []
var workers = {}

function initialiseWorkers() {
	docker.listContainers((err, containers) => {
		if(err) {
			console.log("Failed to List Containers\n")
			console.log(err)
			return
		}
		containers.forEach((container)=>{
			container.Names.forEach((name)=>{
				if (name == "/dbworker_master") {
					if (!workers["master"]) {
						workers["master"] = {}
					}
					workers["master"]["serverId"] = container.Id 
				}
				else if (name == "/dbworker_slave") {
					if (!workers["slave"]) {
						workers["slave"] = {}
					}
					workers["slave"]["serverId"] = container.Id 
				}
				else if (name == "/mongodb_master") {
					if (!workers["master"]) {
						workers["master"] = {}
					}
					workers["master"]["dbId"] = container.Id 
				}
				else if (name == "/mongodb_slave") {
					if (!workers["slave"]) {
						workers["slave"] = {}
					}
					workers["slave"]["dbId"] = container.Id 
				}	
			})
		})
	})
	docker.listNetworks((err, netwoks) => {
		if(err) {
			console.log("Failed to List Networkss\n")
			console.log(err)
			return
		}
		networks.forEach((network)=>{
			if (network.Name == "master_network") {
				workers["master"]["networkId"] = network.Id
			}
			else if (network.Name == "slave_network") {
				workers["slave"]["networkId"] = network.Id
			}
		})
	})	
}

function getNextIndex() {
	var i=1;
	while(i<=workerCount.length) {
		if (i!=workerCount[i-1]) {
			workerCount[i-1] = i
			break
		}
		i+=1
	}
	if (i == workerCount.length+1) {
		workerCount.push(i)
	}
	return i
}
function createWorker(callback) {
	workerIndex = getNextIndex()		
	replicateContainer("mongodb_master","mongodb_clone_"+workerIndex,"mongodb_slave_"+workerIndex,(err,newSlaveId) => {
		if (err){
			console.log(err)
			return callback(err)
		}
		
		docker.createNetwork({
			"Name": "slave_network_"+workerIndex,
			"Driver": "bridge"
		}, (err, network) => {
			if(err){
				console.log(err)
				return callback(err)
			}
			console.log(network)
			console.log("Network Created\n")
			network.connect({Container: newSlaveId}, (err, data)=>{
				if(err) {
					console.log("Failed to attach mongodb to slave network...")
					console.log(err)
					return callback(err)
				}
				docker.run("dbworker_slave",[],undefined,{name: "dbworker_slave_"+workerIndex, Env: ["ROLE=slave"], 
				HostConfig: { AutoRemove: true, NetworkMode: 'rabbitmq_network'}}
				,(err,data,container) => {
					if(err) {
						console.log(err)
						return callback(err)
					}
					network.connect({Container: container.id}, (err, data)=>{
						if(err) {
							console.log("Failed to attach slave to slave network...")
							console.log(err)
							return callback(err)
						}
						workers[workerIndex] = {
							"serverId": container.id,
							"mongodbId": newSlaveId,
							"networkId": network.id
						}
						return (null,"New worker created successfully...")					
				})	
			})
		})
		
	})
		
})
}


function replicateContainer(containerName,newImageName,newContainerName,callback) {		
	docker.listContainers((err, containers) => {
		if(err) {
			console.log("Failed to List Containers\n")
			console.log(err)
			return callback(err)
		}
		containers.forEach( (container) => {
			container.Names.forEach((name)=>{
				if (name == "/"+containerName) {
					console.log(container.Id)
					var newContainer = docker.getContainer(container.Id)
					//console.log(c)
					newContainer.commit({repo:newImageName},(err,res)=>{
						if(err) {
							console.log(err)
							return callback(err)
						}
						console.log(res)
						docker.run(newImageName,[],undefined,{ name: newContainerName, 
						HostConfig: {Hostname: "mongodb", AutoRemove: true, NetworkMode: 'rabbitmq_network'}}
							,(err,data,container) => {
								if(err) {
								console.log(err)
								return callback(err)
							}
							console.log(data)
							return callback(null,container.id)
							
						})
					
					})
				}
			})
		})
	})
}

function deleteWorker(workerIndex,callback) {
	var container = docker.getContainer(workers[workerIndex].serverId)
	container.stop()	
	container.remove((err, data) => {
		if(err) {
			console.log(err)
			return callback(err)
		}
		console.log ("worker container Deleted successfully")
		container = docker.getContainer(workers[workerIndex].mongodbId)
		var mongoImage = docker.getImage()
		container.stop()
		container.remove((err, data) => {
			if(err) {
				return callback(err)
			}
			console.log ("mongodb container Deleted successfully")
			image.remove((err)=>{
				if (err) {
					console.log("Failed to remove image")
					return
				}
				return
			})
			var network = docker.getNetwork(workers[workerIndex].networkId)
			network.remove((err, data) => {
				if(err) {
					return callback(err)
				}
  				console.log(data)
  				console.log ("Slave Deleted successfully")
  				delete workers[workerIndex]
  				workerCount[workerIndex-1] = 0
				return callback(null,data)
  			})
		});
	});

}

exports.updateRequests = (req,res,next) => {
	reqRate = reqRate + 1
	next()
}

function updateWorkers() {
	
	var newWorkers = Math.floor(reqRate/20)
	reqRate = 0
	console.log("Scale Up needed : "+newWorkers)
			
	if (newWorkers > workerCount.length) {
		diff = newWorkers - workerCount.length
		while (diff) {
			createWorker((err,retVal)=>{
				if(err){
					console.log(err)
					process.exit(0)
				}
				return
			});
			diff = diff - 1
		}
	} else {
		diff = workerCount.length - newWorkers
		while (diff) {
			deleteWorker(diff,(err,retVal)=>{
				console.log(err)
				process.exit(0)
			});
			diff = diff - 1
		}
	}	
}

initialiseWorkers()
setInterval(updateWorkers,1000*120)

