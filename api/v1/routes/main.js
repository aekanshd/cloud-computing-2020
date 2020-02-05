module.exports = (router) => {

	var mainController = require('../controllers/mainController')
	// const utils = require('../controllers/utils')
	// var main = "/main"

	// router.get(main+'/path/:param', utils.middleWare, main.finalController)

	router.get('/', mainController.home)
	router.put('/users', mainController.createUser)  //1
	router.delete('/users/:username', mainController.deleteUser)  //2
	router.post('/rides', mainController.createRide) // 3
	router.get('/rides', mainController.listRides) // 4
	router.get('/rides/:rideId', mainController.getRide) // 5
	router.post('/rides/:rideId', mainController.joinRide) // 6
	router.delete('/rides/:rideId', mainController.deleteRide) // 7
	router.post('/db/write', mainController.writeDb) // 8
	router.post('/db/read', mainController.readDb) // 9
}