const restify = require('restify');
const random = require('random-js')();
const Promise = require("bluebird");

// import * as restify from 'restify';
const assert = require('assert');
const clients = require('restify-clients');
const CBuffer = require('CBuffer');
const fs = require('fs-extra');

const defaultPeerUpPort = 56633;
const defaultMaxPeerServices = 100;
const defaultServiceInterval = 8000;
const myServicesFilename:string = "./my-services.json";
const peerServicesFilename:string = "./peer-services.json";
const seedUrl:string = "http://45.32.186.169:"+defaultPeerUpPort;
const postPeerUpKey:string = "peer-up-url";

export class Server {

    constructor(config={
        peerUpPort:defaultPeerUpPort,
        maxPeerServices:defaultMaxPeerServices,
        serviceInterval:defaultServiceInterval
    }) {

        this.peerUpPort=config.peerUpPort || defaultPeerUpPort;
        this.maxPeerServices=config.maxPeerServices || defaultMaxPeerServices;
        this.serviceInterval=config.serviceInterval || defaultServiceInterval;
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
        this.peerServices = CBuffer(this.maxPeerServices);
        this.readRemoteServicesFromFile();

        this.getMyIp().then(()=>{
            if(!this.amISeed()) {
                this.addPeerService({"name":"peer-up","version":"1.0.0","url":seedUrl});
                this.onTimeToCheckForServices();
            }
        }).catch((err)=>{
            console.log(err);
            process.exit(-1);
        });
    }

    amISeed():boolean {
        return (seedUrl.indexOf(this.myIp)!=-1);
    }

    serviceInterval;
    maxPeerServices;
    peerUpPort;
    myServices;
    peerServices;
    server;
    myIp:string;

    listen() {
        this.server.listen(this.peerUpPort,  ()=>{
            console.log('%s listening at %s', this.server.name, this.server.url);
        });
        this.installServiceInterval();
    }

    onPost(req, res, next) {
        // let remote = req.headers['x-forwarded-for']  || req.connection.remoteAddress;

        //console.log("from ip "+req.connection.remoteAddress);
        //console.log("received post:\n"+JSON.stringify(req.params));

        if(req.params[postPeerUpKey]) {
            this.addPeerUpFromIncomingPost(req.params[postPeerUpKey]);
        }

        const selection = this.createSelectionByName(req.params);
        Server.pushRandomly(selection, req.params);
        res.send(req.params);
        return next();
    };

    static pushRandomly(selection, params) {
        let max = params.max ? params.max : 1;
        params.services = [];
        for(let i=0; i<max; i++) {
            let index=random.integer(0,selection.length-1);
            params.services.push(selection[index]);
        }
    }

    createSelectionByName(params):any {
        let selection = [];
        this.myServices.services.forEach(function(entry) {
            if(params.service && entry.name != params.service) return;
            selection.push(entry);
        });

        this.peerServices.forEach(function(entry){
            if(params.service && entry.name != params.service) return;
            selection.push(entry);
        });
        return selection;
    }

    addPeerUpFromIncomingPost(peerUpUrl:string) {
        let remotePeerUp = {
            name:'peer-up',
            version:'1.0.0',
            url:peerUpUrl
        };
        if(this.isKnownPeerService(remotePeerUp)) return;
        this.addPeerService(remotePeerUp);
        this.writePeerServiceToFile();
    }

    writePeerServiceToFile() {
        fs.writeFileSync(peerServicesFilename, JSON.stringify(this.peerServices.toArray()));
    }

    readRemoteServicesFromFile() {
        if(!fs.existsSync(remoteServicesFilename)) return;
        const remotes = JSON.parse(fs.readFileSync(remoteServicesFilename));
        remotes.forEach((entry)=>{
           this.peerServices.push(entry);
        });
    }

    installServiceInterval() {
        setInterval(()=>{this.onTimeToCheckForServices()}, this.serviceInterval);
    }

    onTimeToCheckForServices() {

        let peers = [];
        this.peerServices.forEach((entry)=>{
            if(entry.name!="peer-up") return;
            peers.push(entry);
        });
        if(peers.length==0) return;

        const selected = peers.length==1 ? 0 : random.integer(0,peers.length-1);
        this.checkPeerUpService(peers[selected].url);
    }

    checkPeerUpService(peerUrl:string) {
        const client = clients.createJsonClient({
            url: peerUrl,
            version: '~1.0'
        });

        try {
            client.post('/peer-up', {max:'3',[postPeerUpKey]:this.getMyPeerUpUrl()},  (err, req, res, obj)=> {
                if(!obj) return;
                if(!obj.services) return;
                //console.log("peer server <"+peerUrl+"> returned obj: %j", obj);
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

    getMyPeerUpUrl():string {
        return "http://"+this.myIp+":"+this.peerUpPort;
    }

    addPeerService(service) {
        if(service.url.indexOf("127.0.0.1")!=-1) return;
        if(service.url.indexOf("localhost")!=-1) return;
        if(service.url.length==0) return;
        if(service.name.length==0) return;
        if((service.name!=="peer-up") && this.amISeed()) return;
        if(this.isMyService(service)) return;
        if(this.isKnownPeerService(service)) return;

        this.peerServices.push(service);
        //console.log("added new peer service: "+JSON.stringify(service));
    }

    isKnownPeerService(service):boolean {
        let found=false;
        this.peerServices.forEach(function(entry) {
            if(service.url!==entry.url) return;
            if(service.name!==entry.name) return;
            //todo: version check
            found=true;
        });
        return found;
    }

    isMyService(service):boolean {
        if(service.url===this.getMyPeerUpUrl()) return true;
        let found=false;
        this.myServices.services.forEach(function(entry){
            if(service.url!==entry.url) return;
            if(service.name!==entry.name) return;
            //todo: version check
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


