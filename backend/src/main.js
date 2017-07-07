'use strict';

const express = require('express');
const cmd = require('node-cmd');
const bodyparser = require('body-parser');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const fs = require('fs');
const crypto = require('crypto');


const server = express();
server.use(helmet())
server.use(compression())
server.use(bodyparser.json());
server.use('/static/', express.static('../frontend/build/static'));
server.use('/share/', express.static(path.join(__dirname, 'shares')));
server.get('/', function (request, response) {
    response.sendFile(path.resolve('../frontend/build/index.html'));
});


server.post('/api/fallback/',
    function (request, response) {
        var payload = request.body.code;

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

server.put('/api/share/',
    function (request, response) {
        var payload = request.body.code;
        const hash = crypto.createHash('md5').update(payload).digest("base64");
        fs.writeFile("./shares/"+hash+".sml", payload, function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("The file was saved!");
            response.set('Content-Type', 'text/plain');
            response.end(hash);
        });
    }
);

server.listen(80, () => {console.log('yay');} )
