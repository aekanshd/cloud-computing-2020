var path = require('path');
var fs = require('fs');

exports.home = function(req, res, next){
	res.send("Hello World!");
};	