'use strict';

const Hapi = require('hapi');
const cmd = require('node-cmd');

const server = new Hapi.Server();
server.connection({ port: 3000, host: 'localhost' });

server.route({
    method: ['GET', 'POST'],
    path: '/',
    handler: function (request, reply) {
        var payload = request.payload;

        console.log(payload);

        const ret = new Promise(function (resolve, reject) {
            cmd.get(
                'pwd',
                function(err, data, stderr){
                    resolve('the current working dir is : '+ data);
                }
            );
        });

        reply(ret).code(200);
    }
});

server.start((err) => {

    if (err) {
        throw err;
    }
    console.log(`Server running at: ${server.info.uri}`);
});