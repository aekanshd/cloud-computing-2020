var amqp = require('amqplib/callback_api');
// const path = require("path");
// const fs = require("fs");
// const Docker = require("dockerode");
// const build = require('dockerode-build')
// const pump = require('pump');
// // const request = require("request-promise");

const rabbit = {
	hostname: 'amqp://rabbitmq:5672/',
	virtualHost: 'rideshare',
	user: 'ravi',
	password: 'ravi',
};
const rabbitServer = rabbit.hostname + rabbit.virtualHost;
const opt = {
	credentials: require('amqplib').credentials.plain(
		rabbit.user,
		rabbit.password
	),
};

exports.home = (req, res, next) => {
	res.send('Hello Team 2020!');
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
	console.log('DB Write');
	if (req.method === 'POST' || req.method === 'DELETE') {
		req.queue = 'write';
		sendData(req, (err, retval) => {
			if (err) {
				return res.status(500).send(err);
			}
			return res.status(200).send();
		});
	} else {
		res.status(400).send('Method Not Supported');
	}
};

exports.readDb = (req, res, next) => {
	console.log('DB Read');
	if (req.method === 'POST') {
		req.queue = 'read';
		sendData(req, (err, retval) => {
			if (err) {
				return res.status(500).send(err);
			}
			req.queue = 'response';
			readData(req, (err, retval) => {
				console.log('Returned from readData : ', retval);
				if (err) {
					console.log(err);
				} else {
					return res.status(200).send(retval);
				}
			});
		});
	} else {
		res.status(400).send('Method Not Supported');
	}
};

exports.clearDb = (req, res, next) => {
	console.log('Clear DB');
	if (req.method === 'POST') {
		let flag = 0;
		var tables = ['rides', 'users'];
		tables.forEach((table) => {
			const db_req = { table: table, where: {} };
			req.method = 'DELETE';
			req.body = db_req;
			req.queue = 'write';
			sendData(req, (err, retval) => {
				if (err) {
					flag = 1;
					return res.status(500).send(err);
				}
			});
		});
		if (flag === 0) { return res.status(200).send({}); }
	} else {
		return res.status(400).send('Method Not Supported');
	}
};

// --------------------------------------------

const sendData = (req, callback) => {
	amqp.connect(rabbitServer, opt, function (err, connection) {
		if (err) {
			console.error(err);
			return callback(err);
		}
		console.log('Connected to rabbit..');
		connection.createChannel(function (err, channel) {
			if (err) {
				console.error(err);
				return callback(err);
			}
			console.log('Created Channel for ' + req.queue + ' queue..');
			var queue = req.queue;
			channel.assertQueue(queue, {
				durable: true,
			});
			channel.sendToQueue(queue, Buffer.from(JSON.stringify({ method: req.method, body: req.body })),
				{ persistent: false }
			);
			console.log('Message sent...');
			return callback(null, {});
		});
	});
};

const readData = (req, callback) => {
	amqp.connect(rabbitServer, opt, function (error0, connection) {
		if (error0) {
			console.error(error0);
			return callback(error0);
		}
		connection.createChannel(function (error1, channel) {
			if (error1) {
				console.error(error1);
				return callback(error1);
			}
			// var queue = 'write';
			const queue = req.queue;
			channel.assertQueue(queue, {
				durable: true,
			});
			channel.prefetch(1);
			channel.consume(
				queue,
				(msg) => {
					const data = msg.content.toString();
					console.log(' Received %s', data);
					callback(null, JSON.parse(data));
					connection.close();
				},
				{
					noAck: true,
				}
			);
		});
	});
};
