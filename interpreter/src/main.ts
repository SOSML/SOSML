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

import { getInitialState, State } from './state';
import * as Lexer from './lexer';
import { Parser } from './parser';
import { Settings } from './settings';

export class Interpreter {
    /* Think of some additional flags n stuff etc */
    static interpret(nextInstruction: string, oldState: State = getInitialState()): State {
        // TODO
        let state = oldState.getNestedState();
        let tkn = Lexer.lex(nextInstruction);

        let parser = new Parser(tkn, state);
        let ast = parser.parseDeclaration();

        state = oldState.getNestedState();
        ast.simplify();
        ast.checkStaticSemantics(state);
        ast.evaluate(state);

        return state;
    }

    /*static interpretFurther(oldState: State, currentPartialInstruction: string,
                            nextInstructionPart: string): [State, string] | Error {
        try {
            return [API.interpret(oldState, currentPartialInstruction + nextInstructionPart), ''];
        } catch (e) {
            // if( e instanceof IncompleteCode ) {
            //   return (oldState, currentPartialInstruction + nextInstructionPart);
            // }
            throw e;
        }
    }*/

    constructor(public settings: Settings) {}
}
