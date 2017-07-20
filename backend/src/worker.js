'use strict';

var request = require('request');


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
                    data = data.replace(last_line, 'SML exited with ' + error_code);
                }
            }
            data = data.split(/\r?\n/).reverse().splice(2).reverse().join("\n");
            response.set('Content-Type', 'text/plain');
            response.end(data);
        }
    );
    dockerrunner.stdin.write(payload);
    dockerrunner.stdin.destroy();
}


function process() {
    console.log('Looking for a job!');
    request('http://localhost:8000/api/queue', function (error, response, body) {
        if (error !== null) {
            console.log('error:', error); // Print the error if one occurred
            setTimeout(process, 1000);
            return;
        }
        const element = JSON.parse(body);
        if (!element.exist) {
            console.log('No element found…'); // Print the error if one occurred
            setTimeout(process, 1000);
            return;
        }
        console.log('hash:', element.hash); // Print the response status code if a response was received
        request.post({url: 'http://localhost:8000/api/queue/', body: {hash: element.hash, result: element.code}, json: true},
            function (error, response, body) {
                setTimeout(process, 1);
            });

    });

}

console.log('Starting up worker!');
setTimeout(process, 100);

