import { State, IdentifierStatus, DynamicBasis, StaticBasis } from '../state';
import { TypeVariable, FunctionType, CustomType, TupleType } from '../types';
import { Integer, PredefinedFunction, Value, RecordValue, VectorValue,
    ConstructedValue } from '../values';
import { InternalInterpreterError } from '../errors';
import { EvaluationParameters } from '../evaluator';
import { Module, subscriptException, intType } from '../stdlib';

function addVectorLib(state: State): State {
    let dres = new DynamicBasis({}, {}, {}, {}, {});
    let sres = new StaticBasis({}, {}, {}, {}, {});

    let vectorType = new CustomType('vector', [new TypeVariable('\'a')]);
    let listType = new CustomType('list', [new TypeVariable('\'a')]);

    sres.setType('vector', vectorType, [], 1, true);
    dres.setType('vector', []);

    dres.setValue('fromList', new PredefinedFunction('fromList', (val: Value, params: EvaluationParameters) => {
        let vec = new VectorValue([]);

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
                        vec.entries.push(a1);
                        list = a2;
                    } else {
                        throw new InternalInterpreterError('std type mismatch');
                    }
                } else {
                    throw new InternalInterpreterError('std type mismatch');
                }
            }

            return [vec, false, []];
        } else {
            throw new InternalInterpreterError('std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('fromList', new FunctionType(listType, vectorType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('sub', new PredefinedFunction('sub', (val: Value, params: EvaluationParameters) => {
        if (val instanceof RecordValue && val.entries.size === 2) {
            let vec = val.getValue('1');
            let index = val.getValue('2');

            if (vec instanceof VectorValue && index instanceof Integer) {
                let ind = index.value;
                if (ind < 0 || ind >= vec.entries.length) {
                    return [subscriptException.construct(), true, []];
                }

                return [vec.entries[ind], false, []];
            } else {
                throw new InternalInterpreterError('std type mismatch');
            }
        } else {
            throw new InternalInterpreterError('std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('sub',
        new FunctionType(new TupleType([vectorType, intType]).simplify(), new TypeVariable('\'a')),
        IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('update', new PredefinedFunction('update', (val: Value, params: EvaluationParameters) => {
        if (val instanceof RecordValue && val.entries.size === 3) {
            let vec = val.getValue('1');
            let index = val.getValue('2');
            let value = val.getValue('3');

            if (vec instanceof VectorValue && index instanceof Integer) {
                let ind = index.value;
                if (ind < 0 || ind >= vec.entries.length) {
                    return [subscriptException.construct(), true, []];
                }

                let res = new VectorValue(vec.entries.slice());
                res.entries[ind] = value;
                return [res, false, []];
            } else {
                throw new InternalInterpreterError('std type mismatch');
            }
        } else {
            throw new InternalInterpreterError('std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('update',
        new FunctionType(new TupleType([vectorType, intType, new TypeVariable('\'a')]).simplify(), vectorType),
        IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('length', new PredefinedFunction('length', (val: Value, params: EvaluationParameters) => {
        if (val instanceof VectorValue) {
            let res = new Integer(val.entries.length);
            return [res, false, []];
        } else {
            throw new InternalInterpreterError('std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('length', new FunctionType(vectorType, intType), IdentifierStatus.VALUE_VARIABLE);

    state.setDynamicStructure('Vector', dres);
    state.setStaticStructure('Vector', sres);
    return state;
}

export let VECTOR_LIB: Module = {
    'native': addVectorLib,
    'code': `structure Vector :> sig
        (* eqtype 'a vector = 'a vector *)
        (* val maxLen : int *)
        val fromList : 'a list -> 'a vector
        val tabulate : int * (int -> 'a) -> 'a vector
        val length : 'a vector -> int
        val sub : 'a vector * int -> 'a
        val update : 'a vector * int * 'a -> 'a vector
        val concat : 'a vector list -> 'a vector
        val appi : (int * 'a -> unit) -> 'a vector -> unit
        val app  : ('a -> unit) -> 'a vector -> unit
        val mapi : (int * 'a -> 'b) -> 'a vector -> 'b vector
        val map  : ('a -> 'b) -> 'a vector -> 'b vector
        val foldli : (int * 'a * 'b -> 'b) -> 'b -> 'a vector -> 'b
        val foldri : (int * 'a * 'b -> 'b) -> 'b -> 'a vector -> 'b
        val foldl  : ('a * 'b -> 'b) -> 'b -> 'a vector -> 'b
        val foldr  : ('a * 'b -> 'b) -> 'b -> 'a vector -> 'b
        val findi : (int * 'a -> bool) -> 'a vector -> (int * 'a) option
        val find  : ('a -> bool) -> 'a vector -> 'a option
        val exists : ('a -> bool) -> 'a vector -> bool
        val all : ('a -> bool) -> 'a vector -> bool
        val collate : ('a * 'a -> order) -> 'a vector * 'a vector -> order
    end = struct
        open Vector;
        fun tabulate (n, f) = fromList (List.tabulate (n, f));

        fun foldli f init vec = let
            val len = length vec
            fun loop (i, b) =
                if i = len then b
                else loop (i + 1, f (i, sub (vec, i), b))
            in
                loop (0, init)
            end;
        fun foldri f init vec = let
            val len = length vec
            fun loop (i, b) =
                if i = ~1 then b
                else loop (i - 1, f (i, sub (vec, i), b))
            in
                loop (len - 1, init)
            end;
        fun foldl f init vec = foldli (fn (_, a, x) => f(a, x)) init vec;
        fun foldr f init vec = foldri (fn (_, a, x) => f(a, x)) init vec;

        fun concat l = fromList (List.concat (List.map (foldr (fn (a, b) => (a::b)) []) l));

        fun appi f vec = List.app f (foldri (fn (i,a,l) => (i,a)::l) [] vec);
        fun app  f vec = List.app f (foldr (fn (a,l) => a::l) [] vec);
        fun mapi f vec = fromList (List.map f (foldri (fn (i,a,l) => (i,a)::l) [] vec));
        fun map  f vec = fromList (List.map f (foldr (fn (a,l) => a::l) [] vec));

        fun findi f vec = let
            val len = length vec
            fun loop index =
                if index = Vector.length vec then NONE
                else let
                    val el = sub(vec, index)
                in if f (index, el) then SOME (index, el) else loop (index+1)
                end
            in
                loop 0
            end;
        fun find f vec = case findi (fn (_, v) => f v) vec of NONE => NONE
                                                             | SOME (_, v) => SOME v;
        fun exists p vec = case find p vec of NONE => false
                                            | SOME _ => true;

        fun all p vec = foldl (fn (v, acc) => p v andalso acc) true vec;
        fun collate p (v1, v2) = let
            val length1 = length v1
            val length2 = length v2
            fun loop index =
                if index = length1 andalso index = length2 then EQUAL
                else if index = length1 then LESS
                else if index = length2 then GREATER
                else case p (sub (v1, index), sub (v2, index)) of
                    EQUAL => loop (index + 1)
                  | l => l
            in loop 0
            end;
    end;
    val vector = Vector.fromList;`,
    'requires': ['Option', 'List']
};
