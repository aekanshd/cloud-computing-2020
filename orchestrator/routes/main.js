module.exports = function(router){

	var mainController = require('../controllers/mainController');
	var scaler = require('../controllers/scaleManager');
	router.get('/', mainController.home);
	router.post('/db/read',scaler.updateRequests,mainController.readDb);
	router.post('/db/write',mainController.writeDb);
	router.post('/db/clear',mainController.clearDb);
	router.get('/worker/list',mainController.workerList);
};
