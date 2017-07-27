type var = string;
datatype exp = C of int | V of var | A of exp * exp | M of exp * exp;
val e = M(A(M(C 2, V "x"), V "y"), A(V "x", C 3));

type env = var -> int;

exception Unbound;

val env = fn "x" => 5 | "y" => 3 | _ => raise Unbound;

fun eval env (C c) = c
  | eval env (V v) = env v
  | eval env (A(e,e')) = eval env e + eval env e'
  | eval env (M(e,e')) = eval env e * eval env e';

eval env e;
