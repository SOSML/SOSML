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

import State        = require('./state');
import * as Lexer from "./lexer";
// . . .

/*
 * Map identifier ->
 *      - unique id (int)
 *      - value (string, int, tuple, etc)
 *      - type (SML type)
 */
export type State = Map<string,(int, any, any)>;

export class API {
    /* Think of some additional flags n stuff etc */
    static interpret(oldState : State, nextInstruction : string) : State {
        // TODO
        Lexer lexer = Lexer();
        tkn = lexer.lex(nextInstruction);

        // Parser parser = Parser();
        // ast = parser.parse(tkn);
        //
        // Analyzer analyzer = Analyzer();
        // analyzer.analyze(oldState, ast);
        //
        // Interpreter interpreter = Interpreter();
        // let newState = interpreter.interpret(oldState, ast);

        // return newState;
        return State;
    }

    static interpret(oldState : State, currentPartialInstruction : string, nextInstructionPart : string) : (State,string) | Error {
        try {
            return (interpret(oldState, currentPartialInstruction + nextInstructionPart), "");
        } catch( e ) {
            //if( e instanceof IncompleteCode ) {
            //  return (oldState, currentPartialInstruction + nextInstructionPart);
            //}
            throw e;
        }
    }
};
