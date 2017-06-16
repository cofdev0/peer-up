

// const Server = require("peer-up");

import {Server} from "./server";

const peerUp = new Server();

describe("peer-up server",() => {

    const remoteService1 = {
        name:"testService1",
        version:"1.0.0",
        url:"someUrl1"
    };
    const remoteService2 = {
        name:"testService2",
        version:"1.0.0",
        url:"someUrl2"
    };

    it("can add unknown remote service",()=>{
        peerUp.addPeerService(remoteService1);
        expect(peerUp.peerServices.length).toBe(1);
    });

    it("can add another unknown remote service",()=>{
        peerUp.addPeerService(remoteService1);
        peerUp.addPeerService(remoteService2);
        expect(peerUp.peerServices.length).toBe(2);
    });

    it("cannot add a known remote service",()=>{
        peerUp.addPeerService(remoteService1);
        peerUp.addPeerService(remoteService2);
        peerUp.addPeerService(remoteService1);
        expect(peerUp.peerServices.length).toBe(2);
    });

});