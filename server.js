var express = require('express')
const path = require('path')
const fs = require('fs')
const port = process.env.PORT || 80
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')

/*--------------------
  Initialize Express
  --------------------*/
var app = express()

/*-----------------------
  Parse request content
  -----------------------*/
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cookieParser())
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
})

/*--------
  Routes
  --------*/

// Index API Route
app.get('/', (req, res) => {
  var api_routes = ""
  api_routes += "GET /" + "<br>"
  api_routes += "GET /api" + "<br>"
  res.send('Available APIs:<br><br>' + api_routes)
})

// API routes
app.use('/api/v1', require('./api/v1/routes/index'))

/*---------------
  Server startup
  ---------------*/

var server = require('http').createServer(app)
server.listen(port, () => {
  let host = server.address().address
  let port = server.address().port
  console.log("Server is up and running at http://%s:%s", host, port)
})