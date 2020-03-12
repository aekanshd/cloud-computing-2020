module.exports = (router) => {

	var mainController = require('../controllers/mainController')
	// const utils = require('../controllers/utils')
	// var main = "/main"

	// router.get(main+'/path/:param', utils.middleWare, main.finalController)
	router.use('/rides*', mainController.requestsCountIncrement)
	router.get('/_count',mainController.getRequestsCount)
	router.get('/', mainController.home)
	router.post('/rides', mainController.createRide) // 3
	router.get('/rides', mainController.listRides) // 4
	router.get('/rides/:rideId([a-zA-Z0-9]{24})', mainController.getRide) // 5
	router.post('/rides/:rideId', mainController.joinRide) // 6
	router.delete('/rides/:rideId', mainController.deleteRide) // 7
	router.post('/db/write', mainController.writeDb) // 8
	router.post('/db/read', mainController.readDb) // 9
	router.delete('/db/write', mainController.writeDb) //10
	router.post('/db/clear', mainController.clearDb) // 12
	router.get('/rides/count',mainController.count)
}
