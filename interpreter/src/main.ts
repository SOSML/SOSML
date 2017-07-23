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

import { State } from './state';
import { getInitialState } from './initialState';
import * as Lexer from './lexer';
import * as Parser from './parser';
import { Settings } from './settings';
import { Value } from './values';

export class Interpreter {
    /* Think of some additional flags n stuff etc */
    static interpret(nextInstruction: string,
                     oldState: State = getInitialState()): [State, boolean, Value|undefined] {
        let state = oldState.getNestedState();

        let tkn = Lexer.lex(nextInstruction);
        let ast = Parser.parse(tkn, state);

        state = oldState.getNestedState();
        ast = ast.simplify();
        state = ast.elaborate(state);

        // Use a fresh state to be able to piece types and values together
        let res = ast.evaluate(oldState.getNestedState(true));

        // TODO Come up with some algorithm to combine types and values
        return res;
    }

    constructor(public settings: Settings) {}
}
