var amqp = require("amqplib/callback_api");
const path = require("path");
const fs = require("fs");
const Docker = require("dockerode");
//const http = require("http");
//var build = require('dockerode-build')
//var pump = require('pump');
const request = require("request-promise");

rabbit = {
	hostname: "amqp://rabbitmq:5672/",
	virtualHost: "rideshare",
	user: "ravi",
	password: "ravi",
};
const rabbitServer = rabbit.hostname + rabbit.virtualHost;
const opt = {
	credentials: require("amqplib").credentials.plain(
		rabbit.user,
		rabbit.password
	),
};

exports.home = (req, res, next) => {
	res.send("Hello Team 2020!");
};
/*
var createOptions = {
	Image:"newimage",
    Tty:true,
    ExposedPorts: {
        "3000/tcp:": {},
        "1883/tcp:": {}
    },
    Env:[
        "DBHOST=" + dbHost,
    ],
    Cmd:[
        "/bin/bash", "-c", "nodejs /opt/ifi/lib/ifi/app.js"
    ],
    HostConfig:{
        Binds: ["/Users/cefn/Documents/code/imagination/git/ifi/impl/releases/keynote/0.1.0:/opt/ifi"],
    }
};

var startOptions = {
    PortBindings: {
        "3000/tcp": [{
            "HostIP":"0.0.0.0",
            "HostPort": "3000"
        }],
        "1883/tcp": [{
            "HostIP":"0.0.0.0",
            "HostPort": "1883"
        }],
    },
};
*/

exports.writeDb = (req, res, next) => {
	console.log("DB Write");
	if (req.method === "POST" || req.method === "DELETE") {
		req.queue = "write";
		sendData(req, (err, retval) => {
			if (err) {
				return res.status(500).send(err);
			}
			 return res.status(200).send();
			
		});
	} else {
		res.status(400).send("Method Not Supported");
	}
};

exports.readDb = (req, res, next) => {
	console.log("DB Read");
	if (req.method === "POST") {
		req.queue = "read";
		sendData(req, (err, retval) => {
			if (err) {
				//return res.status(500).send(err);
				throw err
			}
			const options = {
			method: 'GET',
			uri: 'http://localhost:8000/api/v1/db/readData',
			body: {},
			json: true
			}

			options['body'] = {
				queue: 'response'				
			}
			request(options).then(response=>{
				console.log(response)
				res.status(200).send(response)
			}).catch(err => {throw err})
			
			/*
			http.get("http://localhost:8000/api/v1/db/readData", ,(resp)=>{
				let data = '';
				resp.on('data', (chunk)=>{
					data+=chunk;

				});
				resp.on('end', ()=>{
					res.status(200).send(JSON.parse(data));
				});

			}).on("error", (err)=>{
				res.status(500).send(err);
			});
			
			readData(req, (err, retval) => {
				if (err) {
					return res.status(500).send(err);
				}
				else{
				return res.status(200).send(JSON.parse(retval));
			}
			});*/
		});
	} else {
		res.status(400).send("Method Not Supported");
	}
};

exports.clearDb = (req, res, next) => {
	console.log("Clear DB");
	if (req.method === "POST") {
		flag = 0
		var tables = ["rides", "users"];
		tables.forEach((table) => {
			let db_req = { table: table, where: {} };
			req.method = "DELETE";
			req.body = db_req;
			req.queue = "write";
			sendData(req, (err, retval) => {
				if (err) {
					flag = 1;
					return res.status(500).send(err);
				}
				return
			});
			
		});
		if(flag ==0) {return res.status(200).send({});}
	} else {
		return res.status(400).send("Method Not Supported");
	}
};

//--------------------------------------------

sendData = (req, callback) => {
	amqp.connect(rabbitServer, opt, function (err, connection) {
		if (err) {
			console.error(err);
			return callback(err);
		}
		console.log("Connected to rabbit..")
		connection.createChannel(function (err, channel) {
			if (err) {
				console.error(err);
				return callback(err);
			}
			console.log("Created Channel for "+req.queue+" queue..")
			queue = req.queue;
			channel.assertQueue(queue, {
				durable: true,
			});
			channel.sendToQueue(queue, Buffer.from(JSON.stringify({method:req.method,body:req.body})),
			{persistent:false}
			);
			console.log("Message sent...")
			return callback(null, {});
		});
	});
};

exports.readData = (req, res, next) => {
	amqp.connect(rabbitServer, opt, function (error0, connection) {
		if (error0) {
			console.error(error0);
			//return res.status(500).send(error0);
			//return callback(error0);
			throw error0
		}
		connection.createChannel(function (error1, channel) {
			if (error1) {
				console.error(error1);
				//return res.status(500).send(error1);
				throw error1
				//return callback(error1);
			}
			//var queue = 'write';
			queue = req.body.queue;
			var retval=channel.assertQueue(queue, {
				durable: true
					});
			channel.prefetch(1)
			channel.consume(
				queue,
				(msg) => {
					data = msg.content.toString();
					console.log(" Received %s", data);
					res.status(200).send(data)
					return
				},
				{
					noAck: true,
				}
			);
		});
	});
};

