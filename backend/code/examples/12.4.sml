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
exception Error of string
fun elabCon True = Bool
  | elabCon False = Bool
  | elabCon (IC _) = Int
fun elabOpr Add Int Int = Int
  | elabOpr Sub Int Int = Int
  | elabOpr Mul Int Int = Int
  | elabOpr Leq Int Int = Bool
  | elabOpr ___= raise Error "T Opr"
fun elab f (Con c) = elabCon c
  | elab f (Id x) = f x
  | elab f (Opr(opr,e1,e2)) = elabOpr opr (elab f e1) (elab f e2)
  | elab f (If(e1,e2,e3)) =
            (case (elab f e1, elab f e2, elab f e3) of
            (Bool, t2, t3) => if t2=t3 then t2
                              else raise Error "T If1"
            | _ => raise Error "T If2")
  | elab f (Abs(x,t,e)) = Arrow(t, elab (update f x t) e)
  | elab f (App(e1,e2)) = (case elab f e1 of
                          Arrow(t,t') => if t = elab f e2 then t'
                                          else raise Error "T App1"
                          | _ => raise Error "T App2")
;

val f = update (update empty "x" Int) "y" Bool;

f "y";
f "z";

val f = update (update empty "x" Int) "y" Bool;
val e = Abs("y", Int, Opr(Leq, Id"x", Id"y"));
elab f e;

datatype elab = T of ty | SE of string;
fun elab' f e = T(elab f e) handle
    Unbound s => SE("Unbound "^s)
  | Error s => SE("Error "^s);
elab' f e;
elab' f (App(Id"x", Id"x"));
elab' empty (Id "x");
