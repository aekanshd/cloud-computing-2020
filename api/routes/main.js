module.exports = function(router){

	var mainController = require('../controllers/mainController');
	// const utils = require('../controllers/utils');
	// var main = "/main";

	// router.get(main+'/path/:param', utils.middleWare, main.finalController);

	router.get('/', mainController.home);
};