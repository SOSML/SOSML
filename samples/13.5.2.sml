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

fun match (a,ts) t = if null ts orelse hd ts <> t
                      then raise Error "match"
                      else (a, tl ts)
fun extend (a,ts) p f = let val (a',tr) = p ts in (f(a,a'),tr) end
fun parse p ts = case p ts of
                  (a,nil) => a
                  | _ => raise Error "parse"
;


datatype exp = Con of int | Id of string | Sum of exp * exp
  | Pro of exp * exp
fun exp ts = exp' (mexp ts)
and exp' (e, ADD::tr) = exp' (extend (e,tr) mexp Sum)
  | exp' s = s
and mexp ts = mexp' (pexp ts)
and mexp' (e, MUL::tr) = mexp' (extend (e,tr) pexp Pro)
  | mexp' s = s
and pexp (ICON z :: tr) = (Con z, tr)
  | pexp (ID x :: tr) = (Id x, tr)
  | pexp (LPAR :: tr) = match (exp tr) RPAR
  | pexp _ = raise Error "pexp"
;

mexp' (Id "x", lex (explode "*y*z+u"));
parse exp (lex (explode "2*x+y+(z+u)"));

