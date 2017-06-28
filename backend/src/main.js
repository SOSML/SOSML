'use strict';

const Hapi = require('hapi');
const cmd = require('node-cmd');

const server = new Hapi.Server();
server.connection({ port: 3000, host: 'localhost' });

server.route({
    method: ['GET', 'POST'],
    path: '/api/fallback/',
    payload: {
      output: 'data',
      parse: true
    },
    handler: function (request, reply) {
        var payload = request.payload.data;

        console.log(payload);

        const ret = new Promise(function (resolve, reject) {
            let dockerrunner = cmd.get(
                'docker run --cpus=1 --memory=128m --rm -i --read-only derjesko/mosmlfallback',
                function(err, data, stderr){
                    resolve(data);
                }
            );
            dockerrunner.stdin.write(payload);
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
