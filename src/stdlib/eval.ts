import { State, IdentifierStatus, DynamicBasis, StaticBasis } from '../state';
import { FunctionType, TupleType } from '../types';
import { PredefinedFunction, StringValue, Value, RecordValue } from '../values';
import { InternalInterpreterError, Warning } from '../errors';
import { EvaluationStack, EvaluationParameters, EvaluationResult } from '../evaluator';
import * as Lexer from '../lexer';
import * as Parser from '../parser';
import { Declaration } from '../declarations';
import { ValueIdentifier, Record } from '../expressions';
import { Module, stringType } from '../stdlib';

function addEvalLib(state: State): State {
    let dres = new DynamicBasis({}, {}, {}, {}, {});
    let sres = new StaticBasis({}, {}, {}, {}, {});



    // Evaluates a given program and returns the result
    dres.setValue('evalExp', new PredefinedFunction('symbolic_eval', (val: Value,
                                                                      params: EvaluationParameters) => {
        if (val instanceof StringValue) {
            let strv = (<StringValue> val).value;

            try {
                let tkn = Lexer.lex(strv + ';', {});
                let p = new Parser.Parser(tkn, params.state, params.state.id, {});
                let ast = p.parseExpression();

                ast = ast.simplify();
                let callStack: EvaluationStack = [];
                callStack.push({'next': ast, 'params': {'state': params.state.getNestedState(),
                    'modifiable': params.state.getNestedState(),
                    'recResult': undefined}});

                let lastResult: EvaluationResult | undefined = undefined;
                let debug = '';

                let repl = new Map<string, string>();

                while (callStack.length > 0) {
                    let next = callStack.pop();
                    if (next === undefined) {
                        throw new InternalInterpreterError('バトル、バトルしたい！');
                    }
                    let target = next.next;
                    let nparams = next.params;
                    nparams.recResult = lastResult;
                    if (target instanceof Declaration) {
                        lastResult = target.evaluate(nparams, callStack);
                    } else {
                        lastResult = target.compute(nparams, callStack);
                    }

                    let str = next.next.toString();
                    if (nparams.step === 1 && !str.includes('__arg')) {

                        if (lastResult && lastResult.value) {
                            debug += str + ' → ' + lastResult.value.toString(nparams.state) + '\n';
                        } else {
                            let nrepl = new Map<string, string>();
                            repl.forEach((value: string, key: string) => {
                                if (str.includes(key)) {
                                    str = str.replace(key, value);
                                } else {
                                    nrepl.set(key, value);
                                }
                            });
                            repl = nrepl;

                            debug += str + '\n';
                        }
                    }
                    if (lastResult && lastResult.value
                        && lastResult.value.toString(nparams.state) !== 'fn') {
                        if (!(next.next instanceof ValueIdentifier
                            || next.next instanceof Record)) {
                            repl.set(next.next.toString(), lastResult.value.toString(nparams.state));
                        }
                    }
                }
                if (lastResult !== undefined && lastResult.value !== undefined) {
                    debug += lastResult.value.toString(undefined) + '\n';
                }
                return [new RecordValue(), false, [
                    new Warning(-2, debug)
                ]];
            } catch (e) {
                return [new RecordValue(), false, [new Warning(-1, e.message)]];
            }
        } else {
            throw new InternalInterpreterError('This std type mismatch reigns supreme!');
        }
        }), IdentifierStatus.VALUE_VARIABLE);

    sres.setValue('evalExp', new FunctionType(stringType,
        new TupleType([])).simplify(), IdentifierStatus.VALUE_VARIABLE);

    state.setDynamicStructure('Eval', dres);
    state.setStaticStructure('Eval', sres);
    return state;
}

export let EVAL_LIB: Module = {
    'native': addEvalLib,
    'code': undefined,
    'requires': undefined
};
