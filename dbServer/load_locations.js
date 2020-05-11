const csv = require('csv-parser');
const fs = require('fs');
const mongoClient = require('mongodb').MongoClient
const dbName = "rideshare"
record_count = 0
mongo_host = process.env.DB_HOST
mongoClient.connect('mongodb://'+mongo_host+':27017', function(err, db) {
	if(err){
		console.error(err.message)
		return err
	}
	console.log("Connected to database")
	dbo=db.db(dbName)
	fs.createReadStream('AreaNameEnum.csv')
	.pipe(csv())
	.on('data', (row) => {
		// console.log(row);
		data = {"locationid":parseInt(row['locationid']),"name":row['name']}
		dbo.collection("locations").insertOne(data,function(err, db_out){
		if(err){
				console.error(err.message)
				return err;
			}
			record_count+=1
			console.log("Data Inserted : " + record_count);
		})
	})
	.on('end', () => {
		console.log('CSV file successfully processed');
		console.log('Records Inserted: ', record_count)
		db.close();	
	});
})
