var zookeeper = require('node-zookeeper-client');

var client = zookeeper.createClient('localhost:2181');
const mainPath = 'dbZoo/election'

function emit(client, path) {
    logger.log(`(${path}) client id: ${client.client_id}`);
    notifier.emit('createWorker', client);
}

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

function initialize_zoo(client, callback) {
    client.create(mainPath, (err) => {
        if (err) {
            return callback(err)
        }
        client.create(mainPath, (err) => {
            if (err) {
                return callback(err)
            }
        })
    })
}

function createWorkerPath(client, path) {
    const createdPath = client.create(path, '', constants.ZOO_EPHEMERAL | constants.ZOO_SEQUENCE);
    emit(client, createdPath);
}

function createWorker() {
    const client = createClient();

    client.on('connect', () => {
        notifier.emit('connect', `createWorker: session established, id=${client.client_id}`);
        createWorkerPath(client, 'path');
    });

    client.init({});
}
module.exports = {
    createWorker,
};
