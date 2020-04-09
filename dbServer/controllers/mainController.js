var amqp = require('amqplib/callback_api');
const path = require('path')
const fs = require('fs')
const sql = require('../models/db.js')
const request = require('request-promise')
let query = ''
amqp.connect('amqp://localhost', function(error0, connection) {
  if (error0) {
    throw error0;
  }
  connection.createChannel(function(error1, channel) {
    if (error1) {
      throw error1;
    }
    var queue = 'slave';

    channel.assertQueue(queue, {
      durable: false});
    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);

    channel.consume(queue, function(msg) {
        console.log(" [x] Received %s", msg.content.toString());
        console.log("Reading Database..")
		mongoClient.connect(url, function(err, db) {
			if(err){
					console.error(err.message)

					amqp.connect('amqp://localhost', function(error0, connection) {
  					if (error0) {
    					throw error0;
  					}
  					connection.createChannel(function(error1, channel) {
  					if(error1){
  						throw error1;
  					}
  					var queue = 'response';
  		
  					channel.assertQueue(queue, {
  						durable: false
  					});
  				channel.sendToQueue(queue, Buffer.from(req));

  				});
    			setTimeout(function() {
     			  connection.close();
     			  process.exit(0);
   				}, 500);
			}
			dbo=db.db(dbConfig.DB)
			//var qry = req.body.where;
			console.log(req.body.where);
			var qry = req.body.where;
			if(req.body.where._id){
				qry = {"_id":new objectId(req.body.where._id)}
			}
			dbo.collection(req.body.table).find(qry).toArray(function(err, db_out) {
				if(err){
					console.error(err.message)
					return res.status(400).send(err)
				}
				console.log("Read Successful...\n",db_out);
				db.close();



				amqp.connect('amqp://localhost', function(error0, connection) {
  				if (error0) {
    				throw error0;
  				}
  				connection.createChannel(function(error1, channel) {
  				if(error1){
  					throw error1;
  				}
  				var queue = 'response';
  		
  				channel.assertQueue(queue, {
  					durable: false
  				});
  				channel.sendToQueue(queue, Buffer.from(req));

  				});
    			setTimeout(function() {
     			  connection.close();
     			  process.exit(0);
   				}, 500);
				return res.status(200).send(db_out);
			});
		});




       	}, {
            noAck: true
        });
  });
});
