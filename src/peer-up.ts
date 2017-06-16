var restify = require('restify');
var assert = require('assert');
var clients = require('restify-clients');
const CBuffer = require('CBuffer');
var fs = require('fs-extra');

const maxPeerServices = 100;
const peerServices = CBuffer(maxPeerServices);

var myServices = JSON.parse(fs.readFileSync("./my-services.json"));

// console.log(myServices);

const server = restify.createServer({
    name: 'peer-up',
    version: '1.0.0'
});
server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());


server.post('/peer-up', function (req, res, next) {
    console.log("received post:\n"+JSON.stringify(req.params));
    let max = req.params.max ? req.params.max : 1;
    let index=0;
    req.params.services = [];

    peerServices.forEach(function(entry){
        if(index>=max) return;
        if(req.params.service && entry.name != req.params.service) return;
        req.params.services.push(entry);
        index++;
    });

    myServices.services.forEach(function(entry) {
        if(index>=max) return;
        if(req.params.service && entry.name != req.params.service) return;
        req.params.services.push(entry);
        index++;
    });

    req.params.count=index;
    res.send(req.params);
    return next();
});

server.listen(56633, function () {
    console.log('%s listening at %s', server.name, server.url);
});


// var ipfyClient = clients.createJsonClient({url: 'https://api.ipify.org?format=json'});
// ipfyClient.get('', function (err, req, res, obj) {
//     if(err) {
//         console.log("error:" + err);
//         process.exit(-1);
//     }
//     console.log('ipfy: %j', obj);
// });

