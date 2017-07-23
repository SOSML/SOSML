datatype token = BOOL | INT | STAR | ARROW | LPAR | RPAR;
datatype ty = Bool | Int | Star of ty list | Arrow of ty * ty;
