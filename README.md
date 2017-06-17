# peer-up
Suit Up! ...no, wait for it: Peer Up! An open, decentralized service for discovery of services


## why?
Even if your goal is to have a decentralised peer to peer network, some server based infrastructure might come handy to help setting up the peer to peer connections. For instance STUN servers to help mobile clients behind NATs to connect to each other.

## installation and setup

clone from github
```
git clone https://github.com/cofdev0/peer-up.git peer-up
cd peer-up
npm install
cp my-services-example.json my-services.json
vi my-services.json
npm start
```

or install with npm to use in your own projects

```
npm install peer-up
vi my-services.json
```


## how to use it?
- standalone server
    - after installing, changing my-services.json and starting the server with ```npm start``` you are all set! 


- as part of your project 
    - check ```src/client.ts``` to see how to request from a server the connection details you need to connect to some service another peer offers.


## how does it work?
The server knows about a few seed peer-up servers to connect to in order to get started. In intervals it requests information about services from randomly selected peer-up servers to build its own list of peer services. The size of this list is limited. Old peer services are constantly being replaced by newly discovered services. Besides this it answers requests from other servers and clients. 

## how to contribute?
Criticism, bug reports, requests, suggestions and especially pull requests implementing these ideas are very welcome! 