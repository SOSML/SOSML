import { State, DynamicBasis, StaticBasis } from '../state';
import { CustomType } from '../types';
import { Module } from '../stdlib';

function addStringLib(state: State): State {
    let dres = new DynamicBasis({}, {}, {}, {}, {});
    let sres = new StaticBasis({}, {}, {}, {}, {});

    sres.setType('string', new CustomType('string', []), [], 0, true);
    dres.setType('string', []);
    sres.setType('char', new CustomType('char', []), [], 0, true);
    dres.setType('char', []);

    state.setDynamicStructure('String', dres);
    state.setStaticStructure('String', sres);
    return state;
}

export let STRING_LIB: Module = {
    'native': addStringLib,
    'code': `structure String : sig
            eqtype string
            eqtype char
            val size : string -> int
            val sub : string * int -> char
            val extract   : string * int * int option -> string
            val substring : string * int * int -> string
            val ^ : string * string -> string
            val concat : string list -> string
            val concatWith : string -> string list -> string
            val str : char -> string
            val implode : char list -> string
            val explode : string -> char list
            val map : (char -> char) -> string -> string
            val translate : (char -> string) -> string -> string
            val tokens : (char -> bool) -> string -> string list
            val fields : (char -> bool) -> string -> string list
            val isPrefix    : string -> string -> bool
            val isSubstring : string -> string -> bool
            val isSuffix    : string -> string -> bool
            val compare : string * string -> order
            val collate : (char * char -> order)
                            -> string * string -> order
            val <  : string * string -> bool
            val <= : string * string -> bool
            val >  : string * string -> bool
            val >= : string * string -> bool
        end = struct
            open String;

            fun size s = List.length (explode s);
            fun sub (s,i) = List.nth (explode s, i);
            fun extract (s, i, NONE) = implode (List.drop (explode s, i))
              | extract (s, i, SOME j) = implode (List.take (List.drop (explode s, i), j));
            fun substring (s, i, j) = extract (s, i, SOME j);
            val op^ = op^;

            fun cc2 b ([], y) = y
              | cc2 b (x::xs, y) = cc2 b (xs, y^b^x);
            fun concat a = cc2 "" (a, "");
            fun concatWith b [] = ""
              | concatWith b (a::c) = a ^ (cc2 b (c, ""));

            fun str c = implode [c];
            val implode = implode;
            val explode = explode;
            fun map f s = implode(List.map f (explode s));
            fun translate f s = concat(List.map f (explode s));


            fun cmp f ([], []) = EQUAL
              | cmp f ([], _) = LESS
              | cmp f (_, []) = GREATER
              | cmp f (x::xs, y::ys) = let
                    val tmp = f (x, y);
                in
                    if tmp <> EQUAL then tmp else cmp f (xs, ys)
                end;

            fun matchPrefix ([], _) = true
              | matchPrefix (_, []) = false
              | matchPrefix (x::xs, y::ys) = if x <> y then false else matchPrefix (xs, ys);

            fun matchSubstring ([], _) = true
              | matchSubstring (_, []) = false
              | matchSubstring (x, y::ys) = if matchPrefix (x, y::ys) then true
                else matchSubstring (x, ys);

            fun getFields (f, [], tmp, x) = (implode tmp) :: x
              | getFields (f, (r::rs), tmp, x) = if f r then
                    getFields (f, rs, [], (implode tmp)::x)
                else
                    getFields (f, rs, r::tmp, x);

            fun tokens f s = List.filter (fn t => t <> "") (getFields (f, rev (explode s), [], []));
            fun fields f s = getFields (f, rev (explode s), [], []);

            fun isPrefix a b = matchPrefix (explode a, explode b);
            fun isSubstring a b = matchSubstring (explode a, explode b);
            fun isSuffix a b = matchPrefix (rev (explode a), rev (explode b));

            fun compare (a, b) = cmp Char.compare (explode a, explode b);
            fun collate f (a, b) = cmp f (explode a, explode b);

            fun op< (a, b) = compare (a, b) = LESS;
            fun op> (a, b) = compare (a, b) = GREATER;
            fun op<= (a, b) = compare (a, b) <> GREATER;
            fun op>= (a, b) = compare (a, b) <> LESS;
        end;`,
    'requires': ['Char', 'List']
};
