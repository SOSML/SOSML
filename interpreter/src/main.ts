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
import { addStdLib } from './stdlib';
import * as Lexer from './lexer';
import * as Parser from './parser';
import { Settings } from './settings';
import { Value } from './values';

export class Interpreter {
    /* Think of some additional flags n stuff etc */
    static interpret(nextInstruction: string,
                     oldState: State = getInitialState(),
                     allowLongFunctionNames: boolean = false): [State, boolean, Value|undefined] {
        let state = oldState.getNestedState();

        let tkn = Lexer.lex(nextInstruction);

        if (allowLongFunctionNames) {
            // this is only a replacement until we have the module language,
            // so we can implement all testcases from the book
            // TODO remove
            let newTkn: Lexer.Token[] = [];
            for (let t of tkn) {
                if (t instanceof Lexer.LongIdentifierToken) {
                    newTkn.push(new Lexer.IdentifierToken(t.getText(), t.position));
                } else {
                    newTkn.push(t);
                }
            }
            tkn = newTkn;
        }

        let ast = Parser.parse(tkn, state);

        state = oldState.getNestedState();
        ast = ast.simplify();
        state = ast.elaborate(state);

        // Use a fresh state to be able to piece types and values together
        let res = ast.evaluate(oldState.getNestedState());

        if (res[1]) {
        return res;
        }

        let curState = res[0];

        while (curState.id > oldState.id) {
            if (curState.dynamicBasis !== undefined) {
                // For every new bound value, try to find its type
                for (let i in curState.dynamicBasis.valueEnvironment) {
                    if (Object.prototype.hasOwnProperty.call(
                        curState.dynamicBasis.valueEnvironment, i)) {

                        let tp = state.getStaticValue(i, curState.id);
                        if (tp !== undefined) {
                            curState.setStaticValue(i, tp);
                        }
                    }
                }

                // For every new bound type, try to find its type
                for (let i in curState.dynamicBasis.typeEnvironment) {
                    if (Object.prototype.hasOwnProperty.call(
                        curState.dynamicBasis.typeEnvironment, i)) {

                        let tp = state.getStaticType(i, curState.id);
                        if (tp !== undefined) {
                            curState.setStaticType(i, tp.type, tp.constructors);
                        }
                    }
                }
            }
            if (state.parent === undefined) {
                break;
            }
            curState = <State> curState.parent;
            while (state.id > curState.id && state.parent !== undefined) {
                state = <State> state.parent;
            }
        }

        return res;
    }

    static getFirstState(withStdLib: boolean): State {
        if (withStdLib) {
            return addStdLib(getInitialState());
        }
        return getInitialState();
    }

    constructor(public settings: Settings) {}
}

