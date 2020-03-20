//Rideshare Users
const path = require('path')
const fs = require('fs')
const dbConfig = require("../config/db.config.js");
const mongoClient = require("mongodb").MongoClient;
const url = require('../models/db.js').url
const request = require('request-promise')
uri_base = "http://localhost:8000/api/v1/"


exports.home = (req, res, next) => {
	res.send("Welcome!")
}

// 1. Creates a User

exports.createUser = (req, res, next) => {
	
	let username = req.body.username
	let password = req.body.password.toUpperCase()
	console.log("Request for create user : ",username)
	let hexadecimals = /^[0-9A-F]{40}$/

	let db_req = { "table": "users", "where": {"username": username}};
	const options = { method: 'POST', uri: uri_base+'db/read', body: db_req, json: true }
	request(options)
		.then((results) => {
			//IF the user is not present, add the user to the database
			if (results.length == 0) {
				if (hexadecimals.test(password)) {

					let db_req = { "table": "users", "username": username, "password": password };
					const options = { method: 'POST', uri: uri_base+'db/write', body: db_req, json: true }
					console.log("Creating new user : ",username)
					request(options)
						.then((reponse) => {

							console.log(username, password)
							return res.status(201).send({});
						})
						.catch(err => res.status(500).send(err))
				}
				else {
					console.error("Invalid Password (HEX Decode Error)")
					return res.status(400).send({});
				}

			}
			else {
				console.error("Username already exists..")
				return res.status(409).send({});
			}
		})
		.catch((err) => {
		 	console.log("Error : ",err)
		 	res.status(500).send(err)
		 	
		 })
}


// 2. Delete a User

exports.deleteUser = (req, res, next) => {
	let username = req.params.username
	let db_req = { "table": "users", "where": {"username":username} };
	const options = { method: 'POST', uri: uri_base+'db/read', body: db_req, json: true }
	request(options)
		.then((result) => {
			// IF the user is not present, return an error message
			if (result.length == 0) {
				console.error("User Not Found..")
				return res.status(400).send({})
			}
			console.log("User Exists");
			//user_id = result[0]._id
			//if the user is present, delete from the database
			let db_req = { "table": "users", "where": {"username":username}};
			const options = { method: 'DELETE', uri: uri_base+'db/write', body: db_req, json: true }
			request(options)
				.then(response => {
					return res.status(200).send({})
				})
				.catch(err => res.status(500).send(err))
		})
		.catch(err => res.status(500).send(err))
}

//	10. List All Users

exports.listUsers = (req,res,next) => {
	const options = {
		method: 'POST',
		uri: uri_base+'db/read',
		body: {},
		json: true
	}
	options['body'] = {
		table: 'users',
		where: {}
	}
	request(options)
		.then(response => {
			if (response.length === 0) return res.status(204).send([])
			var newResponse = new Array()
			response.forEach(element => {
				newResponse.push(element.username)
			});
			return res.status(200).send(newResponse)

	})
	.catch(err => res.status(500).send(err))

}



// 8. Write data to the DB

exports.writeDb = (req, res, next) => {
	console.log("DB api");
	if (req.method === 'POST') {
		console.log("Recieved DB write POST request..");
		if (req.body.table === 'users') {
			mongoClient.connect(url, function(err, db) {  
				dbo=db.db(dbConfig.DB)
				if(err){
					console.error(err.message)
					return res.status(400).send(err)
				} 
				console.log("Connected to DB..");
				var user = { 
								"username": req.body.username,
								"password": req.body.password 
							}; 
				dbo.collection(req.body.table).insertOne(user, function(err, db_out) {  
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
					dbo=db.db(dbConfig.DB)
					if(err){
						console.error(err.message)
						return res.status(400).send(err)
					}  
					console.log("Connected to DB..");
					var query = { "rideid": req.body.rideid };
					var newuser = { $push: {"users": req.body.username } };
					dbo.collection(req.body.table).updateOne(query, newuser, function(err, db_out) {  
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
					dbo=db.db(dbConfig.DB)
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
					dbo.collection(req.body.table).insertOne(ride, function(err, db_out) {  
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
		
		mongoClient.connect(url, function(err, db) {  
			dbo=db.db(dbConfig.DB)
			if(err){
				console.error(err.message)
				return res.status(400).send(err)
			}  
			var qry = req.body.where;  
			dbo.collection(req.body.table).deleteOne(qry, function(err, obj) {  
				if(err){
					console.error(err.message)
					return res.status(400).send(err)
				} 
				console.log(obj.result.n + " record(s) deleted");  
				db.close(); 
				return res.status(200).send(); 
			});  
		});
		
	}
}


// 9. Read data from the DB

exports.readDb = (req, res, next) => {
	console.log("Reading Database..")
	mongoClient.connect(url, function(err, db) {  
		if(err){
				console.error(err.message)
				return res.status(400).send(err)
			}  
		dbo=db.db(dbConfig.DB)
		var qry = req.body.where;   
		dbo.collection(req.body.table).find(qry).toArray(function(err, db_out) {   
			if(err){
				console.error(err.message)
				return res.status(400).send(err)
			} 
			console.log("Read Successful...\n",db_out);  
			db.close();  
			return res.status(200).send(db_out);
		});  
	});
}

// 10. Clear DB
exports.clearDb = (req, res, next) => {
	console.log("DB clear...")
	var tables = ['users']
	
	tables.forEach(table => {
		mongoClient.connect(url, function(err, db) {  
			if(err){
				console.error(err.message)
				return res.status(400).send(err)
			}  
			dbo=db.db(dbConfig.DB)
			var qry = {};  
			dbo.collection(table).deleteMany(qry, function(err, db_out) {  
				if(err){
					console.error(err.message)
					return res.status(400).send(err)
				} 
				console.log(db_out.result.n + " record(s) deleted");  
				db.close();  
			});  
		});
	});
	res.status(200).send();
}

// Increment Number of requests

exports.requestsCountIncrement = (req,res,next) => {
	console.log("Increment Count of requests..");
	var table = "users_meta";
	mongoClient.connect(url,function(err,db) {
		if(err) {
			console.err(err.message);
			return res.status(405).send(err)
		}
		dbo = db.db(dbConfig.DB);
		var qry = {"meta_name":"requests_counter"}
		var update = {$inc: {"count":1}}
		dbo.collection(table).updateOne(qry, update, (err,count) => {
			if(err) {
				console.error(err.message);
				return res.status(405).send(err);
			}
			db.close();
			next();
			//return res.status(200).send(out);
		})
	});

}

// Reset request counter

exports.resetRequestsCount = (req,res,next) => {
	console.log("Reset Count of requests..");
	var table = "users_meta";
	mongoClient.connect(url,function(err,db) {
		if(err) {
			console.err(err.message);
			return res.status(405).send(err)
		}
		dbo = db.db(dbConfig.DB);
		var qry = {"meta_name":"requests_counter"}
		var update = {$set: {"count":0}}
		dbo.collection(table).updateOne(qry, update, (err,count) => {
			if(err) {
				console.error(err.message);
				return res.status(405).send(err);
			}
			db.close();
			return res.status(200).send(out);
		})
	});

}



// Return number of requests made
exports.getRequestsCount = (req,res,next) => {
	console.log("Return Count of requests..");
	var table = "users_meta";
	mongoClient.connect(url,function(err,db) {
		if(err) {
			console.err(err.message);
			return res.status(405).send(err)
		}
		console.log("Creating DB object")
		dbo = db.db(dbConfig.DB);
		var qry = {"meta_name":"requests_counter"}
		dbo.collection(table).find(qry).toArray((err,count) => {
			if(err) {
				console.error(err.message);
				return res.status(405).send(err);
			}
			console.log("Executed Query")
			//console.log(count)
			db.close();
			return res.status(200).send([count[0].count]);
		});
	});

}
