import { State, IdentifierStatus, DynamicBasis, StaticBasis } from '../state';
import { FunctionType } from '../types';
import { Real, Integer, PredefinedFunction, StringValue, Value } from '../values';
import { InternalInterpreterError } from '../errors';
import { EvaluationParameters } from '../evaluator';
import { Module, intType, realType, overflowException, stringType } from '../stdlib';

function addRealLib(state: State): State {
    let dres = new DynamicBasis({}, {}, {}, {}, {});
    let sres = new StaticBasis({}, {}, {}, {}, {});

    sres.setType('real', realType, [], 0, true);
    dres.setType('real', []);

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
    'code': `signature REAL = sig
        type real

        structure Math : MATH

        (* val radix : int *)
        (* val precision : int *)

        (* val maxFinite    : real *)
        (* val minPos       : real *)
        (* val minNormalPos : real *)

        (* val posInf : real *)
        (* val negInf : real *)

        (* val + : real * real -> real *)
        (* val - : real * real -> real *)
        (* val * : real * real -> real *)
        (* val / : real * real -> real *)
        (* val rem : real * real -> real *)
        (* val *+ : real * real * real -> real *)
        (* val *- : real * real * real -> real *)
        (* val ~ : real -> real *)
        (* val abs : real -> real *)

        (* val min : real * real -> real *)
        (* val max : real * real -> real *)

        (* val sign : real -> int *)
        (* val signBit : real -> bool *)
        (* val sameSign : real * real -> bool *)
        (* val copySign : real * real -> real *)

        val compare     : real * real -> order
        (* val compareReal : real * real -> IEEEReal.real_order *)
        (* val <  : real * real -> bool *)
        (* val <= : real * real -> bool *)
        (* val >  : real * real -> bool *)
        (* val >= : real * real -> bool *)
        (* val == : real * real -> bool *)
        (* val != : real * real -> bool *)
        (* val ?= : real * real -> bool *)
        (* val unordered : real * real -> bool *)

        (* val isFinite : real -> bool *)
        (* val isNan : real -> bool *)
        (* val isNormal : real -> bool *)
        (* val class : real -> IEEEReal.float_class *)

        (* val toManExp : real -> {man : real, exp : int} *)
        (* val fromManExp : {man : real, exp : int} -> real *)
        (* val split   : real -> {whole : real, frac : real} *)
        (* val realMod : real -> real *)

        (* val nextAfter : real * real -> real *)
        (* val checkFloat : real -> real *)

        (* val realFloor : real -> real *)
        (* val realCeil  : real -> real *)
        (* val realTrunc : real -> real *)
        (* val realRound : real -> real *)
        val floor : real -> int
        val ceil  : real -> int
        (* val trunc : real -> int *)
        val round : real -> int
        (* val toInt      : IEEEReal.rounding_mode -> real -> int *)
        (* val toLargeInt : IEEEReal.rounding_mode -> real -> LargeInt.int *)
        val fromInt      : int -> real
        (* val fromLargeInt : LargeInt.int -> real *)
        (* val toLarge   : real -> LargeReal.real *)
        (* val fromLarge : IEEEReal.rounding_mode -> LargeReal.real -> real *)

        (* val fmt      : StringCvt.realfmt -> real -> string *)
        val toString : real -> string
        (* val scan       : (char, 'a) StringCvt.reader -> (real, 'a) StringCvt.reader *)
        (* val fromString : string -> real option *)

        (* val toDecimal   : real -> IEEEReal.decimal_approx *)
        (* val fromDecimal : IEEEReal.decimal_approx -> real option *)
    end;

    structure Real = struct
        open Real;
        structure Math : MATH = struct
            open Math;
        end
        fun compare (x, y: real) = if x < y then LESS else if x > y then GREATER else EQUAL;
    end;

    structure LargeReal :> REAL = struct
        open Real;
    end;
    structure Real :> REAL = struct
        open Real;
    end;
    `,
    'requires': ['Math']
};
