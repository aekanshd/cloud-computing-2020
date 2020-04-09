var amqp = require('amqplib/callback_api');
const path = require('path')
const fs = require('fs')
const sql = require('../models/db.js')
const request = require('request-promise')
let query = ''

exports.home = (req, res, next) => {
	res.send("Hello Team 2020!")
}
exports.sendtoMaster = (req, res, next)=>{

	amqp.connect('amqp://localhost', function(error0, connection) {
  		if (error0) {
    		throw error0;
  		}
  	connection.createChannel(function(error1, channel) {
  		if(error1){
  			throw error1;
  		}
  		var queue = 'master';
  		
  		channel.assertQueue(queue, {
  			durable: false
  		});
  		channel.sendToQueue(queue, Buffer.from(req));

  	});
    setTimeout(function() {
       connection.close();
       process.exit(0);
   }, 500);
});

exports.sendtoSlave = (req, res, next)=>{

	amqp.connect('amqp://localhost', function(error0, connection) {
  		if (error0) {
    		throw error0;
  		}
  	connection.createChannel(function(error1, channel) {
  		if(error1){
  			throw error1;
  		}
  		var queue = 'slave';
  		
  		channel.assertQueue(queue, {
  			durable: false
  		});
  		channel.sendToQueue(queue, Buffer.from(req));

  	});
    setTimeout(function() {
       connection.close();
       process.exit(0);
   }, 500);
});



// 8. Write data to the DB

exports.writeDb = (req, res, next) => {
	console.log("DB api");
	if (req.method === "POST") {
		console.log("Recieved DB write POST request..");
		sendtoMaster(req, res, next);
		}

		else {
			res.status(400).send("Table Not Supported")
		}
	}


// 9. Read data from the DB

exports.readDb = (req, res, next) => {
	console.log("Reading Database..")
	sendtoSlave(req, res, next);
}

// 10. Clear DB
 exports.clearDb = (req, res, next) => {
	sendtoMaster(req, res, next);
}