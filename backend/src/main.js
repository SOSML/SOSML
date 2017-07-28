'use strict';

const express = require('express');
const cmd = require('node-cmd');
const bodyparser = require('body-parser');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const fs = require('fs');
const crypto = require('crypto');
const RateLimit = require('express-rate-limit');
const bodyParser = require('body-parser')


const server = express();
server.use(helmet())
server.use(compression())
server.use(bodyParser.json({ limit: '5mb' }));
server.use('/static/', express.static('../frontend/build/static'));
// server.use('/share/', express.static('shares'));
// server.use('/code/', express.static('code'));


var callDockerLimiter = new RateLimit({
    windowMs: 10 * 60 * 1000, // 1 hour window
    delayAfter: 10, // begin slowing down responses after the first 10 requests
    delayMs: 100, // slow down subsequent responses by 100 milliseconds per request
    max: 50, // start blocking after 50 requests
    message: "Too many requests made from this IP, please try again in a few minutes"
});

var requestList = [];
var pendingRequests = {};

function evalSMLCode(payload, response) {
    let dockerrunner = cmd.get(
        'docker run --cpus=1 --memory=128m --rm -i --read-only derjesko/mosmlfallback',
        function (err, data, stderr) {
            const last_line = data.split(/\r?\n/).reverse()[1];
            const error_code = parseInt(last_line);
            var error_text = '';
            if (error_code > 0) {
                if (error_code == 124) {
                    error_text = 'SML hit the time limit of 3 seconds.';
                } else {
                    error_text = 'SML exited with ' + error_code;
                }
                data = data.replace(last_line, error_text);
            }
            data = data.split(/\r?\n/).reverse().splice(2).reverse().join("\n");
            response.set('Content-Type', 'text/plain');
            response.end(data);
        }
    );
    dockerrunner.stdin.write(payload);
    dockerrunner.stdin.destroy();
}

function readFile(name, callback) {
    fs.readFile(name, 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        callback(data);
    });
}

function outputFile(name, response) {
    readFile(name, function (data) {
        response.set('Content-Type', 'text/plain');
        response.end(data);
    });
}

function listDir(name, response) {
    fs.readdir(name, function (err, items) {
        response.set('Content-Type', 'text/json');
        response.end(JSON.stringify({codes: items}));
    });
}

server.post('/api/fallback2/', callDockerLimiter,
    function (request, response) {
        const payload = request.body.code;
        evalSMLCode(payload, response);
    }
);

server.get('/api/queue/',
    function (request, response) {
        if(requestList.length > 0){
            var element = requestList.pop();
            const hash = crypto.createHash('md5').update(element.code).digest("base64");
            pendingRequests[hash] = element;
            response.set('Content-Type', 'text/json');
            response.end(JSON.stringify({exist: true, hash: hash, code: element.code}));
        }else{
            response.set('Content-Type', 'text/json');
            response.end(JSON.stringify({exist: false}));
        }
    }
);

server.post('/api/queue/',
    function (request, response) {
        // console.log(request.body);
        const result = request.body.result;
        const hash = request.body.hash;
        console.log("result hash: "+hash);
        // console.log("result: "+result);
        if(hash in pendingRequests){
            var element = pendingRequests[hash];
            element.response.set('Content-Type', 'text/plain');
            element.response.end(result);
            response.set('Content-Type', 'text/json');
            response.end(JSON.stringify({exist: true}));
            delete pendingRequests[hash];
        }else{
            response.set('Content-Type', 'text/json');
            response.end(JSON.stringify({exist: false}));
        }
    }
);

server.post('/api/fallback/', callDockerLimiter,
    function (request, response) {
        var payload = request.body.code;
        requestList.push({
            code: payload,
            response: response
        });
    }
);

server.post('/api/validate/', callDockerLimiter,
    function (request, response) {
        const payload = request.body.code;
        const name = request.body.name;
        readFile("./code/validate/" + name, function (data) {
            evalSMLCode(payload + data, response);
        });
    }
);


server.put('/api/share/', callDockerLimiter,
    function (request, response) {
        const payload = request.body.code;
        const hash = crypto.createHash('md5').update(payload).digest("hex");
        fs.writeFile("./code/shares/" + hash + ".sml", payload, function (err) {
            if (err) {
                return console.log(err);
            }
            console.log("The file was saved!");
            response.set('Content-Type', 'text/plain');
            response.end(hash);
        });
    }
);

server.get('/api/share/:code',
    function (request, response) {
        const code = request.params.code;
        outputFile("./code/shares/" + code + ".sml", response);
    }
);

server.get('/api/tests/',
    function (request, response) {
        listDir('./code/tests/', response);
    }
);

server.get('/tests/:code',
    function (request, response) {
        const code = request.params.code;
        outputFile("./code/tests/" + code + ".sml", response);
    }
);

server.get('/api/list/',
    function (request, response) {
        listDir('./code/examples/', response);
    }
);

server.get('/code/:code',
    function (request, response) {
        const code = request.params.code;
        outputFile("./code/examples/" + code + ".sml", response);
    }
);

server.get('/interpreter.js', function (request, response) {
    response.sendFile(path.resolve('../frontend/build/interpreter.js'));
});

server.get('/logo.png', function (request, response) {
    response.sendFile(path.resolve('../frontend/build/logo.png'));
});

server.get('/favicon.png', function (request, response) {
    response.sendFile(path.resolve('../frontend/build/favicon.png'));
});

server.get('/', function (request, response) {
    response.sendFile(path.resolve('../frontend/build/index.html'));
});

server.use(function (request, response) {
    response.sendFile(path.resolve('../frontend/build/index.html'));
});

server.listen(8000, function () {
    console.log('yay');
});
