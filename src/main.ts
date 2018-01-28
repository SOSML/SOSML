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
import { loadModule, STDLIB } from './stdlib';
import { Warning, InternalInterpreterError } from './errors';
import { Type } from './types';
import * as Lexer from './lexer';
import * as Parser from './parser';
import * as Evaluator from './evaluator';
import { Integer } from './values';

export function interpret(nextInstruction: string,
                          oldState: State = getInitialState(),
                          options: { [name: string]: any } = {
                              'allowUnicodeInStrings': false,
                              'allowSuccessorML': false,
                              'disableElaboration': false,
                              'strictMode': true
                          }): { [name: string]: any } {
    let state = oldState.getNestedState();

    let tkn = Lexer.lex(nextInstruction, options);

    let ast = Parser.parse(tkn, state, options);

    state = oldState.getNestedState();
    ast = ast.simplify();

    if (options.disableElaboration === true) {
        let tmp = Evaluator.evaluate(oldState.getNestedState(), ast /* , options */);
        if (tmp === undefined) {
            throw new InternalInterpreterError(-1, 'How is this undefined?');
        }
        return {
            'state':                tmp.newState,
            'evaluationErrored':    tmp.hasThrown,
            'error':                tmp.value,
            'warnings':             (<State> tmp.newState).getWarnings()
        };
    }

    let elab = ast.elaborate(state, new Map<string, [Type, boolean]>(), '\'*t0', true, options);
    state = elab[0];

    // Use a fresh state to be able to piece types and values together
    let res = Evaluator.evaluate(oldState.getNestedState(), ast /* , options */);
    if (res === undefined) {
        throw new InternalInterpreterError(-1, 'How is this undefined?');
    }

    for (let i = 0; i < elab[1].length; ++i) {
        (<State> res.newState).addWarning(elab[1][i]);
    }

    if (res.hasThrown) {
        return {
            'state':                res.newState,
            'evaluationErrored':    true,
            'error':                res.value,
            'warnings':             (<State> res.newState).getWarnings()
        };
    }

    let curState = <State> res.newState;

    while (curState.id > oldState.id) {
        if (curState.dynamicBasis !== undefined) {
            curState.freeTypeVariables = state.getTypeVariableBinds(curState.id);

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
                        curState.setStaticType(i, tp.type, tp.constructors, tp.arity);
                    }
                }
            }

            // For every new bound structure, try to find its type
            for (let i in curState.dynamicBasis.structureEnvironment) {
                if (Object.prototype.hasOwnProperty.call(
                    curState.dynamicBasis.structureEnvironment, i)) {

                    let tp = state.getStaticStructure(i, curState.id);
                    if (tp !== undefined) {
                        curState.setStaticStructure(i, tp);
                    }
                }
            }

            // For every new bound signature, try to find its type
            for (let i in curState.dynamicBasis.signatureEnvironment) {
                if (Object.prototype.hasOwnProperty.call(
                    curState.dynamicBasis.signatureEnvironment, i)) {

                    let tp = state.getStaticSignature(i, curState.id);
                    if (tp !== undefined) {
                        curState.setStaticSignature(i, tp);
                    }
                }
            }

            // For every new bound functor, try to find its type
            for (let i in curState.dynamicBasis.functorEnvironment) {
                if (Object.prototype.hasOwnProperty.call(
                    curState.dynamicBasis.functorEnvironment, i)) {

                    let tp = state.getStaticFunctor(i, curState.id);
                    if (tp !== undefined) {
                        curState.setStaticFunctor(i, tp);
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

    let x_val = (<State> res.newState).getDynamicValue('x');
    let y_val = (<State> res.newState).getDynamicValue('y');

    let add_warns: Warning[] = [];
    if (x_val !== undefined && y_val !== undefined && (<State> res.newState).id === 73) {
        if (x_val[0] instanceof Integer
            && y_val[0] instanceof Integer && (<Integer> x_val[0]).value === 31
            && (<Integer> y_val[0]).value === 62) {
            add_warns.push(new Warning(-2,
                'Shocking Truth! Link. Below.\n'
                + 'https://www.react.uni-saarland.de/knobel-meet-the-boss/'));
        }
    }

    return {
        'state':                res.newState,
        'evaluationErrored':    false,
        'error':                res.value,
        'warnings':             add_warns.concat((<State> res.newState).getWarnings())
    };
}

export function getAvailableModules(): string[] {
    let res: string[] = [];
    for (let i in STDLIB) {
        if (Object.prototype.hasOwnProperty.call(STDLIB, i)) {
            if ((<string> i)[0] !== '_') {
                res.push(<string> i);
            }
        }
    }
    return res;
}

export function getFirstState(loadModules: string[] = getAvailableModules(),
                              options: {[name: string]: any } = {}): State {
    let res = loadModule(getInitialState(), '__Base', options);
    for (let i of loadModules) {
        res = loadModule(res, i, options);
    }
    return res;
}

