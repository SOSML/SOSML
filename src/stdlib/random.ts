import { State, IdentifierStatus, DynamicBasis, StaticBasis } from '../state';
import { FunctionType, TupleType } from '../types';
import { Integer, PredefinedFunction, Value } from '../values';
import { EvaluationParameters } from '../evaluator';
import { Module, intType } from '../stdlib';

function addRandomLib(state: State): State {
    let dres = new DynamicBasis({}, {}, {}, {}, {});
    let sres = new StaticBasis({}, {}, {}, {}, {});

    dres.setValue('date', new PredefinedFunction('toString', (val: Value, params:                   EvaluationParameters) => {
        let date = new Integer(new Date().getMilliseconds() + new Date().getSeconds());
        return [date, false, []];
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('date', new FunctionType(new TupleType([]).simplify(), intType), IdentifierStatus.VALUE_VARIABLE);
    state.setDynamicStructure('Random', dres);
    state.setStaticStructure('Random', sres);

    return state;
}

export let RANDOM_LIB: Module = {
    'native': addRandomLib,
    'code':  `signature RANDOM = sig
        type generator;

        val newGenSeed: real -> generator;
        val newGen: unit -> generator;
        val random: generator -> real;
        val randomList: int * generator -> real list;
        val range: int * int -> generator -> int;
        val rangeList: int * int -> int * generator -> int list;
    end;

    structure Random :> RANDOM = struct
        (* mosml random *)
        open Random;

        type generator = {seedref : real ref};
        val a = 16807.0;
        val m = 2147483647.0;

        fun nextrand seed = let
            val t = a*seed
        in
            t - m * Real.fromInt(Real.floor(t/m))
        end;

        fun newGenSeed seed = if
            seed > 0.0 orelse seed < 0.0
        then
            {seedref = ref (nextrand seed)}
        else
            raise Fail "Random.newGenSeed: bad seed 0.0";

        fun newGen () = newGenSeed (Real.fromInt (date ()));

        fun random {seedref} = (seedref := nextrand (!seedref); !seedref / m);

        fun randomList (n, {seedref}) = let
            fun h 0 seed res = (seedref := seed; res)
              | h i seed res = h (i-1) (nextrand seed) (seed / m :: res)
        in
            h n (!seedref) []
        end;

        fun range (min, max) = if min >= max then raise Fail "Random.range: empty range" else let
            val scale = (Real.fromInt max - Real.fromInt min) / m
        in
            fn {seedref} =>
                (seedref := nextrand (!seedref); Real.floor(Real.fromInt min + scale * (!seedref)))
        end;

        fun rangeList (min, max) = if min >= max then raise Fail "Random.rangelist: empty range"
        else let
            val scale = (Real.fromInt max - Real.fromInt min) / m
        in
            fn (n, {seedref}) => let
                fun h 0 seed res = (seedref := seed; res)
                  | h i seed res = h (i-1) (nextrand seed)
                    (Real.floor(Real.fromInt min + scale * seed) :: res)
            in
                h n (!seedref) []
            end
        end;
    end;`,
    'requires': ['Real']
};
