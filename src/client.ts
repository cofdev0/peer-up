var assert = require('assert');
var clients = require('restify-clients');

var client = clients.createJsonClient({

    // url: 'http://45.32.186.169:56633',
    url: 'http://127.0.0.1:56633',
    version: '~1.0'
});

client.post('/peer-up', {service:'peer-up',max:'3'}, function (err, req, res, obj) {
    // assert.ifError(err);
    console.log('Server returned obj: %j', obj);
});