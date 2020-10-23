import { State, IdentifierStatus, DynamicBasis, StaticBasis } from '../state';
import { FunctionType, TupleType } from '../types';
import { Integer, PredefinedFunction, Value } from '../values';
import { EvaluationParameters } from '../evaluator';
import { Module, intType } from '../stdlib';

function addRandomLib(state: State): State {
    let dres = new DynamicBasis({}, {}, {}, {}, {});
    let sres = new StaticBasis({}, {}, {}, {}, {});

    dres.setValue('date', new PredefinedFunction(
        'toString', (val: Value, params: EvaluationParameters) => {
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
        type rand;

        val randSeed: real -> rand;
        val rand: unit -> rand;
        (* val toString : rand -> string; *)
        (* val fromString : string -> rand; *)

        val randReal: rand -> real;
        val randRealList: int * rand -> real list;
        val randRange: int * int -> rand -> int;
        val randRangeList: int * int -> int * rand -> int list;
    end;

    structure Random :> RANDOM = struct
        (* mosml random *)
        open Random;

        type rand = {seedref : real ref};

        val a = 16807.0;
        val m = 2147483647.0;

        fun nextrand seed = let
            val t = a*seed
        in
            t - m * Real.fromInt(Real.floor(t/m))
        end;

        fun randSeed seed = if
            seed > 0.0 orelse seed < 0.0
        then
            {seedref = ref (nextrand seed)}
        else
            raise Fail "Random.randSeed: bad seed 0.0";

        (* fun toString {seedref} = Int.toString (Real.round (!seedref)); *)
        (* fun fromString s = case Int.fromString s of
            NONE => raise Fail "Random.fromString: given string is invalid"
            | SOME 0 => raise Fail "Random.fromString: given string is invalid"
            | SOME x => {seedref = ref (Real.fromInt x)}; *)

        fun rand () = randSeed (Real.fromInt (date ()));

        fun randReal {seedref} = (seedref := nextrand (!seedref); !seedref / m);

        fun randRealList (n, {seedref}) = let
            fun h 0 seed res = (seedref := seed; res)
              | h i seed res = h (i-1) (nextrand seed) (seed / m :: res)
        in
            h n (!seedref) []
        end;

        fun randRange (min, max) = if min >= max then raise Fail "Random.randRange: empty range" else let
            val scale = (Real.fromInt max - Real.fromInt min) / m
        in
            fn {seedref} =>
                (seedref := nextrand (!seedref); Real.floor(Real.fromInt min + scale * (!seedref)))
        end;

        fun randRangeList (min, max) = if min >= max then raise Fail "Random.randRangeList: empty range"
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
