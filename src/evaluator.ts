import { State } from './state';
import { Expression, Match } from './expressions';
import { Declaration } from './declarations';
import { Value } from './values';
import { InternalInterpreterError } from './errors';

export type IdCnt = { [name: string]: number };
export type MemBind = [number, Value][];

export type EvaluationResult = {
    'value': Value | undefined,
    'hasThrown': boolean,
    'newState': State | undefined,
} | undefined;

export type EvaluationParameters = {
    [name: string]: any,
    'state': State,
    'modifiable': State,
    'recResult': EvaluationResult
};

export type EvaluationStack = {
    'next': Expression | Declaration | Match,
    'params': EvaluationParameters
}[];

export function evaluate(state: State, ast: Declaration): EvaluationResult {
    let modifiable = state.getNestedState();

    let callStack: EvaluationStack = [];
    callStack.push({'next': ast, 'params': {'state': state, 'modifiable': modifiable, 'recResult': undefined}});

    let lastResult: EvaluationResult = undefined;
    while (callStack.length > 0) {
        let next = callStack.pop();
        if (next === undefined) {
            throw new InternalInterpreterError('How is this undefined?');
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

    if (lastResult !== undefined) {
        let newState = lastResult.newState;
        if (newState !== undefined) {
            newState.setWarnings(modifiable.getWarnings());
            for (let change of modifiable.getMemoryChanges(state.id)) {
                newState.setCell(change[0], change[1]);
            }
            let idChanges = modifiable.getIdChanges(state.id);
            for (let i in idChanges) {
                if (idChanges.hasOwnProperty(i)) {
                    newState.setValueIdentifierId(i, idChanges[i]);
                }
            }
            newState.exceptionEvalId = modifiable.exceptionEvalId;
        }
    }

    return lastResult;
}
