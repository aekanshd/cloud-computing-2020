let path = require('path')
let fs = require('fs')

exports.home = (req, res, next) => {
	res.send("Hello Team 2020!")
}

exports.createUser = (req, res, next) => {
	let username = req.body.username
	let password = req.body.password

	let hexadecimals = /[0-9A-Fa-f]{6}/g
	if (hexadecimals.test(password))
		console.log(password)
	else
		console.error("Invalid Password (HEX decode error)")

	console.log(username, password)
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