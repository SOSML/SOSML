'use strict';

const Hapi = require('hapi');

const server = new Hapi.Server();
server.connection({ port: 3000, host: 'localhost' });

server.route({
    method: ['GET', 'POST'],
    path: '/',
    handler: function (request, reply) {
        var payload = request.payload

        console.log(payload)

        reply(payload)
    }
});

server.start((err) => {

    if (err) {
        throw err;
    }
    console.log(`Server running at: ${server.info.uri}`);
});