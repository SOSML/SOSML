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
import { Token, IdentifierToken, LongIdentifierToken } from './tokens';
import * as Lexer from './lexer';
import * as Parser from './parser';

export function interpret(nextInstruction: string,
                          oldState: State = getInitialState(),
                          options: { [name: string]: any } = {
                              'allowLongFunctionNames': false,
                              'allowUnicodeInStrings': false
                          }): { [name: string]: any } {
    let state = oldState.getNestedState();

    let tkn = Lexer.lex(nextInstruction, options);

    if (options['allowLongFunctionNames']) {
        let newTkn: Token[] = [];
        for (let t of tkn) {
            if (t instanceof LongIdentifierToken) {
                newTkn.push(new IdentifierToken(t.getText(), t.position));
            } else {
                newTkn.push(t);
            }
        }
        tkn = newTkn;
    }

    let ast = Parser.parse(tkn, state, options);

    state = oldState.getNestedState();
    ast = ast.simplify();
    let elab = ast.elaborate(state /* , options */);
    state = elab[0];

    // Use a fresh state to be able to piece types and values together
    let res = ast.evaluate(oldState.getNestedState() /* , options */);

    for (let i = 0; i < elab[1].length; ++i) {
        res[3].push(elab[1][i]);
    }

    if (res[1]) {
        return {
            'state':                res[0],
            'evaluarionErrored':    true,
            'error':                res[2],
            'warnings':             res[3]
        };
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
                        curState.setStaticValue(i, tp[0], tp[1]);
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

    return {
        'state':                res[0],
        'evaluarionErrored':    false,
        'error':                res[2],
        'warnings':             res[3]
    };
}

export function getFirstState(withStdLib: boolean): State {
    if (withStdLib) {
        return addStdLib(getInitialState(), {
            'allowLongFunctionNames': true
        });
    }
    return getInitialState();
}

