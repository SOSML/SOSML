import { State } from './state';
import { FunctionType, CustomType, TupleType } from './types';
import { CharValue, Real, Integer, PredefinedFunction, Value, RecordValue,
         ExceptionConstructor } from './values';
import { InternalInterpreterError } from './errors';
import { Interpreter } from './main';

let intType = new CustomType('int');
let realType = new CustomType('real');
// let wordType = new CustomType('word');
// let boolType = new CustomType('bool');
// let stringType = new CustomType('string');
let charType = new CustomType('char');


function addMathLib(state: State): State {
    state.setDynamicValue('Math.sqrt', new PredefinedFunction('Math.sqrt', (val: Value) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            if (value < 0) {
                return [new ExceptionConstructor('Domain').construct(), true];
            }
            return [new Real(Math.sqrt(value)), false];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }));
    state.setStaticValue('Math.sqrt', new FunctionType(realType, realType));

    state.setDynamicValue('Math.sin', new PredefinedFunction('Math.sin', (val: Value) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.sin(value)), false];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }));
    state.setStaticValue('Math.sin', new FunctionType(realType, realType));

    state.setDynamicValue('Math.cos', new PredefinedFunction('Math.cos', (val: Value) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.cos(value)), false];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }));
    state.setStaticValue('Math.cos', new FunctionType(realType, realType));

    state.setDynamicValue('Math.asin', new PredefinedFunction('Math.asin', (val: Value) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.asin(value)), false];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }));
    state.setStaticValue('Math.asin', new FunctionType(realType, realType));

    state.setDynamicValue('Math.acos', new PredefinedFunction('Math.acos', (val: Value) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.acos(value)), false];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }));
    state.setStaticValue('Math.acos', new FunctionType(realType, realType));

    state.setDynamicValue('Math.exp', new PredefinedFunction('Math.exp', (val: Value) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.exp(value)), false];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }));
    state.setStaticValue('Math.exp', new FunctionType(realType, realType));

    state.setDynamicValue('Math.pow', new PredefinedFunction('Math.sin', (val: Value) => {
        if (val instanceof RecordValue) {
            let val1 = (<RecordValue> val).getValue('1');
            let val2 = (<RecordValue> val).getValue('2');
            if (val1 instanceof Real && val2 instanceof Real) {
                let value1 = (<Real> val1).value;
                let value2 = (<Real> val1).value;
                return [new Real(Math.pow(value1, value2)), false];
            } else {
                throw new InternalInterpreterError(-1, 'std type mismatch');
            }
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }));
    state.setStaticValue('Math.pow', new FunctionType(new TupleType([realType, realType]), realType).simplify());

    state.setDynamicValue('Math.ln', new PredefinedFunction('Math.ln', (val: Value) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.log(value)), false];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }));
    state.setStaticValue('Math.ln', new FunctionType(realType, realType));

    state.setDynamicValue('Math.log10', new PredefinedFunction('Math.log10', (val: Value) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.log10(value)), false];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }));
    state.setStaticValue('Math.log10', new FunctionType(realType, realType));

    state.setDynamicValue('Math.pi', new Real(3.14159265359));
    state.setStaticValue('Math.pi', realType);

    state.setDynamicValue('Math.e', new Real(2.71828182846));
    state.setStaticValue('Math.e', realType);

    return state;
}

function addCharLib(state: State): State {
    state.setDynamicValue('ord', new PredefinedFunction('ord', (val: Value) => {
        if (val instanceof CharValue) {
            let value = (<CharValue> val).value;
            return [new Integer(value.charCodeAt(0)), false];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }));
    state.setStaticValue('ord', new FunctionType(charType, intType));

    state.setDynamicValue('chr', new PredefinedFunction('chr', (val: Value) => {
        if (val instanceof Integer) {
            let value = (<Integer> val).value;
            if (value < 0 || value > 255) {
                return [new ExceptionConstructor('Chr').construct(), true];
            }
            return [new CharValue(String.fromCharCode(value)), false];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }));
    state.setStaticValue('chr', new FunctionType(intType, charType));

    return state;
}

function addRealLib(state: State): State {
    state.setDynamicValue('Real.fromInt', new PredefinedFunction('Real.fromInt', (val: Value) => {
        if (val instanceof Integer) {
            let value = (<Integer> val).value;
            return [new Real(value), false];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }));
    state.setStaticValue('Real.fromInt', new FunctionType(intType, realType));

    state.setDynamicValue('Real.round', new PredefinedFunction('Real.round', (val: Value) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            let integer = new Integer(Math.round(value));
            if (integer.hasOverflow()) {
                return [new ExceptionConstructor('Overflow').construct(), true];
            }
            return [integer, false];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }));
    state.setStaticValue('Real.round', new FunctionType(realType, intType));

    state.setDynamicValue('Real.floor', new PredefinedFunction('Real.floor', (val: Value) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            let integer = new Integer(Math.floor(value));
            if (integer.hasOverflow()) {
                return [new ExceptionConstructor('Overflow').construct(), true];
            }
            return [integer, false];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }));
    state.setStaticValue('Real.floor', new FunctionType(realType, intType));

    state.setDynamicValue('Real.ceil', new PredefinedFunction('Real.ceil', (val: Value) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            let integer = new Integer(Math.round(value));
            if (integer.hasOverflow()) {
                return [new ExceptionConstructor('Overflow').construct(), true];
            }
            return [integer, false];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }));
    state.setStaticValue('Real.ceil', new FunctionType(realType, intType));

    return state;
}

let code = `
exception Domain;
exception Empty;
exception Subscript;
exception Size;
exception Chr;

fun o (f,g) x = f (g x);
infix 3 o;

datatype order = LESS | EQUAL | GREATER;

fun Int.compare (x, y: int) = if x<y then LESS else if x>y then GREATER else EQUAL;
fun Real.compare (x, y: real) = if x<y then LESS else if x>y then GREATER else EQUAL;

exception Option.Option;
datatype 'a option = NONE | SOME of 'a;
fun valOf (SOME x) = x
  | valOf NONE = raise Option.Option;
fun isSome NONE = false
  | isSome (SOME _) = true;

val Int.minInt = SOME ~1073741824;
val Int.maxInt = SOME 1073741823;
fun Int.max (x, y) = if x < y then y else x : int;

fun not true = false | not false = true;

fun hd nil = raise Empty
| hd (x::xr) = x;
fun tl nil = raise Empty
| tl (x::xr) = xr;
fun null nil = true
| null (x::xr) = false;

fun map f nil = nil
  | map f (x::xr) = (f x) :: (map f xr);

fun @ (nil,ys) = ys
| @((x::xr),ys) = x:: @(xr,ys);
infixr 5 @;

fun length nil = 0
  | length (x::xr) = 1 + length xr;

fun rev nil = nil
  | rev (x::xr) = rev xr @ [x];

fun List.concat nil = nil
  | List.concat (x::xr) = x @ List.concat xr;

fun foldr f e []      = e
  | foldr f e (x::xr) = f(x, foldr f e xr);

fun foldl f e []      = e
  | foldl f e (x::xr) = foldl f (f(x, e)) xr;

fun List.tabulate (n, f) =
  let fun h i = if i<n then f i :: h (i+1) else []
  in if n<0 then raise Size else h 0 end;

fun List.exists p []      = false
  | List.exists p (x::xr) = p x orelse List.exists p xr;

fun List.all p []      = true
  | List.all p (x::xr) = p x andalso List.all p xr;

fun List.filter p []      = []
  | List.filter p (x::xr) = if p x then x :: List.filter p xr else List.filter p xr;

fun List.collate (compare : 'a * 'a -> order) p = case p of
    (nil, _::_) => LESS
  | (nil, nil) => EQUAL
  | (_::_, nil) => GREATER
  | (x::xr, y::yr) => case compare(x,y) of
         EQUAL => List.collate compare (xr,yr)
       | s => s;

fun List.nth (xs, n) =
    let fun h []      _ = raise Subscript
      | h (x::xr) n = if n=0 then x else h xr (n-1)
    in if n<0 then raise Subscript else h xs n end;

fun Char.isLower c  = #"a" <= c andalso c <= #"z";
fun Char.isUpper c  = #"A" <= c andalso c <= #"Z";
fun Char.isDigit c  = #"0" <= c andalso c <= #"9";
fun Char.isAlpha c  = Char.isLower c orelse Char.isUpper c;
`;

export function addStdLib(state: State): State {
    state = Interpreter.interpret(code, state, true)[0];
    state = addMathLib(state);
    state = addCharLib(state);
    state = addRealLib(state);

    return state;
}
