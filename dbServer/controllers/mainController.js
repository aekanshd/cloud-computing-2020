var amqp = require('amqplib/callback_api');
const path = require('path')
const fs = require('fs')

const dbConfig = require("../config/db.config.js");
const mongoClient = require("mongodb").MongoClient;
objectId = require('mongodb').ObjectID;
const url = require("../models/db.js").url

const request = require('request-promise')
let query = ''

rabbit = {
	hostname:"amqp://localhost/",
	virtualHost: "rideshare",
	user: "ravi",
	password: "ravi"
}
const opt = {
	credentials: require('amqplib').credentials.plain(rabbit.user,rabbit.password)
}
const rabbitServer = rabbit.hostname+rabbit.virtualHost
const role = process.env.ROLE


if (role == 'master') {
	console.log("Master")
	master((err,res)=>{
		if (err) {
			throw error
		}
		console.log(res)
	})
} else if (role == 'slave') {
	console.log("Slave")
	slave((err,res)=>{
		if (err) {
			throw error
		}
		console.log(res)
	})
}  

slave = (callback) => {
	amqp.connect(rabbitServer, opt,function(error0, connection) {
		if (error0) {
			return callback(error0)
		}
		connection.createChannel((err, channel) => {
			if (err) {
				return callback(err)
			}
			//Read queue
			var readQueue="read"			
			//Sync queue
			var exchange = "syncExchange"
			channel.assertExchange(exchange, 'fanout', {
				durable: false
			})
			async.parallel ([consumeReadQueue(channel,readQueue),syncSlave(channel,exchange)],
				callback(err,results)
			)
		})
		setTimeout(function() {
			connection.close()
			process.exit(0)
		}, 500)
	})
}

consumeReadQueue = (channel,queue,callback) => {
	channel.assertQueue(queue, {
		durable: false
	});
	console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", readQueue);
	channel.consume(readQueue, (msg) => {
		query = msg.content.toString()
		console.log(" [x] Received %s",query);
		readDb(JSON.parse(query) , (err,res) =>{
			if(err) {
				console.log(err)
				return callback(err)
			} else {
				var responseQueue = "response"
				channel.assertQueue(responseQueue, {
					durable: false
				})
				channel.sendToQueue(responseQueue, Buffer.from(res.toString()))
				return callback(null,res)
			}
		})				
	},
	{
		noAck: false
	})
}

syncSlave = (channel,exchange,callback) => {
	channel.assertQueue('', {
		exclusive: true
	  	}, function(err, q) {
		if (err) {
			console.log(err)
			return callback(err)
		}
		console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q.queue);
		channel.bindQueue(q.queue, exchange, '');  
		channel.consume(q.queue, function(msg) {
			if (msg.content) {
				data = msg.content.toString()
				console.log(" [x] %s", data);
				writeDb(JSON.parse(data) , (err,res) => {
					if (err) {
						console.log(err)
						return callback(err)
					}
					return callback(null,res)
				})
			}
		}, {
		  noAck: true
		});
	})
}

master = (callback) => {
	amqp.connect(rabbitServer, opt,function(error0, connection) {
		if (error0) {
			console.log(error0)
			return callback(error0)
		}
		connection.createChannel((err, channel) => {
			if (err) {
				console.log(err)
				return callback(err)
			}
			//Write queue
			var writeQueue="write"	
			channel.assertQueue(writeQueue, {
				durable: false
			});
			console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", writeQueue);
			channel.consume(writeQueue, (msg) => {
				query = msg.content.toString()
				console.log(" [x] Received %s",query);
				readDb(JSON.parse(query) , (err,res) =>{
					if(err) {
						console.log(err)
						return callback(err)
					} else {
						var responseQueue = "response"
						channel.assertQueue(responseQueue, {
							durable: false
						})
						channel.sendToQueue(responseQueue, Buffer.from(res.toString()))
						//Sync queue
						var syncData = query
						var exchange = "syncExchange"
						channel.assertExchange(exchange, 'fanout', {
							durable: false
						})
						console.log("Syncing Slaves with rquest : ", syncData)
						channel.publish(exchange, '', Buffer.from(syncData));
						console.log(" [x] Sent %s", syncData);
						return callback(null,res)
					}
				})				
			},
			{
				noAck: false
			})			
		})
		setTimeout(function() {
			connection.close()
			process.exit(0)
		}, 500)
	})
}


readDb = (req,callback) => {
	console.log("Reading Database..")
	mongoClient.connect(url, (err, db) => {
		if(err){
			console.error(err.message)
			return callback(err)
		}
		dbo=db.db(dbConfig.DB)
		console.log(req.body.where);
		var qry = req.body.where;
		if(req.body.where._id){
			qry = {"_id":new objectId(req.body.where._id)}
		}
		dbo.collection(req.body.table).find(qry).toArray(function(err, db_out) {
			if(err){
				console.error(err.message)
				return callback(err)
			}
			console.log("Read Successful...\n",db_out);
			db.close();
			return callback(null,db_out);
		});
	});
}

writeDb = (req , callback) => {
	console.log("DB api");
	if (req.method === "POST") {
		console.log("Recieved DB write POST request..");
		if (req.body.table === "users") {
			mongoClient.connect(url, function(err, db) {  
				if(err){
					console.log(err)
					return callback(err)
				} 
				dbo=db.db(dbConfig.DB)
				console.log("Connected to DB..");
				var user = { 
								"username": req.body.username,
								"password": req.body.password 
							}; 
				dbo.collection(req.body.table).insertOne(user, function(err, db_out) {  
					if(err){
						console.log(err)
						return callback(err)
					}  
					console.log("Record inserted");  
					db.close();  
					return callback(null,db_out);
				});  
			});
		}

		else if (req.body.table === "rides") {

			if(req.body.update){
				mongoClient.connect(url, function(err, db) {  
					dbo=db.db(dbConfig.DB)
					if(err){
						console.log(err)
						return callback(err)
					}  
					console.log("Connected to DB..");
					var query = { "_id": new objectId(req.body._id)};
					var newuser = { $push: {"users": req.body.username } };
					dbo.collection(req.body.table).updateOne(query, newuser, function(err, db_out) {  
						if(err){
							console.log(err)
							return callback(err)
						}  
						console.log("Record updated...");  
						db.close();  
						return callback(null,db_out) 
					});  
				});
			}
			else{
				mongoClient.connect(url, function(err, db) {  
					dbo=db.db(dbConfig.DB)
					if(err){
						console.log(err)
						return callback(err)
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
							console.log(err)
							return callback(err)
						}  
						console.log("Record inserted");  
						db.close();
						return callback(null,db_out)
					});  
				});
			}
		}
		else {
			console.log("Method Not Supported")
			return callback("Method Not Supported")
		}
	}
	else if (req.method === "DELETE") {
		console.log("Recieved DB write DELETE request..");
		
		mongoClient.connect(url, function(err, db) {  
			dbo=db.db(dbConfig.DB)
			if(err){
				console.log(err)
				return callback(err)
			}  
			var qry = req.body.where; 
			if(req.body.where._id){
				qry = {"_id":new objectId(req.body.where._id)}
			} 
			dbo.collection(req.body.table).deleteOne(qry, function(err, obj) {  
				if(err){
					console.log(err)
					return callback(err)
				} 
				console.log(obj.result.n + " record(s) deleted");  
				db.close(); 
				return callback(null,obj)
			});  
		});
		
	}
}
