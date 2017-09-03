import { State, IdentifierStatus, DynamicBasis, StaticBasis } from './state';
import { FunctionType, CustomType, TupleType } from './types';
import { CharValue, Real, Integer, PredefinedFunction, Value, RecordValue,
         ExceptionConstructor } from './values';
import { InternalInterpreterError } from './errors';
import * as Interpreter from './main';

let intType = new CustomType('int');
let realType = new CustomType('real');
// let wordType = new CustomType('word');
// let boolType = new CustomType('bool');
// let stringType = new CustomType('string');
let charType = new CustomType('char');


function addMathLib(state: State): State {
    let dres = new DynamicBasis({}, {}, {}, {}, {});
    let sres = new StaticBasis({}, {}, {}, {}, {});

    dres.setValue('sqrt', new PredefinedFunction('sqrt', (val: Value) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            if (value < 0) {
                return [new ExceptionConstructor('Domain').construct(), true, []];
            }
            return [new Real(Math.sqrt(value)), false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('sqrt', new FunctionType(realType, realType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('sin', new PredefinedFunction('sin', (val: Value) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.sin(value)), false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('sin', new FunctionType(realType, realType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('cos', new PredefinedFunction('cos', (val: Value) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.cos(value)), false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('cos', new FunctionType(realType, realType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('asin', new PredefinedFunction('asin', (val: Value) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.asin(value)), false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('asin', new FunctionType(realType, realType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('acos', new PredefinedFunction('acos', (val: Value) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.acos(value)), false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('acos', new FunctionType(realType, realType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('exp', new PredefinedFunction('exp', (val: Value) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.exp(value)), false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('exp', new FunctionType(realType, realType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('pow', new PredefinedFunction('pow', (val: Value) => {
        if (val instanceof RecordValue) {
            let val1 = (<RecordValue> val).getValue('1');
            let val2 = (<RecordValue> val).getValue('2');
            if (val1 instanceof Real && val2 instanceof Real) {
                let value1 = (<Real> val1).value;
                let value2 = (<Real> val1).value;
                return [new Real(Math.pow(value1, value2)), false, []];
            } else {
                throw new InternalInterpreterError(-1, 'std type mismatch');
            }
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('pow', new FunctionType(new TupleType([realType, realType]), realType).simplify(),
        IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('ln', new PredefinedFunction('ln', (val: Value) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.log(value)), false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('ln', new FunctionType(realType, realType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('log10', new PredefinedFunction('log10', (val: Value) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.log10(value)), false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('log10', new FunctionType(realType, realType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('pi', new Real(3.14159265359), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('pi', realType, IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('e', new Real(2.71828182846), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('e', realType, IdentifierStatus.VALUE_VARIABLE);

    state.setDynamicStructure('Math', dres);
    state.setStaticStructure('Math', sres);

    return state;
}

function addCharLib(state: State): State {
    state.setDynamicValue('ord', new PredefinedFunction('ord', (val: Value) => {
        if (val instanceof CharValue) {
            let value = (<CharValue> val).value;
            return [new Integer(value.charCodeAt(0)), false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    state.setStaticValue('ord', new FunctionType(charType, intType), IdentifierStatus.VALUE_VARIABLE);

    state.setDynamicValue('chr', new PredefinedFunction('chr', (val: Value) => {
        if (val instanceof Integer) {
            let value = (<Integer> val).value;
            if (value < 0 || value > 255) {
                return [new ExceptionConstructor('Chr').construct(), true, []];
            }
            return [new CharValue(String.fromCharCode(value)), false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    state.setStaticValue('chr', new FunctionType(intType, charType), IdentifierStatus.VALUE_VARIABLE);

    return state;
}

function addRealLib(state: State): State {
    let dres = new DynamicBasis({}, {}, {}, {}, {});
    let sres = new StaticBasis({}, {}, {}, {}, {});

    dres.setValue('fromInt', new PredefinedFunction('fromInt', (val: Value) => {
        if (val instanceof Integer) {
            let value = (<Integer> val).value;
            return [new Real(value), false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('fromInt', new FunctionType(intType, realType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('round', new PredefinedFunction('round', (val: Value) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            let integer = new Integer(Math.round(value));
            if (integer.hasOverflow()) {
                return [new ExceptionConstructor('Overflow').construct(), true, []];
            }
            return [integer, false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('round', new FunctionType(realType, intType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('floor', new PredefinedFunction('floor', (val: Value) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            let integer = new Integer(Math.floor(value));
            if (integer.hasOverflow()) {
                return [new ExceptionConstructor('Overflow').construct(), true, []];
            }
            return [integer, false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('floor', new FunctionType(realType, intType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('ceil', new PredefinedFunction('ceil', (val: Value) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            let integer = new Integer(Math.round(value));
            if (integer.hasOverflow()) {
                return [new ExceptionConstructor('Overflow').construct(), true, []];
            }
            return [integer, false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('ceil', new FunctionType(realType, intType), IdentifierStatus.VALUE_VARIABLE);

    state.setDynamicStructure('Real', dres);
    state.setStaticStructure('Real', sres);

    return state;
}

let code = `
exception Domain;
exception Size;
exception Chr;
exception Subscript;

fun o (f,g) x = f (g x);
infix 3 o;

datatype order = LESS | EQUAL | GREATER;

structure Real = struct
    open Real;
    fun compare (x, y: real) = if x < y then LESS else if x > y then GREATER else EQUAL;
end

structure Option = struct
    exception Option;

    datatype 'a option = NONE | SOME of 'a;

    fun valOf (SOME x) = x
      | valOf NONE = raise Option;

    fun isSome NONE = false
      | isSome (SOME _) = true;
end;
open Option;

structure Int = struct
    fun compare (x, y: int) = if x < y then LESS else if x > y then GREATER else EQUAL;

    val minInt = SOME ~1073741824;
    val maxInt = SOME 1073741823;
    fun max (x, y) = if x < y then y else x : int;
end

fun not true = false | not false = true;

structure List = struct
    exception Empty;

    fun hd nil = raise Empty
      | hd (x::xr) = x;

    fun tl nil = raise Empty
      | tl (x::xr) = xr;

    fun null nil = true
      | null (x::xr) = false;

    fun map f nil = nil
      | map f (x::xr) = (f x) :: (map f xr);

    infixr 5 @;
    fun [] @ ys = ys
      | (x::xr) @ ys = x :: (xr @ ys);

    fun length nil = 0
      | length (x::xr) = 1 + length xr;

    fun rev nil = nil
      | rev (x::xr) = rev xr @ [x];

    fun foldr f e []      = e
      | foldr f e (x::xr) = f(x, foldr f e xr);

    fun foldl f e []      = e
      | foldl f e (x::xr) = foldl f (f(x, e)) xr;
end;
open List;

structure List = struct
    open List;

    fun concat nil = nil
      | concat (x::xr) = x @ concat xr;

    fun tabulate (n, f) = let
        fun h i = if i < n then f i :: h (i + 1) else []
    in
        if n < 0 then raise Size else h 0
    end;

    fun exists p []      = false
      | exists p (x::xr) = p x orelse exists p xr;

    fun all p []      = true
      | all p (x::xr) = p x andalso all p xr;

    fun filter p []      = []
      | filter p (x::xr) = if p x then x :: filter p xr else filter p xr;

    fun collate (compare : 'a * 'a -> order) p = case p of
        (nil, _::_)     => LESS
      | (nil, nil)      => EQUAL
      | (_::_, nil)     => GREATER
      | (x::xr, y::yr)  => case compare (x, y) of
             EQUAL  => collate compare (xr, yr)
           | s      => s;

    fun nth (xs, n) = let
        fun h []      _ = raise Subscript
          | h (x::xr) n = if n = 0 then x else h xr (n - 1)
    in
        if n < 0 then raise Subscript else h xs n
    end;
end;

structure Char = struct
    (* open Char; *)
    fun isLower c  = #"a" <= c andalso c <= #"z";
    fun isUpper c  = #"A" <= c andalso c <= #"Z";
    fun isDigit c  = #"0" <= c andalso c <= #"9";
    fun isAlpha c  = isLower c orelse isUpper c;
end;

fun ! (a : \'A ref): \'A = ! a;
fun op := ((a, b) : (\'A ref * \'A)): unit = a := b;
fun ref (a : \'A): \'A ref = ref a;
`;

export function addStdLib(state: State, options: {[name: string]: any }): State {
    state = addMathLib(state);
    state = addCharLib(state);
    state = addRealLib(state);
    state = Interpreter.interpret(code, state, options).state;

    return state;
}
