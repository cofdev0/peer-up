import {Server as PeerUpServer} from "./server";

// --const server:Server = new Server();
const server:PeerUpServer = new PeerUpServer({
    peerUpPort:56633,
    maxPeerServices:100,
    serviceInterval:8000
});
server.listen();









