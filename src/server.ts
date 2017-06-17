const restify = require('restify');
const random = require('random-js')();
const Promise = require("bluebird");

// import * as restify from 'restify';
const assert = require('assert');
const clients = require('restify-clients');
const CBuffer = require('CBuffer');
const fs = require('fs-extra');

const peerUpPort = 56633;
const maxPeerServices = 100;
const serviceInterval = 5000;
const myServicesFilename = "./my-services.json";
const seedUrl = "http://45.32.186.169";

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

        this.getMyIp().then(()=>{
            if(seedUrl.indexOf(this.myIp)==-1)
                this.addPeerService({"name":"peer-up","version":"1.0.0","url":seedUrl+":"+peerUpPort});
        });
    }


    myServices;
    peerServices;
    server;
    myIp:string;

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
            client.post('/peer-up', {max:'5'},  (err, req, res, obj)=> {
                if(!obj) return;
                if(!obj.services) return;
                console.log("peer server <"+peerUrl+"> returned obj: %j", obj);
                if(obj.services.constructor !== Array) return;
                if(obj.services.length==0) return;
                obj.services.forEach((entry)=>{
                    this.addPeerService(entry);
                });
                this.writePeerServiceToFile();
            });
        }catch(error) {
            console.log("peer:"+peerUrl);
            console.log(""+error);
        }

    }


    addPeerService(service) {
        if(service.url.indexOf("127.0.0.1")!=-1) return;
        if(service.url.indexOf("localhost")!=-1) return;
        if(service.url.length==0) return;
        if(service.name.length==0) return;
        let found=this.isKnownPeerService(service);
        if(!found) {
            console.log("added new peer service: "+JSON.stringify(service));
            this.peerServices.push(service);
        }
    }

    isKnownPeerService(service):boolean {
        let found=false;
        this.peerServices.forEach(function(entry) {
            if(service.url!==entry.url) return;
            if(service.name!==entry.name) return;
            found=true;
        });
        return found;
    }

    getMyIp():Promise<any> {
        return new Promise((resolve, reject)=>{
            const ipfyClient = clients.createJsonClient({url: 'https://api.ipify.org?format=json'});
            ipfyClient.get('',  (err, req, res, obj) => {
                if(err) {
                    reject(err);
                }
                console.log('ipfy: %j', obj);
                this.myIp = obj.ip;
                resolve();
            });

        });
    }

}

const remoteServicesFilename:string = "remote-services.json";


