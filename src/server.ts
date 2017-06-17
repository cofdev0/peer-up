const restify = require('restify');
const random = require('random-js')();

// import * as restify from 'restify';
const assert = require('assert');
const clients = require('restify-clients');
const CBuffer = require('CBuffer');
const fs = require('fs-extra');

const peerUpPort = 56633;
const maxPeerServices = 100;
const serviceInterval = 5000;
const myServicesFilename = "./my-services.json";

export class Server {

    constructor() {

        this.server = restify.createServer({
            name: 'peer-up',
            version: '1.0.0'
        });
        this.server.use(restify.plugins.acceptParser(this.server.acceptable));
        this.server.use(restify.plugins.queryParser());
        this.server.use(restify.plugins.bodyParser());
        this.server.post('/peer-up', (req, res, next)=>{this.onPost(req, res, next)});

        if(!fs.existsSync(myServicesFilename)) {
            console.log("please create file with your services '"+myServicesFilename+"' like example file!");
            process.exit(-1);
        }
        this.myServices = JSON.parse(fs.readFileSync(myServicesFilename));
        this.peerServices = CBuffer(maxPeerServices);
        this.readRemoteServicesFromFile();
        this.addPeerService({"name":"peer-up","version":"1.0.0","url":"45.32.186.169:"+peerUpPort});
    }

    myServices;
    peerServices;
    server;

    listen() {
        this.server.listen(peerUpPort,  ()=>{
            console.log('%s listening at %s', this.server.name, this.server.url);
        });
        this.installServiceInterval();
    }

    onPost(req, res, next) {
        // let remote = req.headers['x-forwarded-for']  || req.connection.remoteAddress;
        let remotePeerUp = {
            name:'peer-up',
            version:'1.0.0',
            url:req.connection.remoteAddress+':'+peerUpPort
        };
        this.addPeerService(remotePeerUp);
        this.writePeerServiceToFile();
        console.log("from ip "+req.connection.remoteAddress);
        console.log("received post:\n"+JSON.stringify(req.params));

        let max = req.params.max ? req.params.max : 1;
        let index=0;
        req.params.services = [];

        this.peerServices.forEach(function(entry){
            if(index>=max) return;
            if(req.params.service && entry.name != req.params.service) return;
            req.params.services.push(entry);
            index++;
        });

        this.myServices.services.forEach(function(entry) {
            if(index>=max) return;
            if(req.params.service && entry.name != req.params.service) return;
            req.params.services.push(entry);
            index++;
        });

        req.params.count=index;
        res.send(req.params);
        return next();
    };

    addPeerService(service) {
        let found=false;
        this.peerServices.forEach(function(entry) {
            if(service.url!=entry.url) return;
            if(service.name!=entry.name) return;
            found=true;
        });
        if(service.url.indexOf("127.0.0.1")!=-1) return;
        if(service.url.indexOf("localhost")!=-1) return;
        if(!found) {
            console.log("added new service: "+JSON.stringify(service));
            this.peerServices.push(service);
        }
    }

    writePeerServiceToFile() {
        fs.writeFileSync("remote-services.json", JSON.stringify(this.peerServices.toArray()));
    }

    readRemoteServicesFromFile() {
        if(!fs.existsSync(remoteServicesFilename)) return;
        const remotes = JSON.parse(fs.readFileSync(remoteServicesFilename));
        remotes.forEach((entry)=>{
           this.peerServices.push(entry);
        });
    }

    installServiceInterval() {
        setInterval(()=>{this.onTimeToCheckForServices()}, serviceInterval);
    }

    onTimeToCheckForServices() {

        let peers = [];
        this.peerServices.forEach((entry)=>{
            if(entry.name!="peer-up") return;
            peers.push(entry);
        });
        if(peers.length==0) return;

        const selected = peers.length==1 ? 0 : random(0,peers.length-1);
        this.checkPeerUpService(peers[selected].url);

    }

    checkPeerUpService(peerUrl:string) {
        const client = clients.createJsonClient({
            url: peerUrl,
            version: '~1.0'
        });

        try {
            client.post('/peer-up', {max:'5'}, function (err, req, res, obj) {
                console.log('peer server returned obj: %j', obj);
                this.addPeerService(obj);
            });
        }catch(error) {
            console.log("peer:"+peerUrl);
            console.log(""+error);
        }

    }

}

const remoteServicesFilename:string = "remote-services.json";


