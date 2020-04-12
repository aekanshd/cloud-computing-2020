var zookeeper = require('node-zookeeper-client');
 
var client = zookeeper.createClient('zookeeper:2181');
const mainPath = 'dbZoo/election'

client.connect();
client.once('connected', function () {
    console.log('Connected to the server.');
    initialize_zoo(client, (err) => {
        if (err) {
            console.log(err)
            return
        }   
        console.log("Initialized Zookeeper Tree...")
        client.close();
        return
    });
});

function initialize_zoo(client,callback){
    client.create(mainPath,(err)=>{
        if (err) {
            return callback(err)
        }
        client.create(mainPath,(err)=>{
            if (err) {
                return callback(err)
            }
        })
    })
}