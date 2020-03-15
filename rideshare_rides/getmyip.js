const getIP = require('external-ip')();
 
let  ip = '';
getIP((err, ip) => {
    if (err) {
        // every service in the list has failed
        throw err;
    }
    console.log(ip);
});