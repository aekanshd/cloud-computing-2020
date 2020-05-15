module.exports = function (router) {
	var mainController = require('../controllers/mainController2');
	var scaler = require('../controllers/scaleManager');
	router.use('/db/read', scaler.updateRequests);
	router.get('/', mainController.home);
	// router.get("/db/readData", mainController.readData);
	router.post('/db/read', mainController.readDb);
	router.post('/db/write', mainController.writeDb);
	router.post('/db/clear', mainController.clearDb);
	router.post('/crash/master', scaler.crashMaster);
	router.post('/crash/slave', scaler.crashSlave);
	router.get('/worker/list', scaler.workerList);
};
