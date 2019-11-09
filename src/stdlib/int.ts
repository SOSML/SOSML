import { State, IdentifierStatus, DynamicBasis, StaticBasis } from '../state';
import { FunctionType } from '../types';
import { Integer, PredefinedFunction,  StringValue, Value, MAXINT, MININT } from '../values';
import { InternalInterpreterError } from '../errors';
import { EvaluationParameters } from '../evaluator';
import { Module, intType, stringType } from '../stdlib';

function addIntLib(state: State): State {
    let dres = new DynamicBasis({}, {}, {}, {}, {});
    let sres = new StaticBasis({}, {}, {}, {}, {});

    dres.setValue('toString', new PredefinedFunction('toString', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Integer) {
            let str = new StringValue((<Integer> val).toString(undefined));
            return [str, false, []];
        } else {
            throw new InternalInterpreterError('std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('toString', new FunctionType(intType, stringType), IdentifierStatus.VALUE_VARIABLE);

    state.setDynamicStructure('Int', dres);
    state.setStaticStructure('Int', sres);

    return state;
}

export let INT_LIB: Module = {
    'native': addIntLib,
    'code': `structure Int = struct
            open Int;
            fun compare (x, y: int) = if x < y then LESS else if x > y then GREATER else EQUAL;

            val minInt = SOME ~` + -MININT + `;
            val maxInt = SOME ` + MAXINT + `;
            fun max (x, y) = if x < y then y else x : int;
            fun min (x, y) = if x > y then y else x : int;
        end;`,
    'requires': ['Option']
};
