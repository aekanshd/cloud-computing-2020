const path = require('path')
const fs = require('fs')
const sql = require('../models/db.js')
const request = require('request-promise')
let query = ''

exports.home = (req, res, next) => {
	res.send("Hello Team 2020!")
}

// 1. Create a User
exports.createUser = (req, res, next) => {
	let username = req.body.username
	let password = req.body.password

	let hexadecimals = /[0-9A-Fa-f]{6}/g
	if (hexadecimals.test(password) && password.length == 40) {
		let db_req = {"table":"users","where":`username="`+username+`"`};
		const options = {method: 'POST',uri: 'http://localhost:62020/api/v1/db/read',body: db_req,json: true}
		request(options)
		.then(function(results)
			{
			//IF the user is not present, add the user to the database
			if (results.length==0) {
				let db_req = {"table":"users","username":username,"password":password};
				const options = {method: 'POST',uri: 'http://localhost:62020/api/v1/db/write',body: db_req,json: true}
				request(options)
				.then(function(reponse){
					console.log(username, password)
					return res.status(201).send({});
				})
				.catch(function(err){
				console.error(err.message);
					return res.status(400).send({});
				})
			}
			else{
				console.error("Username already exists..")
				return res.status(405).send({});
			}
		})
		.catch(function(err){
			console.error(err.message);
			return res.status(400).send({});
		})
	}
	else{
		console.error("Invalid Password (HEX decode error)")
		return res.status(405).send({});
	}
	
}


// 2. Delete a User
exports.deleteUser = (req, res, next) => {
	let username = req.params.username
	let db_req = {"table":"users","where":`username="`+username+`"`};
	const options = {method: 'POST',uri: 'http://localhost:62020/api/v1/db/read',body: db_req,json: true}
	request(options)
	.then(function(result){
		//IF the user is not present, return an error message
		if(result.length == 0){
			console.error("User Not Found..")
			return res.status(405).send({})
		}
		console.log("User Exists");
		user_id = result[0].userid
		//if the user is present, delete from the database
		let db_req = {"table":"users","where":`userid="`+user_id+`"`};
		const options = {method: 'DELETE',uri: 'http://localhost:62020/api/v1/db/delete',body: db_req,json: true}
		request(options)
		.then(function(response){
			return res.status(201).send({})
		})
		.catch(function(err){
			console.error(err.message);
			return res.status(400);
		})	
	})
	.catch(function(err){
		console.error(err.message);
		return res.status(400);
	})
	
}


// 3. Create a new ride

exports.createRide = (req, res, next) => {
	let createdBy = req.body.created_by
	let timestamp = req.body.timestamp
	let source = req.body.source
	let destination = req.body.destination

	console.log("3", createdBy, timestamp, source, destination);

	if (
		createdBy.replace(/\s/g, '') === "" ||
		timestamp.replace(/\s/g, '') === "" /*||
		source.replace(/\s/g, '') === "" ||
		destination.replace(/\s/g, '') === ""*/
	) {
		console.log("flag1");
		return res.status(204).send({})
	}

	let options = {
		method: 'POST',
		uri: 'http://localhost:62020/api/v1/db/read',
		body: {},
		json: true
	}

	options['body'] = {
		table: 'users',
		where: 'username = "' +createdBy +'"'
	}

	request(options)
		.then(function(response) {
			options['uri'] = 'http://localhost:62020/api/v1/db/write'
			options['body'] = {
				table: 'rides',
				ownerid: response[0].userid,
				timestamp: timestamp,
				source: source,
				destination: destination
			}

			request(options)
				.then(function (response) {
					console.log("Success..")
					return res.status(201).send({})
				})
				.catch(function (err) {
					console.log(err)
					return res.status(400).send({})
				});

		})
		.catch(function (err) {
			console.log("Flag2");
			return res.status(400).send({});
		})
}


// 4. List all upcoming rides on a given route

exports.listRides = (req, res, next) => {
	let source = req.query.source
	let destination = req.query.destination

	console.log("4", source, destination);

	if (
		source.replace(/\s/g, '') === "" ||
		destination.replace(/\s/g, '') === ""
	) {
		console.log("204")
		return res.status(204)
	}

	let options = {
		method: 'POST',
		uri: 'http://localhost:62020/api/v1/db/read',
		body: {"table":"rides","where":'source='+source+' AND destination='+destination},
		json: true
	}
	request(options)
	.then(function (response) {
		console.log("success")
		 console.log(response);
		return res.status(201).send(response)
	})
	.catch(function (err) {
		console.error("Error: 400");
		return res.status(400)
	});			
				
}


// 5. List details of a given ride

exports.getRide = (req, res, next) => {
	let rideId = req.params.rideId

	console.log("5", rideId);
	/*
	if (
		rideId.replace(/\s/g, '') === ""
	) {
		return res.status(204)
	}*/

	let options = {
		method: 'POST',
		uri: 'http://localhost:62020/api/v1/db/read',
		body: {},
		json: true
	}

	options['body'] = {
		table: 'rides',
		where: 'rideid = ' + rideId
	}

	request(options)
		.then(function (response) {
			return res.status(200).send(response)
		})
		.catch(function (err) {
			return res.status(400);
		})

	// return res.status(201).send({
	// 	"rideId": "{ rideId }",
	// 	"Created_by": "{ username }",
	// 	"users": ["{ username1 }", "{ username1 }"],
	// 	"Timestamp": "DD - MM - YYYY: SS - MM - HH",
	// 	"source": "{ source }",
	// 	"destination": "{ destination }"
	// })
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
		uri: 'http://localhost:62020/api/v1/db/read',
		body: {},
		json: true // JSON stringifies the body automatically
	}

	options['uri'] = 'http://localhost:62020/api/v1/db/write';
	options['body'] = {}; // remove this if not necessary.
	options['body'] = { table: 'transactions', username: username, rideid: rideId };
	request(options)
		.then(function (response) {
			console.log("inside last")
			return res.status(200).send({});
		})
		.catch(function (err) {
			return res.status(400);
		});

	// const options = {
	// 	method: 'POST',
	// 	uri: 'http://localhost:62020/api/v1/db/read',
	// 	body: {},
	// 	json: true
	// 	// JSON stringifies the body automatically
	// }

	// options['body'] = {}; // remove this if not necessary.
	// options['body'] = { table: 'rides', where: 'rideid = ' + rideId };

	// request(options)
	// 	.then(function (response) {
	// 		console.log("in read db rides")
			
	// 	})
	// 	.catch(function (err) {
	// 		return res.status(400);
	// 	})
}

// 7. Delete a ride

exports.deleteRide = (req, res, next) => {
	let rideId = req.params.rideId
	
	console.log("6", rideId);

	if (rideId.replace(/\s/g, '') === "") {
		return res.status(204);
	}
	let db_req = {"table":"transactions","where":"rideid="+rideId};
	const options = {
		method: 'DELETE',
		uri: 'http://localhost:62020/api/v1/db/delete',
		body: db_req,
		json: true 
			
	}

		request(options)
		.then(function(reponse){
			return res.status(200).send({});
		})
		.catch(function(err){
			console.error(err.message);
			return res.status(400);
		})

	
}

// 8. Write data to the DB

exports.writeDb = (req, res, next) => {
	
	if(req.method==='POST'){
		console.log("Recieved DB write POST request..");
		if (req.body.table === 'users') {
			query = `INSERT INTO users(username,password) VALUES(?,?)`;
			let values = [req.body.username, req.body.password];
			sql.query(query, values, (err, results, fields) => {
				if (err){
					console.error(err.message);
					return res.status(400).send(err)
			   }
			   return res.status(200).send({})
			});

		}

		else if (req.body.table === 'rides') {
				let query = `INSERT INTO rides(ownerid,source,destination,time) VALUES(?,?,?,?)`
				let values = [req.body.ownerid, req.body.source, req.body.destination, req.body.timestamp];
				sql.query(query, values, (err, results, fields) => {
				if (err){
					console.error("Error: "+err.message);
					return res.status(400).send(err)
				}
				return res.status(200).send({})
				});
		}

		else if (req.body.table === 'transactions') {
			query = `INSERT INTO transactions(rideid,userid,time) VALUES(?,?,?)`;
			let get_query = `SELECT userid FROM users WHERE username = "` + req.body.username+`"`;
			console.log(get_query)
			sql.query(get_query, (err, results, fields) => {
				console.log(results)
				if (err){
					console.error(err.message);
					res.status(400).send(err)
			   }
				if(results.length==0) {
					console.error("Invalid Username");
					return res.status(405);			
			}
				let userid = results[0].userid;
				let today = new Date();
				let date = today.getDate()+'-'+(today.getMonth()+1)+today.getFullYear()+':';
				let time = today.getSeconds() + "-" + today.getMinutes() + "-" + today.getHours();
				let timestamp = date+' '+time;
				let values = [req.body.rideid, userid, timestamp];
				sql.query(query, values, (err, results, fields) => {
				if (err){
					console.error(err.message);
					res.status(400).send(err)
			   }
			   return res.status(200).send({});
			});
		});
		}		
	}
	
	else if(req.method==='DELETE'){
		console.log("Recieved DB write DELETE request..");
		query = `DELETE FROM ` + req.body.table + ` where ` + req.body.where;
		sql.query(query, (err, results, fields) => {
			if (err){
				 console.error(err.message);
				 return res.status(400).send(err)
			}
			console.log(results);
			return res.status(200).send({})
		});	
	}
}


// 9. Read data from the DB

exports.readDb = (req, res, next) => {
	query = `SELECT * FROM ` + req.body.table + ` WHERE ` + req.body.where;
	sql.query(query, (err, results, fields) => {
		if (err) {
			console.error(err.message)
			return res.status(400).send(err)
		}
		console.log("From readDb:\n", results);
		res.send(results);
	});
}
