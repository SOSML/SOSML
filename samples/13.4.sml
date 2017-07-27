datatype con = False | True | IC of int (* constants *)
type id = string (* identifiers *)
datatype opr = Add | Sub | Mul | Leq (* operators *)
datatype ty = (* types *)
    Bool
  | Int
  | Arrow of ty * ty (* procedure type *)
datatype exp = (* expressions *)
    Con of con (* constant *)
  | Id of id (* identifier *)
  | Opr of opr * exp * exp (* operator application *)
  | If of exp * exp * exp (* conditional *)
  | Abs of id * ty * exp (* abstraction *)
  | App of exp * exp (* procedure application *)
;
exception Error of string
datatype token = BOOL | INT | ARROW | LPAR | RPAR
fun lex nil = nil
  | lex (#" ":: cr) = lex cr
  | lex (#"\t":: cr) = lex cr
  | lex (#"\n":: cr) = lex cr
  | lex (#"b":: #"o":: #"o":: #"l":: cr) = BOOL:: lex cr
  | lex (#"i":: #"n":: #"t":: cr) = INT:: lex cr
  | lex (#"-":: #">":: cr) = ARROW:: lex cr
  | lex (#"(":: cr) = LPAR:: lex cr
  | lex (#")":: cr) = RPAR:: lex cr
  | lex _ = raise Error "lex"
;

fun ty ts = case pty ts of ARROW::tr => ty tr | tr => tr
and pty (BOOL::tr) = tr
  | pty (INT::tr) = tr
  | pty (LPAR::tr) = (case ty tr of RPAR::tr => tr
                      | _ => raise Error "RPAR")
  | pty _ = raise Error "pty";

ty [INT, ARROW, BOOL, RPAR];
ty [INT, ARROW, BOOL, ARROW];
ty [LPAR, BOOL];

fun ty ts = (case pty ts of
            (t, ARROW::tr) => let val (t',tr') = ty tr
                              in (Arrow(t,t'), tr') end
            | s => s)
and pty (BOOL::tr) = (Bool,tr)
  | pty (INT::tr) = (Int,tr)
  | pty (LPAR::tr) = (case ty tr of
                    (t,RPAR::tr') => (t,tr')
                    | _ => raise Error "pty")
  | pty _ = raise Error "pty";

fun match (a,ts) t = if null ts orelse hd ts <> t
                      then raise Error "match"
                      else (a, tl ts)
fun extend (a,ts) p f = let val (a',tr) = p ts in (f(a,a'),tr) end
fun parse p ts = case p ts of
                  (a,nil) => a
                  | _ => raise Error "parse"
;

ty [INT, ARROW, BOOL, RPAR];
parse ty [INT, ARROW, BOOL, RPAR];
parse ty [INT, ARROW, BOOL, ARROW, INT];
parse ty (lex (explode "int->bool->int"));

fun ty ts = case pty ts of
            (t, ARROW::tr) => extend (t,tr) ty Arrow
            | s => s
and pty (BOOL::tr) = (Bool,tr)
  | pty (INT::tr) = (Int,tr)
  | pty (LPAR::tr) = match (ty tr) RPAR
  | pty _ = raise Error "pty"
;
