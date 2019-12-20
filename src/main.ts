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
import { InternalInterpreterError, Warning } from './errors';
import { Type } from './types';
import { Value } from './values';
import * as Lexer from './lexer';
import * as Parser from './parser';
import * as Evaluator from './evaluator';

import * as Declarations from './declarations';
import * as Errors from './errors';
import * as Expressions from './expressions';
import * as Tokens from './tokens';
import * as Types from './types';
import * as Values from './values';
import * as Version from './version';

export {
    Lexer,
    Parser,
    Evaluator,

    Declarations,
    Errors,
    Expressions,
    Tokens,
    Types,
    Values,
    Version
};
export * from './state';

export type PrintOptions = {
    stopId?: number; // id of the oldest state to print
    fullSymbol?: string; // Symbol used for the first line of output per declaration (default: "")
    emptySymbol?: string; // Symbol used for every other line of output per declaration (def: "")
    indent?: number; // indent amount (spaces, default: 2)
    boldText?: (text: string) => string; // Function used to make text bold
    italicText?: (text: string) => string; // Function used to make text italic
    escapeText?: (text: string) => string; // Function on user-defined names
    showTypeVariablesAsUnicode?: boolean; // Display type variables as unicode
};

export type InterpreterOptions = {
    // General
    strictMode?: boolean; // Enforce more strict adherence to the SML 97 Standard
    realEquality?: boolean; // Turn real into a type with equality
    allowSuccessorML?: boolean; // Enable experimental features
    noModules?: boolean; // Don't load any modules

    // Lexer
    allowUnicode?: boolean; // enable unicode support
    allowUnicodeTypeVariables?: boolean; // allow unicode replacements for type variables
    allowCommentToken?: boolean; // don't skip output tokens for comments

    // Parser
    allowVector?: boolean; // Allow vector patterns
    allowStructuresAnywhere?: boolean;
    allowSignaturesAnywhere?: boolean;
    allowFunctorsAnywhere?: boolean;

    // Elaboration
    disableElaboration?: boolean;

    // Evaluation
    disableEvaluation?: boolean;
}

export type InterpretationResult = {
    state: State; // Computed state
    evaluationErrored: boolean; // Evaluation returned an SML error
    error?: Value; // Thrown SML error; present only if evaluationErrored is true
    warnings: Warning[]; // Array of emitted warnings / messages
}

export function interpret(nextInstruction: string,
                          oldState: State = getInitialState(),
                          options: InterpreterOptions = {
                              'allowSuccessorML': false,
                              'disableElaboration': false,
                              'allowVector': true,
                              'strictMode': true,
                              'realEquality': false
                          }): InterpretationResult {
    let state = oldState.getNestedState();

    let tkn = Lexer.lex(nextInstruction, options);

    let ast = Parser.parse(tkn, state, options);

    ast = ast.simplify();

    state = oldState.getNestedState();

    if (options.disableElaboration === true) {
        let tmp = Evaluator.evaluate(oldState.getNestedState(), ast /* , options */);
        if (tmp === undefined || tmp.newState === undefined) {
            throw new InternalInterpreterError('How is this undefined?');
        }
        return {
            'state':                tmp.newState,
            'evaluationErrored':    tmp.hasThrown,
            'error':                tmp.value,
            'warnings':             (<State> tmp.newState).getWarnings()
        };
    }

    let elab = ast.elaborate(state, new Map<string, [Type, boolean]>(), '\'*t0',
                             new Map<string, Type>(), true, options);
    state = elab[0];

    if (options.disableEvaluation === true) {
        return {
            'state':                state,
            'evaluationErrored':    false,
            'error':                undefined,
            'warnings':             elab[1]
        };
    }
    // Use a fresh state to be able to piece types and values together
    let res = Evaluator.evaluate(oldState.getNestedState(), ast /* , options */);
    if (res === undefined || res.newState === undefined) {
        throw new InternalInterpreterError('How is this undefined?');
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
                        curState.setStaticType(i, tp.type, tp.constructors, tp.arity, tp.allowsEquality);
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

    return {
        'state':                res.newState,
        'evaluationErrored':    false,
        'error':                res.value,
        'warnings':             (<State> res.newState).getWarnings()
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
                              options: InterpreterOptions = {}): State {
    if (options.noModules === true) {
        return getInitialState(options);
    }
    let res = loadModule(getInitialState(options), '__Base', options);
    for (let i of loadModules) {
        res = loadModule(res, i, options);
    }
    return res;
}

