let path = require('path')
let fs = require('fs')
let mysql = require('mysql');

let file = fs.readFileSync('db_credentials.json');
	let credentials = JSON.parse(file);
	let conn = mysql.createConnection({
		host:credentials.host,
		database:credentials.database,
		user:credentials.user,
		password:credentials.password
	});
	conn.connect(function(err) {
		if (err) throw err;
	 });

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

//8. Write data to Database
exports.writeDb = (req, res, next) =>{
	if(req.body.table==='users'){
		let sql = `INSERT INTO users(username,password) VALUES(?,?)`;
		let values = [req.body.username,req.body.password];
		conn.query(sql,values,(err, results, fields) => {
			if (err) {
			  return console.error(err.message);
			}});
	}
	else if(req.body.table==='rides'){
		let sql = `INSERT INTO rides(ownerid,source,destination,time) VALUES(?,?,?,?)`;
		let get_query = `SELECT userid FROM users WHERE username = ` + req.body.created_by;
		conn.query(get_query,(err, results, fields) => {
			if (err) {
			  return console.error(err.message);
			});
		let ownerid = results[0].userid;
		let values = [ownerid,req.body.source,req.body.destination,req.body.timestamp];
		conn.query(sql,values,(err, results, fields) => {
			if (err) {
			  return console.error(err.message);
			}});
	}
	else if(req.body.table==='transactions'){
		let sql = `INSERT INTO transations(rideid,userid,time) VALUES(?,?,?)`;
		let get_query = `SELECT userid FROM users WHERE username = ` + req.body.username;
		conn.query(get_query,(err, results, fields) => {
			if (err) {
			  return console.error(err.message);
			});
		let userid = results[0].userid;
		let values = [req.body.rideid,userid,timestamp];
		conn.query(sql,values,(err, results, fields) => {
			if (err) {
			  return console.error(err.message);
			}});
	}

}

// 9. Read data from Database
exports.readDb = (req, res, next) =>{

	
	let sql=`SELECT * from`+req.body.table+` where `+req.body.where;
	conn.query(sql,(err, results, fields) => {
		if (err) {
		  return console.error(err.message);
	}});
	res.send({"data":results});

}

