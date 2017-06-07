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

import * as State from "./state";
// import * as Lexer from "./lexer";
// . . .

/*
 * Map identifier ->
 *      - unique id (int)
 *      - value (string, int, tuple, etc)
 *      - type (SML type)
 */

export class API {
    /* Think of some additional flags n stuff etc */
    static interpret(oldState: State.State, nextInstruction: string): State.State {
        // TODO
        // let tkn = Lexer.lex(nextInstruction);

        // Parser parser = Parser();
        // ast = parser.parse(tkn);
        //
        // Analyzer analyzer = Analyzer();
        // analyzer.analyze(oldState, ast);
        //
        // Interpreter interpreter = Interpreter();
        // let newState = interpreter.interpret(oldState, ast);

        // return newState;
        return oldState;
    }

    static interpretFurther(oldState: State.State, currentPartialInstruction: string,
                            nextInstructionPart: string): [State.State, string] | Error {
        try {
            return [API.interpret(oldState, currentPartialInstruction + nextInstructionPart), ''];
        } catch (e) {
            // if( e instanceof IncompleteCode ) {
            //   return (oldState, currentPartialInstruction + nextInstructionPart);
            // }
            throw e;
        }
    }
}
