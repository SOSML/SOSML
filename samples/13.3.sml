exception Error of string;

fun test (0::tr) = tr
| test (1::tr) = test tr
| test (2::tr) = test (test tr)
| test _ = raise Error "test";

test [2,0,1,0];
test [2,0,1,0,7];
test [2,0,1];

datatype tree = A | B of tree | C of tree * tree;

fun rep A = [0]
  | rep (B t) = 1 :: rep t
  | rep (C(t,t')) = 2 :: rep t @ rep t';

rep (C(B A, C(A, A)));

fun parse (0::tr) = (A, tr)
  | parse (1::tr) = let val (s,ts) = parse tr in (B s, ts) end
  | parse (2::tr) = let val (s,ts) = parse tr
                        val (s', ts') = parse ts
                    in (C(s,s'), ts') end
  | parse _ = raise Error "parse";

parse [2,0,1,0,7];
parse (rep (C(B A, C(A, A))));
