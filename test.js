const hello = require('./__javascript__/hello.js');

console.log("Booting…");

var x = 5;
var f = function(y) {
    x = y;
}
var g = function() {
    return x;
}
var h = function() {
    f(hello.solarSystem.greet ());
    hello.solarSystem.explain(g());
}
var load = function() {
    for (var i = 0; i < 1000000; i++) {
        h();
    }
    console.log("fertig");
}
console.log(hello)
console.log(hello.solarSystem)
hello.solarSystem.explain(g());
