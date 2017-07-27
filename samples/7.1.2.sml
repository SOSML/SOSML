datatype tree = T of tree list;

datatype exp = C of int | V of string | A of exp*exp | M of exp*exp;

fun shape (C _) = T[]
  | shape (V _) = T[]
  | shape (A(e,e')) = T[shape e, shape e']
  | shape (M(e,e')) = T[shape e, shape e'];
