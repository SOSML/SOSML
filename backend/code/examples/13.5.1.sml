exception Error of string
datatype token = ADD | MUL | LPAR | RPAR | ICON of int | ID of string
fun lex nil = nil
  | lex (#" ":: cr) = lex cr
  | lex (#"\t":: cr) = lex cr
  | lex (#"\n":: cr) = lex cr
  | lex (#"+":: cr) = ADD:: lex cr
  | lex (#"*":: cr) = MUL:: lex cr
  | lex (#"(":: cr) = LPAR:: lex cr
  | lex (#")":: cr) = RPAR:: lex cr
  | lex (#"~":: c:: cr) = if Char.isDigit c then lexInt ~1 0 (c::cr)
                          else raise Error "~"
  | lex (c::cr) = if Char.isDigit c then lexInt 1 0 (c::cr)
                  else if Char.isAlpha c then lexId [c] cr
                  else raise Error "lex"
and lexInt s v cs = if null cs orelse not(Char.isDigit (hd cs))
                    then ICON(s*v) :: lex cs
                    else lexInt s (10*v+(ord(hd cs)-ord#"0")) (tl cs)
and lexId cs cs' = if null cs' orelse not(Char.isAlpha (hd cs'))
                    then ID(implode(rev cs)) :: lex cs'
                    else lexId (hd cs' ::cs) (tl cs')
;

lex (explode "(int->bool)->int");
lex (explode " intbool->int ");

lex (explode "x1");
lex (explode "one two");
lex (explode "onetwo");

lexId [] (explode "Aufgabe 5");
lexId [#"f", #"u", #"A"] (explode "gabe 5");

lex (explode "~3472 Katzen");
lexInt ~1 34 (explode "72 Katzen");
