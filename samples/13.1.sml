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

lex (explode "(int->bool)->int");
lex (explode " intbool->int ");
