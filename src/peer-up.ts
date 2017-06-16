import {Server} from "./server";
const restify = require('restify');
// import * as restify from 'restify';
const assert = require('assert');
const clients = require('restify-clients');
const CBuffer = require('CBuffer');
const fs = require('fs-extra');


const server:Server = new Server();
server.listen();


const ipfyClient = clients.createJsonClient({url: 'https://api.ipify.org?format=json'});
ipfyClient.get('', function (err, req, res, obj) {
    if(err) {
        console.log("error:" + err);
        process.exit(-1);
    }
    console.log('ipfy: %j', obj);
});






