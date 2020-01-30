const mysql = require("mysql");
const dbConfig = require("../config/db.config.js");

// Create a connection to the database
const connection = mysql.createConnection({
    host: dbConfig.HOST,
    user: dbConfig.USER,
    password: dbConfig.PASSWORD,
    database: dbConfig.DB
});

// Open the MySQL connection
connection.connect(error => {
    if (error) {
        console.log(error);
        exit(1);
    }
    else console.log("Successfully docked to the database.");
});

module.exports = connection;