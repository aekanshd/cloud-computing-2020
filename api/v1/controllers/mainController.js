const path = require('path')
const fs = require('fs')
const conn = require("../models/db.js");

exports.home = (req, res, next) => {
	res.send("Hello Team 2020!")
}
// 1. Create a User
exports.createUser = (req, res, next) => {
	let username = req.body.username
	let password = req.body.password

	let hexadecimals = /[0-9A-Fa-f]{6}/g
	if (hexadecimals.test(password) && password.length == 40){
		// read database to see if the user is already present, else write to DB
		let query = `SELECT * from users` + ` where username = `+req.body.username;
		sql.query(query, (err, results, fields) => {

			//IF the user is not present, add the user to the database
			if (err) {
				let query = `INSERT INTO users(username,password) VALUES(?,?)`;
				let values = [req.body.username, req.body.password];
				sql.query(query, values, (err, results, fields) => {

					if (err) return console.error(err.message);
				});
			}
		});
	}
	else
		console.error("Invalid Password (HEX decode error)")

	console.log(username, password)
	return res.status(201).send({})
}
//2. Delete a User
exports.deleteUser = (req, res, next)=>{
	let username = req.body.username
	let password = req.body.password
	let query = `SELECT userid from users` + ` where username = `+req.body.username;
	sql.query(query, (err, results, fields) => {

		//IF the user is not present, return an error message
		if (err) {
			console.error("User not found")
		}
	});
	//if the user is present, delete from the database
	let user_id = results[0].userid
	let query = `DELETE FROM users where userid = ` + user_id
	sql.query(query, (err, results, fields)=>{
		if(err){
			console.log("Error while deleting")
		}
	});

	return res.status(201).send({})


}

// 3. Create a new ride

exports.createRide = (req, res, next) => {
	let createdBy = req.body.created_by
	let timestamp = req.body.timestamp
	let source = req.body.source
	let destination = req.body.destination

	console.log("3", createdBy, timestamp, source, destination);

	return res.status(201).send({})
}

// 4. List all upcoming rides on a given route

exports.listRides = (req, res, next) => {
	let source = req.query.source
	let destination = req.query.destination

	console.log("4", source, destination);

	return res.status(201).send([
		{
			"rideId": 1234,
			"username": "{ username }",
			"timestamp": "DD- MM - YYYY: SS - MM - HH"
		},
		{
			"rideId": 1234,
			"username": "{ username }",
			"timestamp": "DD- MM - YYYY: SS - MM - HH"
		}
	])
}

// 5. List details of a given ride

exports.getRide = (req, res, next) => {
	let rideId = req.params.rideId

	console.log("5", rideId);

	return res.status(201).send({
		"rideId": "{ rideId }",
		"Created_by": "{ username }",
		"users": ["{ username1 }", "{ username1 }"],
		"Timestamp": "DD - MM - YYYY: SS - MM - HH",
		"source": "{ source }",
		"destination": "{ destination }"
	})
}

// 8. Write data to the DB

exports.writeDb = (req, res, next) => {
	if (req.body.table === 'users') {
		let query = `INSERT INTO users(username,password) VALUES(?,?)`;
		let values = [req.body.username, req.body.password];
		sql.query(query, values, (err, results, fields) => {
			if (err) return console.error(err.message);
		});
	}

	else if (req.body.table === 'rides') {
		let query = `INSERT INTO rides(ownerid,source,destination,time) VALUES(?,?,?,?)`;
		let get_query = `SELECT userid FROM users WHERE username = ` + req.body.created_by;
		sql.query(get_query, (err, results, fields) => {
			if (err) return console.error(err.message);
		});
		let ownerid = results[0].userid;
		let values = [ownerid, req.body.source, req.body.destination, req.body.timestamp];
		sql.query(query, values, (err, results, fields) => {
			if (err) return console.error(err.message);
		});
	}

	else if (req.body.table === 'transactions') {
		let query = `INSERT INTO transations(rideid,userid,time) VALUES(?,?,?)`;
		let get_query = `SELECT userid FROM users WHERE username = ` + req.body.username;
		sql.query(get_query, (err, results, fields) => {
			if (err) return console.error(err.message);
		});
		let userid = results[0].userid;
		let values = [req.body.rideid, userid, timestamp];
		sql.query(query, values, (err, results, fields) => {
			if (err) return console.error(err.message);
		});
	}
}

// 9. Read data from the DB

exports.readDb = (req, res, next) => {
	let query = `SELECT * from` + req.body.table + ` where ` + req.body.where;
	sql.query(query, (err, results, fields) => {
		if (err) return console.error(err.message);
	});
	res.send({ "data": results });
}