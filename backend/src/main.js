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
// server.use('/share/', express.static('shares'));
// server.use('/code/', express.static('code'));
server.get('/', function (request, response) {
    response.sendFile(path.resolve('../frontend/build/index.html'));
});


server.post('/api/fallback/',
    function (request, response) {
        var payload = request.body.code;

        let dockerrunner = cmd.get(
            'docker run --cpus=1 --memory=128m --rm -i --read-only derjesko/mosmlfallback',
            function(err, data, stderr){
                var last_line = data.split(/\r?\n/).pop();
                var error_code = parseInt(last_line.substring(2));
                error_text = '';
                if(error_code > 0){
                    if(error_code == 124){
                        error_text = 'SML hit the time limit of 3 seconds.';
                    }else {
                        data = data.replace(last_line, 'SML exited with ' + error_code);
                    }
                }
                data = data.replace(last_line, error_text);
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

server.get('/share/:code',
    function (request, response) {
        var code = request.params.code;
        fs.readFile("./shares/"+code+".sml", 'utf8', function(err, data) {
            if(err) {
                return console.log(err);
            }
            response.set('Content-Type', 'text/plain');
            response.end(data);
        });
    }
);

server.get('/api/list/',
    function (request, response) {
        fs.readdir('./code/', function(err, items) {
            response.set('Content-Type', 'text/json');
            response.end(JSON.stringify({codes: items}));
        });
    }
);

server.get('/code/:code',
    function (request, response) {
        var code = request.params.code;
        fs.readFile("./code/"+code, 'utf8', function(err, data) {
            if(err) {
                return console.log(err);
            }
            response.set('Content-Type', 'text/plain');
            response.end(data);
        });
    }
);

server.listen(80, () => {console.log('yay');} );
