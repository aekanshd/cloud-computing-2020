var amqp = require("amqplib/callback_api");
const path = require("path");
const fs = require("fs");
var async = require("async");

const dbConfig = {
	HOST: process.env.DB_SERVER || "localhost",
	USER: process.env.DB_USERNAME || "root",
	PASSWORD: process.env.DB_PASSWORD || "",
	DB: process.env.DB_DATABASE || "rideshare",
};
const mongoClient = require("mongodb").MongoClient;
objectId = require("mongodb").ObjectID;

const request = require("request-promise");
let query = "";

rabbit = {
	hostname: "amqp://rabbitmq:5672/",
	virtualHost: "rideshare",
	user: "ravi",
	password: "ravi",
};
const opt = {
	credentials: require("amqplib").credentials.plain(
		rabbit.user,
		rabbit.password
	),
};
const rabbitServer = rabbit.hostname + rabbit.virtualHost;
const role = process.env.ROLE;

console.log("Server has been started.");

if (process.env.ROLE == "master") {
	console.log("Acting as Master");
} else {
	console.log("Acting as Slave");
}

if (role == "master") {
	console.log("Master");
	master((err, res) => {
		if (err) {
			throw error;
		}
		console.log(res);
	});
} else if (role == "slave") {
	console.log("Slave");
	slave((err, res) => {
		if (err) {
			throw err;
		}
		console.log(res);
	});
}

function slave(callback) {
	amqp.connect(rabbitServer, opt, function (err, connection) {
		if (err) {
			return callback(err);
		}
		process.once("SIGINT", function () {
			connection.close();
		});
		connection.createChannel((err, readChannel) => {
			if (err) {
				return callback(err);
			}
			readChannel.prefetch(1);
			connection.createChannel((err, syncChannel) => {
				if (err) {
					return callback(err);
				}
				syncChannel.prefetch(1);
				//Read queue
				var readQueue = "read";
				readChannel.assertQueue(readQueue, {
					durable: true,
				});
				console.log(
					" [*] Waiting for messages in Read Queue. To exit press CTRL+C"
				);
				//Sync queue
				var exchange = "syncExchange";
				syncChannel.assertExchange(exchange, "fanout", {
					durable: true,
				});
				async.parallel(
					[
						() => {
							readChannel.consume(readQueue, (msg) => {
								console.log(msg.content.toString());
								consumeReadQueue(msg);
							});
						},
						() => {
							syncSlave(syncChannel, exchange, callback);
						},
					],
					(err, results) => {
						if (err) {
							console.log(err);
							return callback(err);
						}
						console.log(results);
						return callback(null, results);
					}
				);
			});
		});
	});
}

consumeReadQueue = (msg) => {
	//console.log(channel)
	if (msg != null) {
		query = msg.content.toString();
		console.log(" [x] Received %s", query);
		
		readDb(JSON.parse(query), (err, res) => {
			if (err) {
				console.log(err)
				return
			} else {
				var responseQueue = "response"
				channel.assertQueue(responseQueue, {
					durable: false
				})
				channel.sendToQueue(responseQueue, Buffer.from(res.toString()))
			}
		})
	}
};

syncSlave = (channel, exchange, callback) => {
	channel.assertQueue(
		"",
		{
			exclusive: true,
		},
		function (err, q) {
			if (err) {
				console.log(err);
				return callback(err);
			}
			console.log("Sync function..");
			console.log(
				" [*] Waiting for messages in Sync Queue. To exit press CTRL+C"
			);
			channel.bindQueue(q.queue, exchange, "");
			channel.consume(
				q.queue,
				function (msg) {
					if (msg.content) {
						console.log(" [x] message %s", msg.content.toString());
						data = msg.content.toString()
				console.log(" [x] Recieved %s", data);
				writeDb(JSON.parse(data), (err, res) => {
					if (err) {
						console.log(err)
						return callback(err)
					}
					return callback(null, res)
				})
					}
				},
				{
					noAck: true,
				}
			);
		}
	);
};

function master(callback) {
	amqp.connect(rabbitServer, opt, function (error0, connection) {
		if (error0) {
			console.log(error0);
			return callback(error0);
		}
		connection.createChannel((err, channel) => {
			if (err) {
				console.log(err);
				return callback(err);
			}
			//Write queue
			var writeQueue = "write";
			channel.assertQueue(writeQueue, {
				durable: true,
			});
			channel.prefetch(1);
			console.log(
				" [*] Waiting for messages in %s. To exit press CTRL+C",
				writeQueue
			);
			channel.consume(
				writeQueue,
				(msg) => {
					query = msg.content.toString();
					console.log(" [x] Received %s", query);
					readDb(JSON.parse(query), (err, res) => {
						if (err) {
							console.log(err);
							return callback(err);
						} else {
							var responseQueue = "response";
							channel.assertQueue(responseQueue, {
								durable: false,
							});
							channel.sendToQueue(
								responseQueue,
								Buffer.from(res.toString())
							);
							//Sync queue
							var syncData = query;
							var exchange = "syncExchange";
							channel.assertExchange(exchange, "fanout", {
								durable: false,
							});
							console.log(
								"Syncing Slaves with rquest : ",
								syncData
							);
							channel.publish(
								exchange,
								"",
								Buffer.from(syncData)
							);
							console.log(" [x] Sent %s", syncData);
							return callback(null, res);
						}
					});
				},
				{
					noAck: true,
				}
			);
		});
	});
}

readDb = (req, callback) => {
	console.log("Reading Database..");
	mongoClient.connect(dbConfig.HOST, (err, db) => {
		if (err) {
			console.error(err.message);
			return callback(err);
		}
		dbo = db.db(dbConfig.DB);
		console.log(req.body.where);
		var qry = req.body.where;
		if (req.body.where._id) {
			qry = { _id: new objectId(req.body.where._id) };
		}
		dbo.collection(req.body.table)
			.find(qry)
			.toArray(function (err, db_out) {
				if (err) {
					console.error(err.message);
					return callback(err);
				}
				console.log("Read Successful...\n", db_out);
				db.close();
				return callback(null, db_out);
			});
	});
};

writeDb = (req, callback) => {
	console.log("DB api");
	if (req.method === "POST") {
		console.log("Recieved DB write POST request..");
		if (req.body.table === "users") {
			mongoClient.connect(dbConfig.HOST, function (err, db) {
				if (err) {
					console.log(err);
					return callback(err);
				}
				dbo = db.db(dbConfig.DB);
				console.log("Connected to DB..");
				var user = {
					username: req.body.username,
					password: req.body.password,
				};
				dbo.collection(req.body.table).insertOne(user, function (
					err,
					db_out
				) {
					if (err) {
						console.log(err);
						return callback(err);
					}
					console.log("Record inserted");
					db.close();
					return callback(null, db_out);
				});
			});
		} else if (req.body.table === "rides") {
			if (req.body.update) {
				mongoClient.connect(dbConfig.HOST, function (err, db) {
					dbo = db.db(dbConfig.DB);
					if (err) {
						console.log(err);
						return callback(err);
					}
					console.log("Connected to DB..");
					var query = { _id: new objectId(req.body._id) };
					var newuser = { $push: { users: req.body.username } };
					dbo.collection(req.body.table).updateOne(
						query,
						newuser,
						function (err, db_out) {
							if (err) {
								console.log(err);
								return callback(err);
							}
							console.log("Record updated...");
							db.close();
							return callback(null, db_out);
						}
					);
				});
			} else {
				mongoClient.connect(dbConfig.HOST, function (err, db) {
					dbo = db.db(dbConfig.DB);
					if (err) {
						console.log(err);
						return callback(err);
					}
					console.log("Connected to DB...");
					var ride = {
						owner: req.body.owner,
						source: req.body.source,
						destination: req.body.destination,
						timestamp: req.body.timestamp,
					};
					dbo.collection(req.body.table).insertOne(ride, function (
						err,
						db_out
					) {
						if (err) {
							console.log(err);
							return callback(err);
						}
						console.log("Record inserted");
						db.close();
						return callback(null, db_out);
					});
				});
			}
		} else {
			console.log("Method Not Supported");
			return callback("Method Not Supported");
		}
	} else if (req.method === "DELETE") {
		console.log("Recieved DB write DELETE request..");

		mongoClient.connect(dbConfig.HOST, function (err, db) {
			dbo = db.db(dbConfig.DB);
			if (err) {
				console.log(err);
				return callback(err);
			}
			var qry = req.body.where;
			if (req.body.where._id) {
				qry = { _id: new objectId(req.body.where._id) };
			}
			dbo.collection(req.body.table).deleteOne(qry, function (err, obj) {
				if (err) {
					console.log(err);
					return callback(err);
				}
				console.log(obj.result.n + " record(s) deleted");
				db.close();
				return callback(null, obj);
			});
		});
	}
};
