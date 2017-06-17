const assert = require('assert');
const clients = require('restify-clients');
const client = clients.createJsonClient({

    // url: 'http://45.32.186.169:56633',
    url: 'http://127.0.0.1:56633',
    version: '~1.0'
});

client.post('/peer-up', {service:'stun',max:'1'}, function (err, req, res, obj) {
    // assert.ifError(err);
    console.log('Server returned obj: %j', obj);
});