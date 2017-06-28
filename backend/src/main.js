'use strict';

const express = require('express');
const cmd = require('node-cmd');
const bodyparser = require('body-parser');
const path = require('path');

const server = express();
server.use(bodyparser.json());
server.use('/static/', express.static('frontend/static'));
server.get('/', function (request, response) {
    response.sendFile(path.resolve(__dirname+'/../frontend/index.html'));
});

server.post('/api/fallback/',
    function (request, response) {
        var payload = request.body.data;

        console.log(payload);

        let dockerrunner = cmd.get(
            'docker run --cpus=1 --memory=128m --rm -i --read-only derjesko/mosmlfallback',
            function(err, data, stderr){
                response.set('Content-Type', 'text/plain');
                response.end(data);
            }
        );
        dockerrunner.stdin.write(payload);
    }
);

server.listen(3000, () => {console.log('yay');} )
