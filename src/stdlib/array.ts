import { State, IdentifierStatus, DynamicBasis, StaticBasis } from '../state';
import { TypeVariable, FunctionType, CustomType, TupleType } from '../types';
import { Integer, PredefinedFunction, Value, RecordValue,
    ConstructedValue, ArrayValue } from '../values';
import { InternalInterpreterError } from '../errors';
import { EvaluationParameters } from '../evaluator';
import { Module, intType, sizeException, subscriptException } from '../stdlib';

function addArrayLib(state: State): State {
    let dres = new DynamicBasis({}, {}, {}, {}, {});
    let sres = new StaticBasis({}, {}, {}, {}, {});

    let arrayType = new CustomType('array', [new TypeVariable('\'a')]);
    let listType = new CustomType('list', [new TypeVariable('\'a')]);

    sres.setType('array', arrayType, [], 1, true);
    dres.setType('array', []);

    dres.setValue('array', new PredefinedFunction('array', (val: Value, params: EvaluationParameters) => {

        if (val instanceof RecordValue && val.entries.size === 2) {
            let cnt = val.getValue('1');
            let value = val.getValue('2');

            if (cnt instanceof Integer) {
                let c = cnt.value;
                if (c < 0) {
                    return [sizeException.construct(), true, []];
                }

                let arr = new ArrayValue(params.modifiable.memory[0] + 1, c);
                // we need to waste one cell so that no two arrays can be the same
                params.modifiable.setNewCell(arr);

                for (let i = 0; i < c; ++i) {
                    params.modifiable.setNewCell(value);
                }

                return [arr, false, []];
            } else {
                throw new InternalInterpreterError('std type mismatch');
            }
        } else {
            throw new InternalInterpreterError('std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('array',
        new FunctionType(new TupleType([intType, new TypeVariable('\'a')]).simplify(), arrayType),
        IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('fromList', new PredefinedFunction('fromList', (val: Value, params: EvaluationParameters) => {
        let arr = new ArrayValue(params.modifiable.memory[0] + 1, 0);
        params.modifiable.setNewCell(arr); // we need to waste one cell so that no two arrays can be the same

        if (val instanceof ConstructedValue) {
            let list: ConstructedValue = val;
            while (list.constructorName !== 'nil') {
                if (list.constructorName !== '::') {
                    throw new InternalInterpreterError('std type mismatch');
                }
                let arg = list.argument;
                if (arg instanceof RecordValue && arg.entries.size === 2) {
                    let a1 = arg.getValue('1');
                    let a2 = arg.getValue('2');
                    if (a1 instanceof Value && a2 instanceof ConstructedValue) {
                        params.modifiable.setNewCell(a1);
                        arr.length++;
                        list = a2;
                    } else {
                        throw new InternalInterpreterError('std type mismatch');
                    }
                } else {
                    throw new InternalInterpreterError('std type mismatch');
                }
            }

            return [arr, false, []];
        } else {
            throw new InternalInterpreterError('std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('fromList', new FunctionType(listType, arrayType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('sub', new PredefinedFunction('sub', (val: Value, params: EvaluationParameters) => {
        if (val instanceof RecordValue && val.entries.size === 2) {
            let arr = val.getValue('1');
            let index = val.getValue('2');

            if (arr instanceof ArrayValue && index instanceof Integer) {
                let ind = index.value;
                if (ind < 0 || ind >= arr.length) {
                    return [subscriptException.construct(), true, []];
                }

                return [(<Value> params.modifiable.getCell(arr.address + ind)), false, []];
            } else {
                throw new InternalInterpreterError('std type mismatch');
            }
        } else {
            throw new InternalInterpreterError('std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('sub',
        new FunctionType(new TupleType([arrayType, intType]).simplify(), new TypeVariable('\'a')),
        IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('update', new PredefinedFunction('update', (val: Value, params: EvaluationParameters) => {
        if (val instanceof RecordValue && val.entries.size === 3) {
            let arr = val.getValue('1');
            let index = val.getValue('2');
            let value = val.getValue('3');

            if (arr instanceof ArrayValue && index instanceof Integer) {
                let ind = index.value;
                if (ind < 0 || ind >= arr.length) {
                    return [subscriptException.construct(), true, []];
                }

                params.modifiable.setCell(arr.address + ind, value);
                return [new RecordValue(), false, []];
            } else {
                throw new InternalInterpreterError('std type mismatch');
            }
        } else {
            throw new InternalInterpreterError('std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('update',
        new FunctionType(new TupleType([arrayType, intType, new TypeVariable('\'a')]), new TupleType([])).simplify(),
        IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('length', new PredefinedFunction('length', (val: Value, params: EvaluationParameters) => {
        if (val instanceof ArrayValue) {
            let res = new Integer(val.length);
            return [res, false, []];
        } else {
            throw new InternalInterpreterError('std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('length', new FunctionType(arrayType, intType), IdentifierStatus.VALUE_VARIABLE);

    state.setDynamicStructure('Array', dres);
    state.setStaticStructure('Array', sres);
    return state;
}

export let ARRAY_LIB: Module = {
    'native': addArrayLib,
    'code': `signature ARRAY = sig
        (* eqtype 'a array = 'a array *)
        (* type 'a vector = 'a Vector.vector *)
        (* val maxLen : int *)
        val array : int * 'a -> 'a array
        val fromList : 'a list -> 'a array
        val tabulate : int * (int -> 'a) -> 'a array
        val length : 'a array -> int
        val sub : 'a array * int -> 'a
        val update : 'a array * int * 'a -> unit
        val vector : 'a array -> 'a vector
        val copy    : {src : 'a array, dst : 'a array, di : int} -> unit
        val copyVec : {src : 'a vector, dst : 'a array, di : int} -> unit
        val appi : (int * 'a -> unit) -> 'a array -> unit
        val app  : ('a -> unit) -> 'a array -> unit
        val modifyi : (int * 'a -> 'a) -> 'a array -> unit
        val modify  : ('a -> 'a) -> 'a array -> unit
        val foldli : (int * 'a * 'b -> 'b) -> 'b -> 'a array -> 'b
        val foldri : (int * 'a * 'b -> 'b) -> 'b -> 'a array -> 'b
        val foldl  : ('a * 'b -> 'b) -> 'b -> 'a array -> 'b
        val foldr  : ('a * 'b -> 'b) -> 'b -> 'a array -> 'b
        val findi : (int * 'a -> bool) -> 'a array -> (int * 'a) option
        val find  : ('a -> bool) -> 'a array -> 'a option
        val exists : ('a -> bool) -> 'a array -> bool
        val all : ('a -> bool) -> 'a array -> bool
        val collate : ('a * 'a -> order) -> 'a array * 'a array -> order
    end;

    structure Array :> ARRAY = struct
        open Array;
        fun tabulate (n, f) = fromList (List.tabulate (n, f));

        fun vector arr = Vector.tabulate (length arr, fn i => sub (arr, i));

        fun copy {src, dst, di} = if di < 0 orelse length dst < di + length src then raise Subscript
            else
            let
                val len = length src
                fun loop index = if index = len then ()
                    else ( update(dst, index + di, sub(src, index)); loop (index + 1))
            in
                loop 0
            end;
        fun copyVec {src, dst, di} = if di < 0 orelse length dst < di + Vector.length src then raise Subscript
            else
            let
                val len = Vector.length src
                fun loop index = if index = len then ()
                    else ( update(dst, index + di, Vector.sub(src, index)); loop (index + 1))
            in
                loop 0
            end;

        fun appi p arr = let
            val len = length arr
            fun loop index = if index = len then ()
                else (p(index, sub(arr, index)); loop (index +1))
            in
                loop 0
    end;
    fun app p = appi (fn (_, v) => p v);

    fun modifyi p arr =
        let
            val len = length arr
            fun loop index = if index = len then ()
                else ( update(arr, index, p(index, sub(arr, index))); loop (index +1))
        in
            loop 0
        end;

    fun modifyi p arr =
        let
            val len = length arr
            fun loop index = if index = len then ()
                else ( update(arr, index, p(index, sub(arr, index))); loop (index +1))
        in
            loop 0
        end;
    fun modify p = modifyi (fn (_, v) => p v);

    fun foldli f init arr =
        let
            val len = length arr
            fun loop (i, b) =
                if i = len then b
                else loop (i + 1, f (i, sub (arr, i), b))
            in
                loop (0, init)
        end;
    fun foldri f init arr =
        let
            val len = length arr
            fun loop (i, b) =
                if i = ~1 then b
                else loop (i - 1, f (i, sub (arr, i), b))
            in
                loop (len - 1, init)
            end;
    fun foldl f init arr = foldli (fn (_, a, x) => f(a, x)) init arr;
    fun foldr f init arr = foldri (fn (_, a, x) => f(a, x)) init arr;

    fun findi f arr =
        let
            val len = length arr
            fun loop index =
                if index = Array.length arr then NONE
                else
                let
                    val el = sub(arr, index)
                in
                    if f (index, el) then SOME (index, el) else loop (index+1)
                end
        in
            loop 0
        end;
    fun find f arr = case findi (fn (_, v) => f v) arr of NONE => NONE
                                                        | SOME (_, v) => SOME v;
    fun exists p arr = case find p arr of NONE => false
                                        | SOME _ => true;

    fun all p = foldl (fn (v, acc) => p v andalso acc) true;
    fun collate p (a1, a2) =
        let
            val length1 = length a1
            val length2 = length a2
            fun loop index =
                if index = length1 andalso index = length2 then EQUAL
                else if index = length1 then LESS
                else if index = length2 then GREATER
                else case p (sub (a1, index), sub (a2, index)) of
                        EQUAL => loop (index + 1)
                          | l => l
        in
            loop 0
        end;
    end;`,
    'requires': ['Option', 'List', 'Vector']
};
