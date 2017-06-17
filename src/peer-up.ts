import {Server} from "./server";
const restify = require('restify');
// import * as restify from 'restify';
const assert = require('assert');
const clients = require('restify-clients');
const CBuffer = require('CBuffer');
const fs = require('fs-extra');


const server:Server = new Server();
server.listen();









