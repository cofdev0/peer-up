import {Server} from "./server";

// --const server:Server = new Server();
const server:Server = new Server({
    peerUpPort:56633,
    maxPeerServices:100,
    serviceInterval:8000
});
server.listen();









