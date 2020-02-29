const csv = require('csv-parser');
const fs = require('fs');
const mongoClient = require('mongodb').MongoClient

mongoClient.connect('mongodb://mongodb_rides:27017', function(err, db) {
		if(err){
			console.error(err.message)
			return res.status(400).send(err)
		}
		dbo=db.db("rideshare_rides")
		fs.createReadStream('AreaNameEnum.csv')
		.pipe(csv())
		.on('data', (row) => {
			// console.log(row);
			data = {"locationid":parseInt(row['locationid']),"name":row['name']}
			dbo.collection("locations").insertOne(data,function(err, db_out){
			if(err){
					console.error(err.message)
					return 0;
				}
				console.log("Data Inserted");
				return
			})
		})
		.on('end', () => {
		console.log('CSV file successfully processed');
		});
	})
