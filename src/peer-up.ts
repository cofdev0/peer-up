import {Server} from "./server";

const server:Server = new Server({
    peerUpPort:45627,
    maxPeerServices:100,
    serviceInterval:8000
});
server.listen();









