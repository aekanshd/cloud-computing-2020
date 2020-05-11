var express = require("express");
var router = express.Router();
var path = require("path");

// Basic Route Demos
// -----------------

var main = require(path.join(__dirname, "/main"));
main(router);

/*---------------------------------
  API Specific 404 / Error Handlers
  ---------------------------------*/

// API not found
router.use(function (req, res, next) {
  res.status(404);
  res.send();
});

// erorrs handler
router.use(function (err, req, res, next) {
  var status = err.status || 500;
  res.status(status);
  res.json({
    app: "api",
    status: status,
    error: err.message,
  });
});

/*-------
  Exports
  -------*/
module.exports = router;
