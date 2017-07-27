datatype token = ARROW | LPAR | RPAR | COLON (* : *)
  | DARROW (* => *) | LEQ | ADD | SUB | MUL
  | BOOL | INT | IF | THEN | ELSE | FN | FALSE | TRUE
  | ICON of int | ID of string;
