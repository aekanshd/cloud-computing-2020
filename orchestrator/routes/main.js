module.exports = function(router){

	var mainController = require('../controllers/mainController');
	// const utils = require('../controllers/utils');
	// var main = "/main";

	// router.get(main+'/path/:param', utils.middleWare, main.finalController);

	router.get('/', mainController.home);
	router.post('/db/read',mainController.readDb);
	router.post('/db/write',mainController.writeDb);
	router.post('/db/clear',mainController.clearDb);
};