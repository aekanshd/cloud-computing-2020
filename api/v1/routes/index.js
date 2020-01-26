const express = require('express')
const router = express.Router()
const path = require("path")

// Basic Route Demos
// -----------------

let main = require(path.join(__dirname, '/main'))
main(router)

/*---------------------------------
  API Specific 404 / Error Handlers
  ---------------------------------*/

// (404) API not found
router.use((req, res, next) => {
  res.status(404)
  res.send()
})

// Error Handler
router.use((err, req, res, next) => {
  let status = err.status || 500
  res.status(status)
  res.json({
    app: "api",
    status: status,
    error: err.message
  })
})

/*-------
  Exports
  -------*/
module.exports = router