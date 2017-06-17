# peer-up
Suit Up! ...no, wait for it: Peer Up! An open, decentralized service for discovery of services


## why?
Even if your goal is to have a decentralised peer to peer network, some server based infrastructure might come handy to help setting up the peer to peer connections. For instance STUN servers to help mobile clients behind NATs to connect to each other.

## how to get going?

- clone from github
```
git clone https://github.com/cofdev0/peer-up.git peer-up
cd peer-up
npm install
cp my-services-example.json my-services.json
vi my-services.json
npm start
```

- or install with npm to use in your own projects

```
npm install peer-up
vi my-services.json
```


## how to use it?
- standalone server
    - after installing, change my-services.json and start the server with ```npm start``` and you are part of the peer-up network!
     - you should see ```peer-services.json``` over time being updated with services other peers offer


- as part of your project 
    - create a my-services.json to publish your own services and use the peer-up server in your project with
    ```
    import {Server as PeerUpServer} from 'peer-up/dist/index';
    const server:PeerUpServer = new PeerUpServer({
        peerUpPort:56633,
        maxPeerServices:100,
        serviceInterval:8000
    });
    server.listen();
    ```
    - now you can receive connection details for all kinds of services by asking the server you started for a peer that offers this service. For instance request a STUN server:
    ```
    const clients = require('restify-clients');
    const client = clients.createJsonClient({
        url: 'http://127.0.0.1:56633',
        version: '~1.0'
    });
    
    client.post('/peer-up', {service:'stun',max:'1'}, function (err, req, res, obj) {
        console.log('Server returned obj: %j', obj);
    }
    ```
    

## how does it work?
The server knows about a few seed peer-up servers to connect to in order to get started. In intervals it requests information about services from randomly selected peer-up servers to build its own list of peer services. The size of this list is limited. Old peer services are constantly being replaced by newly discovered services. Besides this it answers requests from other servers and clients. 

## how to contribute?
Criticism, bug reports, requests, suggestions and especially pull requests implementing these ideas are very welcome! 