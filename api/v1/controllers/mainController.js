var path = require('path');
var fs = require('fs');

exports.home = function(req, res, next){
	res.send("Hello World!");
};

exports.createUser = function(req, res, next){
	var username = req.body.username;
	var password = req.body.password;

	var hexadecimals = /[0-9A-Fa-f]{6}/g;
	if(hexadecimals.test(password)){
		console.log(password);
	}
	else{
		console.log("invalid password");
	}
	console.log(username, password);
	return res.status(201).send({});
};