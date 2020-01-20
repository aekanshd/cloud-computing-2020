var express = require('express');
const path = require('path');
const fs = require('fs');	
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

/*--------------------
  Initialize express
  --------------------*/
var app = express()

/*-----------------------
  Parse request content
  -----------------------*/
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(cookieParser());

/*--------
  Routes
  --------*/

// Index API Route
app.get('/', function (req, res) {
	var api_routes = "";
	api_routes += "GET /" + "<br>";
	api_routes += "GET /api" + "<br>";
	res.send('Available APIs:<br><br>' + api_routes);
}); 

// API routes
app.use('/api', require('./api/routes/index'));

/*---------------
  Server startup
  ---------------*/

var server = require('http').createServer(app);
server.listen(8000); 