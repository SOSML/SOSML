type var = string;

datatype exp = C of int | V of var | A of exp * exp | M of exp * exp;

val e = M(A(M(C 2, V "x"), V "y"), A(V "x", C 3));
