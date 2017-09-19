import { State } from './state';
import { Expression, Match } from './expressions';
import { Declaration } from './declarations';
import { Value } from './values';
import { Warning, InternalInterpreterError } from './errors';

export type IdCnt = { [name: string]: number };
export type MemBind = [number, Value][];

export type EvaluationResult = {
    'value': Value | undefined,
    'hasThrown': boolean,
    'warns': Warning[],
    'newState': State | undefined,
    'mem': MemBind | undefined,
    'ids': IdCnt | undefined} | undefined;
export type EvaluationParameters = { [name: string]: any, 'state': State, 'recResult': EvaluationResult };
export type EvaluationStack = {
    'next': Expression | Declaration | Match,
    'params': EvaluationParameters}[];

export function evaluate(state: State, ast: Declaration): EvaluationResult {
    let callStack: EvaluationStack = [];
    callStack.push({'next': ast, 'params': {'state': state, 'recResult': undefined}});

    let lastResult: EvaluationResult = undefined;
    while (callStack.length > 0) {
        let next = callStack.pop();
        if (next === undefined) {
            throw new InternalInterpreterError(-1, 'How is this undefined?');
        }
        let target = next.next;
        let params = next.params;
        params.recResult = lastResult;
        if (target instanceof Declaration) {
            lastResult = target.evaluate(params, callStack);
        } else {
            lastResult = target.compute(params, callStack);
        }
    }

    return lastResult;
}
