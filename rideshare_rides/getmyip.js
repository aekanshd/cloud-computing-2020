const getIP = require('external-ip')();
 
let  ip = '';
getIP((err, ip) => {
    if (err) {
        console.log(err);
    }
    console.log(ip);
});