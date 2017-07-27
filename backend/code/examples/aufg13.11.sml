datatype token = ID of string | CONS | APPEND | LPAR | RPAR;
datatype exp = Id of string | Cons of exp * exp | Append of exp * exp;
