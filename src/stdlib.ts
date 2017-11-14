import { State, IdentifierStatus, DynamicBasis, StaticBasis } from './state';
import { TypeVariable, TypeVariableBind, FunctionType, CustomType, TupleType } from './types';
import { CharValue, Real, Integer, PredefinedFunction, Value, RecordValue,
         ExceptionConstructor, MAXINT, MININT, ValueConstructor } from './values';
import { InternalInterpreterError } from './errors';
import * as Interpreter from './main';
import { COMMIT_HASH, BRANCH_NAME, BUILD_DATE, COMMIT_MESSAGE } from './version';


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

    dres.setValue('tan', new PredefinedFunction('tan', (val: Value) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.tan(value)), false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('tan', new FunctionType(realType, realType), IdentifierStatus.VALUE_VARIABLE);

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

    dres.setValue('atan', new PredefinedFunction('atan', (val: Value) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.atan(value)), false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('atan', new FunctionType(realType, realType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('atan2', new PredefinedFunction('atan2', (val: Value) => {
        if (val instanceof RecordValue) {
            let val1 = (<RecordValue> val).getValue('1');
            let val2 = (<RecordValue> val).getValue('2');
            if (val1 instanceof Real && val2 instanceof Real) {
                let value1 = (<Real> val1).value;
                let value2 = (<Real> val2).value;
                return [new Real(Math.atan2(value1, value2)), false, []];
            } else {
                throw new InternalInterpreterError(-1, 'std type mismatch');
            }
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('atan2', new FunctionType(new TupleType([realType, realType]), realType).simplify(),
        IdentifierStatus.VALUE_VARIABLE);

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
                let value2 = (<Real> val2).value;
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

    dres.setValue('sinh', new PredefinedFunction('sinh', (val: Value) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.sinh(value)), false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('sinh', new FunctionType(realType, realType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('cosh', new PredefinedFunction('cosh', (val: Value) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.cosh(value)), false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('cosh', new FunctionType(realType, realType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('tanh', new PredefinedFunction('tanh', (val: Value) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.tanh(value)), false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('tanh', new FunctionType(realType, realType), IdentifierStatus.VALUE_VARIABLE);

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
            let integer = new Integer(Math.ceil(value));
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

function addListLib(state: State): State {
    let dres = new DynamicBasis({}, {}, {}, {}, {});
    let sres = new StaticBasis({}, {}, {}, {}, {});

    sres.setType('list', new CustomType('list', [new TypeVariable('\'a')]), ['nil', '::'], 1, true);
    sres.setValue('nil', new TypeVariableBind('\'a',
        new CustomType('list', [new TypeVariable('\'a')])), IdentifierStatus.VALUE_CONSTRUCTOR);
    sres.setValue('::', new TypeVariableBind('\'a', new FunctionType(
        new TupleType([new TypeVariable('\'a'),
            new CustomType('list', [new TypeVariable('\'a')])]),
        new CustomType('list', [new TypeVariable('\'a')]))).simplify(),
        IdentifierStatus.VALUE_CONSTRUCTOR);

    dres.setType('list', ['nil', '::']);
    dres.setValue('nil', new ValueConstructor('nil'), IdentifierStatus.VALUE_CONSTRUCTOR);
    dres.setValue('::', new ValueConstructor('::', 1), IdentifierStatus.VALUE_CONSTRUCTOR);

    state.setDynamicStructure('List', dres);
    state.setStaticStructure('List', sres);
    return state;
}

export let STDLIB: {
    [name: string]: {
        'native': ((state: State) => State) | undefined, /* callback for native parts */
        'code': string | undefined,
        'requires': string[] | undefined /* names of modules required for this module (excluding __Base) */
    }
} = {
    '__Base': {
        'native': undefined,
        'code': `fun o (f,g) x = f (g x);
            infix 3 o;
            datatype order = LESS | EQUAL | GREATER;

            exception Domain;
            exception Size;
            exception Chr;
            exception Subscript;

            fun not true = false | not false = true;

            fun ! (a : \'A ref): \'A = ! a;
            fun op := ((a, b) : (\'A ref * \'A)): unit = a := b;
            fun ref (a : \'A): \'A ref = ref a;`,
        'requires': undefined },
    'Char': {
        'native': addCharLib,
        'code':  `structure Char = struct
                fun isLower c  = #"a" <= c andalso c <= #"z"
                fun isUpper c  = #"A" <= c andalso c <= #"Z"
                fun isDigit c  = #"0" <= c andalso c <= #"9"
                fun isAlpha c  = isLower c orelse isUpper c
                fun isHexDigit c = #"0" <= c andalso c <= #"9"
                               orelse #"a" <= c andalso c <= #"f"
                               orelse #"A" <= c andalso c <= #"F"
                fun isAlphaNum c = isAlpha c orelse isDigit c
                fun isPrint c  = c >= #" " andalso c < #"\\127"
                fun isSpace c  = c = #" " orelse #"\\009" <= c andalso c <= #"\\013"
                fun isGraph c  = isPrint c andalso not (isSpace c)
                fun isPunct c  = isGraph c andalso not (isAlphaNum c)
                fun isAscii c  = c <= #"\\127"
                fun isCntrl c  = c < #" " orelse c >= #"\\127"

                fun toLower c =
                    if #"A" <= c andalso c <= #"Z" then chr (ord c + 32)
                    else c;
                fun toUpper c =
                    if #"a" <= c andalso c <= #"z" then chr (ord c - 32)
                    else c;

                val ord = ord;
                val chr = chr;
            end;`,
        'requires': undefined },
    'Int': {
        'native': undefined,
        'code': `structure Int = struct
                fun compare (x, y: int) = if x < y then LESS else if x > y then GREATER else EQUAL;

                val minInt = SOME ~` + -MININT + `;
                val maxInt = SOME ` + MAXINT + `;
                fun max (x, y) = if x < y then y else x : int;
            end;`,
        'requires': ['Option'] },
    'List': { /* complete */
        'native': addListLib,
        'code': `structure List : sig
                datatype 'a list = nil | :: of 'a * 'a list;
                val rev: 'a list -> 'a list;
            end  = struct
                open List;
                fun rev' nil ys     = ys
                  | rev' (x::xs) ys = rev' xs (x::ys)
                fun rev xs = rev' xs nil;
            end;

            structure List = struct
                exception Empty;
                open List;

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

                fun foldr f e []      = e
                  | foldr f e (x::xr) = f(x, foldr f e xr);

                fun foldl f e []      = e
                  | foldl f e (x::xr) = foldl f (f(x, e)) xr;
            end;
            open List;
            infixr 5 @;

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

                fun nth ([], _)    = raise Subscript
                  | nth (x::xs, 0) = x
                  | nth (x::xs, n) = nth (xs, n - 1);

                fun last [x] = x
                  | last (x::xs) = last xs
                  | last [] = raise Empty;

                fun getItem [] = NONE
                  | getItem x = SOME (hd x, tl x);

                fun take (x, 0) = []
                  | take ([], _) = raise Subscript
                  | take (x::xs, n) = x :: take (xs, n - 1);

                fun drop (x, 0) = x
                  | drop ([], _) = raise Subscript
                  | drop (x::xs, n) = drop (xs, n - 1);

                fun revAppend (l1, l2) = (rev l1) @ l2;

                fun app f [] = ()
                  | app f (x::xs) = (f x; app f xs);

                fun mapPartial f l
                    = ((map valOf) o (filter isSome) o (map f)) l;

                fun find f [] = NONE
                  | find f (x::xs) = if f x then SOME x else find f xs;

                fun partition f [] = ([], [])
                  | partition f (x::xs) = let
                    val tmp = partition f xs
                in
                    if f x then (x :: #1 tmp, #2 tmp)
                    else (#1 tmp, x :: #2 tmp)
                end;
            end;`,
        'requires': ['Option'] },
    'Listsort': { /* complete */
        'native': undefined,
        'code': `signature LISTSORT = sig
                val sort: ('a * 'a -> order) -> 'a list -> 'a list;
                val sorted: ('a * 'a -> order) -> 'a list -> bool;
                val mergeUniq: ('a * 'a -> order) -> 'a list * 'a list -> 'a list;
                val merge: ('a * 'a -> order) -> 'a list * 'a list -> 'a list;
                val eqclasses: ('a * 'a -> order) -> 'a list -> 'a list list;
            end;

            structure Listsort :> LISTSORT = struct
              fun take ordr x1 xr []       = x1 :: xr
                | take ordr x1 xr (y1::yr) = (case ordr(x1, y1) of
                    LESS    => x1 :: take ordr y1 yr xr
                  | _       => y1 :: take ordr x1 xr yr);

              fun takeUniq ordr x1 xr []       = x1 :: xr
                | takeUniq ordr x1 xr (y1::yr) = (case ordr(x1, y1) of
                    LESS    => x1 :: takeUniq ordr y1 yr xr
                  | GREATER => y1 :: takeUniq ordr x1 xr yr
                  | EQUAL   => takeUniq ordr x1 xr yr);

              fun merge ordr ([],     ys) = ys
                | merge ordr (x1::xr, ys) = take ordr x1 xr ys;

              fun mergeUniq ordr ([],     ys) = ys
                | mergeUniq ordr (x1::xr, ys) = takeUniq ordr x1 xr ys;

              fun mergepairs ordr l1  [] k              = [l1]
                | mergepairs ordr l1 (ls as (l2::lr)) k =
                  if k mod 2 = 1 then l1::ls
                  else mergepairs ordr (merge ordr (l1, l2)) lr (k div 2);

              fun nextrun ordr run []      = (run, [])
                | nextrun ordr run (xs as (x::xr)) =
                  if ordr(x, List.hd run) = LESS then (run, xs)
                  else nextrun ordr (x::run) xr;

              fun sorting ordr []      ls r = List.hd(mergepairs ordr [] ls 0)
                | sorting ordr (x::xs) ls r = let
                    val (revrun, tail) = nextrun ordr [x] xs
                  in
                    sorting ordr tail (mergepairs ordr (List.rev revrun) ls (r+1)) (r+1)
                  end;

              fun group ordr last rest cs1 css = case rest of
                  []     => cs1 :: css
                | r1::rr => if ordr(r1, last) = EQUAL then group ordr r1 rr (r1 :: cs1) css
                            else group ordr r1 rr [r1] (cs1 :: css);

              fun sort ordr []               = []
                | sort ordr (xs as [_])      = xs
                | sort ordr (xs as [x1, x2]) = (case ordr(x1, x2) of
                    GREATER => [x2, x1]
                  | _       => xs)
                | sort ordr xs = sorting ordr xs [] 0;

              fun sorted ordr []           = true
                | sorted ordr [x]          = true
                | sorted ordr (x1::x2::xr) =
                  ordr(x1, x2) <> GREATER andalso sorted ordr (x2::xr);


              fun eqclasses ordr xs = let
                  val xs = List.rev (sort ordr xs)
                in
                  case xs of
                      []     => []
                    | x1::xr => group ordr x1 xr [x1] []
                  end;
            end;
            structure List = struct
                open List;
                open Listsort;
            end;`,
        'requires': ['List'] },
    'Math': { /* Complete */
        'native': addMathLib,
        'code': undefined,
        'requires': undefined },
    'Option': { /* Complete */
        'native': undefined,
        'code': `structure Option = struct
                exception Option;

                datatype 'a option = NONE | SOME of 'a;

                fun getOpt (NONE, a) = a
                  | getOpt (SOME x, a) = x;

                fun isSome NONE = false
                  | isSome (SOME _) = true;

                fun valOf (SOME x) = x
                  | valOf NONE = raise Option;

                fun filter f x = if f x then SOME x else NONE;

                fun join NONE = NONE
                  | join (SOME (SOME x)) = SOME x;

                fun app f (SOME v) = f v
                  | app f NONE = ();

                fun map f NONE = NONE
                  | map f (SOME v) = SOME(f v);

                fun mapPartial f NONE = NONE
                  | mapPartial f (SOME v) = f v;

                fun compose (f, g) a = case g a of
                      NONE => NONE
                    | SOME v => SOME (f v);

                fun compose (f, g) a = case g a of
                      NONE => NONE
                    | SOME v => (f v);
            end;
            open Option;`,
        'requires': undefined },
    'Real': {
        'native': addRealLib,
        'code': `structure Real = struct
                open Real;
                fun compare (x, y: real) = if x < y then LESS else if x > y then GREATER else EQUAL;
            end;`,
        'requires': undefined },
    'Version': {
        'native': undefined,
        'code': `structure Version = struct
            val branch      = "` + BRANCH_NAME + `";
            val commit      = "` + COMMIT_HASH + `";
            val buildDate   = "` + BUILD_DATE + `";
            val message     = "` + COMMIT_MESSAGE + `";
        end;`,
        'requires': undefined
    }
};

export function loadModule(state: State, name: string, options: {[name: string]: any }): State {
    if (!STDLIB.hasOwnProperty(name)) {
        throw new InternalInterpreterError(-1, 'The module "' + name + '" does not exist. Auuuu~');
    }
    if (state.hasModule(name)) {
        return state;
    }

    let mod = STDLIB[name];
    if (mod.requires !== undefined ) {
        for (let i of mod.requires) {
            if (!state.hasModule(i)) {
                state = loadModule(state, i, options);
            }
        }
    }
    if (mod.native !== undefined) {
        state = mod.native(state);
    }
    if (mod.code !== undefined) {
        state = Interpreter.interpret(mod.code, state, options).state;
    }
    state.registerModule(name);
    return state;
}

