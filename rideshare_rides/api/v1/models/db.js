const dbConfig = require("../config/db.config.js");
module.exports = {
    'url' : 'mongodb://mongo:27018'+dbConfig.DB 
};
