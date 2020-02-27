module.exports = (router) => {

	var mainController = require('../controllers/mainController')
	// const utils = require('../controllers/utils')
	// var main = "/main"

	// router.get(main+'/path/:param', utils.middleWare, main.finalController)

	router.get('/', mainController.home)
	router.put('/users', mainController.createUser)  //1
	router.delete('/users/:username', mainController.deleteUser)  //2
	router.get('/users', mainController.listUsers) //11
	router.post('/db/write', mainController.writeDb) // 8
	router.post('/db/read', mainController.readDb) // 9
	router.delete('/db/write', mainController.writeDb) //10
	router.post('/db/clear', mainController.clearDb) // 12
}
