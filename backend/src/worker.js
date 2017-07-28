'use strict';

const request = require('request');
const cmd = require('node-cmd');


function evalSMLCode(payload, callback) {
    let dockerrunner = cmd.get(
        'docker run --cpus=1 --memory=128m --rm -i --read-only derjesko/mosmlfallback',
        function (err, data, stderr) {
            const last_line = data.split(/\r?\n/).reverse()[1];
            const error_code = parseInt(last_line.replace('- ',''));
            var error_text = '';
            if (error_code > 0) {
                if (error_code == 124) {
                    error_text = 'SML hit the time limit of 3 seconds.';
                } else {
                    error_text = 'SML exited with ' + error_code;
                }
            }
            console.log('Docker eval got: "'+last_line+'" "'+error_code+'" and "'+error_text+'"');
            data = data.split(/\r?\n/).reverse().splice(2).reverse().join("\n");
            callback(data + "\n" + error_text);
        }
    );
    dockerrunner.stdin.write(payload);
    dockerrunner.stdin.destroy();
}


function process() {
    // console.log('Looking for a job!');
    request('http://localhost:8000/api/queue', function (error, response, body) {
        if (error !== null) {
            console.log('error:', error); // Print the error if one occurred
            setTimeout(process, 1000);
            return;
        }
        const element = JSON.parse(body);
        if (!element.exist) {
            // console.log('No element found…'); // Print the error if one occurred
            setTimeout(process, 1000);
            return;
        }
        console.log('result hash:', element.hash); // Print the response status code if a response was received
        evalSMLCode(element.code, function (result) {
            request.post({
                    url: 'http://localhost:8000/api/queue/',
                    body: {hash: element.hash, result: result},
                    json: true
                },
                function (error, response, body) {
                    setTimeout(process, 1);
                });
        });
    });

}

console.log('Starting up worker!');
setTimeout(process, 100);
