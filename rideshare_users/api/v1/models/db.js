const dbConfig = require("../config/db.config.js");
module.exports = {
    'url' : 'mongodb://mongo:27017/'+dbConfig.DB 
};
