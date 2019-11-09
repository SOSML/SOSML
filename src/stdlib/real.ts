import { State, IdentifierStatus, DynamicBasis, StaticBasis } from '../state';
import { FunctionType } from '../types';
import { Real, Integer, PredefinedFunction, StringValue, Value } from '../values';
import { InternalInterpreterError } from '../errors';
import { EvaluationParameters } from '../evaluator';
import { Module, intType, realType, overflowException, stringType } from '../stdlib';

function addRealLib(state: State): State {
    let dres = new DynamicBasis({}, {}, {}, {}, {});
    let sres = new StaticBasis({}, {}, {}, {}, {});

    dres.setValue('fromInt', new PredefinedFunction('fromInt', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Integer) {
            let value = (<Integer> val).value;
            return [new Real(value), false, []];
        } else {
            throw new InternalInterpreterError('std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('fromInt', new FunctionType(intType, realType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('round', new PredefinedFunction('round', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            let integer = new Integer(Math.round(value));
            if (integer.hasOverflow()) {
                return [overflowException.construct(), true, []];
            }
            return [integer, false, []];
        } else {
            throw new InternalInterpreterError('std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('round', new FunctionType(realType, intType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('floor', new PredefinedFunction('floor', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            let integer = new Integer(Math.floor(value));
            if (integer.hasOverflow()) {
                return [overflowException.construct(), true, []];
            }
            return [integer, false, []];
        } else {
            throw new InternalInterpreterError('std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('floor', new FunctionType(realType, intType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('ceil', new PredefinedFunction('ceil', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            let integer = new Integer(Math.ceil(value));
            if (integer.hasOverflow()) {
                return [overflowException.construct(), true, []];
            }
            return [integer, false, []];
        } else {
            throw new InternalInterpreterError('std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('ceil', new FunctionType(realType, intType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('toString', new PredefinedFunction('toString', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Real) {
            let str = new StringValue((<Real> val).toString(undefined));
            return [str, false, []];
        } else {
            throw new InternalInterpreterError('std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('toString', new FunctionType(realType, stringType), IdentifierStatus.VALUE_VARIABLE);

    state.setDynamicStructure('Real', dres);
    state.setStaticStructure('Real', sres);

    return state;
}

export let REAL_LIB: Module = {
    'native': addRealLib,
    'code': `structure Real = struct
            open Real;
            fun compare (x, y: real) = if x < y then LESS else if x > y then GREATER else EQUAL;
        end;`,
    'requires': undefined
};
