const path = require('path')
const fs = require('fs')
const mongoClient = require("mongodb").MongoClient;
const url = require('../models/db.js').url
const request = require('request-promise')


exports.home = (req, res, next) => {
	res.send("Hello Team 2020!")
}

// 3. Create a new ride

exports.createRide = (req, res, next) => {
	let createdBy = req.body.created_by
	let timestamp = req.body.timestamp
	let source = req.body.source
	let destination = req.body.destination

	console.log("\n--------------------\nAPI 3:", createdBy, timestamp, source, destination)


			const options = {
				method: 'POST',
				uri: 'http://localhost/api/v1/db/write',
				body: {},
				json: true
			}

			options['body'] = {
				table: 'rides',
				owner: createdBy,
				timestamp: timestamp,
				source: source,
				destination: destination
			}

				request(options)
				.then(response => {
					return res.status(201).send({})
				})
				.catch(err => res.status(500).send(err))
}


// 4. List all upcoming rides on a given route

exports.listRides = (req, res, next) => {
	let source = req.query.source
	let destination = req.query.destination

	console.log("\n--------------------\nAPI 4:", source, destination);

	if (
		!source ||
		!destination ||
		source.replace(/\s/g, '') === "" ||
		destination.replace(/\s/g, '') === ""
	) return res.status(204).send()


	let enumTest = /^(0|[1-9]\d*)$/
	if (!enumTest.test(source) || !enumTest.test(destination)) return res.status(400).send()

	const options = {
		method: 'POST',
		uri: 'http://localhost/api/v1/db/read',
		body: {},
		json: true
	}

	options['body'] = {
		table: '`locations`',
		where: {"locationid":source}
	}

	request(options)
		.then(response => {
			if (response.length === 0) return res.status(400).send("400: Invalid Source")

			const options = {
				method: 'POST',
				uri: 'http://localhost/api/v1/db/read',
				body: {},
				json: true
			}

			options['body'] = {
				table: '`locations`',
				where: {"locationid": destination}
			}

			request(options)
				.then(response => {
					if (response.length === 0) return res.status(400).send("400: Invalid Destination")

					const options = {
						method: 'POST',
						uri: 'http://localhost/api/v1/db/read',
						body: {},
						json: true
					}

					options['body'] = {
						table: '`rides`',
						where: {"source":source ,"destination": destination }
					}
					request(options)
						.then(response => {
							var newResponse = new Array()
							if (response.length == 0) return res.status(204).send([])
							response.forEach(element => {
								newResponse.push({
									"rideId": element.rideid,
									"Created_by": element.owner,
									"users":element.users,
									"timestamp": element.time
								})
							});
							return res.status(200).send(newResponse)
						})
						.catch(err => res.status(500).send(err))
				})
				.catch(err => res.status(500).send(err))
		})
		.catch(err => res.status(500).send(err))
}


// 5. List details of a given ride

exports.getRide = (req, res, next) => {
	let rideId = req.params.rideId

	console.log("\n--------------------\nAPI 5:", rideId)

	if (rideId.replace(/\s/g, '') === "") return res.status(204).send()

	const options = {
		method: 'POST',
		uri: 'http://localhost/api/v1/db/read',
		body: {},
		json: true
	}

	options['body'] = {
		table: '`rides`',
		where: {"rideid":rideId}
	}

	request(options)
		.then(response => {
			if (response.length === 0) return res.status(404).send("404: Ride ID Not Found")

			const options = {
				method: 'POST',
				uri: 'http://localhost/api/v1/db/read',
				body: {},
				json: true
			}

			options['body'] = {
				table: '`rides`',
				where: {"rideid":rideId}
			}

			request(options)
				.then(nextResponse => {
					console.log(response)
					let users = new Array()
					//nextResponse.forEach(element => { users.push(element.userid) })
					users = nextResponse[0].users;
					return res.status(200).send({
						"rideId": response[0].rideid,
						"Created_by": response[0].username,
						"users": users,
						"timestamp": response[0].time,
						"source": response[0].source,
						"destination": response[0].destination
					})
				})
				.catch(err => res.status(500).send(err))
		})
		.catch(err => res.status(500).send(err))
}


// 6. Join an existing ride

exports.joinRide = (req, res, next) => {
	let rideId = req.params.rideId
	let username = req.body.username

	console.log("6", rideId, username);

	if (rideId.replace(/\s/g, '') === "" || username.replace(/\s/g, '') === "") {
		return res.status(204);
	}
	
	const options = {
		method: 'POST',
		uri: 'http://localhost/api/v1/db/read',
		body: {},
		json: true // JSON stringifies the body automatically
	}

	options['body'] = {
		table: '`rides`',
		where: {"rideid":rideId}
	}
	
	request(options)
		.then(response => {
			if (response.length === 0) return res.status(404).send("404: Ride ID Not Found")

			options['uri'] = 'http://localhost/api/v1/db/write';
			options['body'] = {}; // remove this if not necessary.
			options['body'] = { update:1 ,table: 'rides',username: username, rideid: rideId };
			request(options)
				.then(function (response) {
					console.log("Join Ride Success...")
					return res.status(200).send({});
				})
				.catch(function (err) {
					return res.status(400);
				});
			})
	.catch(err => res.status(500).send(err))
}


// 7. Delete a ride

exports.deleteRide = (req, res, next) => {
	let rideId = req.params.rideId

	console.log("6", rideId);

	if (rideId.replace(/\s/g, '') === "") {
		return res.status(204);
	}

	let db_req = { "table": "rides", "where": "rideid=" + rideId };
	const options = {
		method: 'POST',
		uri: 'http://localhost/api/v1/db/read',
		body: db_req,
		json: true

	}
	request(options)
		.then((response) => {
			if (response.length == 0) {
				console.error("Ride Not Found..")
				return res.status(400).send({})
			}
			let db_req = { "table": "rides", "where": {"rideid":rideId}};
			const options = {
				method: 'DELETE',
				uri: 'http://localhost/api/v1/db/write',
				body: db_req,
				json: true
			}
			request(options)
				.then((response) => {
					return res.status(200).send({});
				})
				.catch(err => res.status(500).send(err))
		})
		.catch(err => res.status(500).send(err))
}


// 8. Write data to the DB

exports.writeDb = (req, res, next) => {

	if (req.method === 'POST') {
		console.log("Recieved DB write POST request..");
		if (req.body.table === 'users') {
			mongoClient.connect(url, function(err, db) {  
				if(err){
					console.error(err.message)
					return res.status(400).send(err)
				} 
				console.log("Connected to DB..");
				var user = { 
								"username": req.body.username,
								"password": req.body.password 
							}; 
				db.collection(req.body.table).insertOne(user, function(err, res) {  
					if(err){
						console.error(err.message)
						return res.status(400).send(err)
					}  
					console.log("Record inserted");  
					db.close();  
					return res.status(200).send();
				});  
			});
		}

		else if (req.body.table === 'rides') {

			if(req.body.update){
				mongoClient.connect(url, function(err, db) {  
					if(err){
						console.error(err.message)
						return res.status(400).send(err)
					}  
					console.log("Connected to DB..");
					var query = { "rideid": req.body.rideid };
					var newuser = { $push: {"users": req.body.username } };
					db.collection(req.body.table).updateOne(query, newuser, function(err, res) {  
						if(err){
							console.error(err.message)
							return res.status(400).send(err)
						}  
						console.log("Record updated...");  
					db.close();  
					return res.status(200).send(); 
					});  
				});
			}
			else{
				mongoClient.connect(url, function(err, db) {  
					if(err){
						console.error(err.message)
						return res.status(400).send(err)
					}  
					console.log("Connected to DB...");
					var ride = {
									"owner": req.body.owner,
									"source": req.body.source,
									"destination":req.body.destination,
									"timestamp":req.body.timestamp
								}; 
					db.collection(req.body.table).insertOne(ride, function(err, res) {  
						if(err){
							console.error(err.message)
							return res.status(400).send(err)
						}  
						console.log("Record inserted");  
					db.close();  
					return res.status(200).send(); 
					});  
				});
			}
		}

		else {
			res.status(400).send('Table Not Supported')
		}
	}

	else if (req.method === 'DELETE') {
		console.log("Recieved DB write DELETE request..");
		
		MongoClient.connect(url, function(err, db) {  
			if(err){
				console.error(err.message)
				return res.status(400).send(err)
			}  
			var qry = req.body.where;  
			db.collection(req.body.table).deleteOne(qry, function(err, obj) {  
				if(err){
					console.error(err.message)
					return res.status(400).send(err)
				} 
				console.log(obj.result.n + " record(s) deleted");  
				db.close();  
			});  
		});
		
	}
}


// 9. Read data from the DB

exports.readDb = (req, res, next) => {
	MongoClient.connect(url, function(err, db) {  
		if (err) throw err;  
		var qry = req.body.where;   
		db.collection(req.body.table).find(qry).toArray(function(err, db_out) {   
			if(err){
				console.error(err.message)
				return res.status(400).send(err)
			} 
			console.log("Read Successful...");  
			db.close();  
			return res.status(200).send(db_out);
		});  
	});
}

// 10. Clear DB
exports.clearDb = (req, res, next) => {
	console.log("DB clear...")
	var tables = ['rides']
	
	tables.forEach(table => {
		MongoClient.connect(url, function(err, db) {  
			if(err){
				console.error(err.message)
				return res.status(400).send(err)
			}  
			var qry = {};  
			db.collection(table).deleteMany(qry, function(err, obj) {  
				if(err){
					console.error(err.message)
					return res.status(400).send(err)
				} 
				console.log(obj.result.n + " record(s) deleted");  
				db.close();  
			});  
		});
	});
	res.status(200).send();
}
