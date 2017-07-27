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

type 'a env = id -> 'a (* environments *)
exception Unbound of id
fun empty x = raise Unbound x
fun update env x a y = if y=x then a else env y
;

datatype value =
    IV of int
  | Proc of id * exp * value env
fun evalCon False = IV 0
  | evalCon True = IV 1
  | evalCon (IC x) = IV x
fun evalOpr Add (IV x1) (IV x2) = IV(x1+x2)
  | evalOpr Sub (IV x1) (IV x2) = IV(x1-x2)
  | evalOpr Mul (IV x1) (IV x2) = IV(x1*x2)
  | evalOpr Leq (IV x1) (IV x2) = IV(if x1<=x2 then 1 else 0)
  | evalOpr _ _ _ = raise Error "R Opr"
fun eval f (Con c) = evalCon c
  | eval f (Id x) = f x
  | eval f (Opr(opr,e1,e2)) = evalOpr opr (eval f e1) (eval f e2)
  | eval f (If(e1,e2,e3)) = (case eval f e1 of
                              IV 1 => eval f e2
                            | IV 0 => eval f e3
                            | _ => raise Error "R If")
  | eval f (Abs(x,t,e)) = Proc(x, e, f)
  | eval f (App(e1,e2)) = (case (eval f e1, eval f e2) of
                          (Proc(x,e,f'), v) => eval (update f' x v) e
                            | _ => raise Error "R App")
;

val f = update empty "x" (IV 5);
val e = Opr(Leq, Id"x", Con(IC 7));
eval f e;
