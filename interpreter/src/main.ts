/*

This file is the main entry point for the interpreter.
It should only contain logic required to provide the API to the frontend (backend).
All required modules should be included at the top, for example if the main interpreter class
is located in the file interpreter.ts:

import Interpreter = require("./interpreter");
// Do stuff with Interpreter
let instance = new Interpreter();
let AST = instance.lexParse(..code..);
...

*/

/*

To export the API of the interpreter, use the TypeScript "export = " statement.
For example to export an object with two methods, one could write:
export = {
    "run": function(code) {
        // ...
    },
    "createAST": otherFunction
};

*/
export = class API {
    static dummy(str: string): string {
        return str + '!!';
    }
};
