datatype exp = Id of string (* Identifier *)
              | App of exp * exp (* Application *)
;
datatype token = ID of string | LPAR | RPAR;
