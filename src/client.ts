const clients = require('restify-clients');
const client = clients.createJsonClient({
    url: 'http://127.0.0.1:56633',
    version: '~1.0'
});

client.post('/peer-up', {service:'stun',max:'1'}, function (err, req, res, obj) {
    console.log('Server returned obj: %j', obj);
});