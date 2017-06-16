var assert = require('assert');
var clients = require('restify-clients');

var client = clients.createJsonClient({

    url: 'http://localhost:56633',

});


var client = clients.createJsonClient({

    url: 'http://localhost:56633',
    version: '~1.0'
});

client.post('/peer-up', {service:'peer-up',max:'3'}, function (err, req, res, obj) {
    // assert.ifError(err);
    console.log('Server returned: %j', obj);
});