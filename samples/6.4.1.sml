type var = string;
datatype exp = C of int | V of var | A of exp * exp | M of exp * exp;

fun components (A(e,e')) = [e, e']
  | components (M(e,e')) = [e, e']
  | components _ = nil;

components (A(C 3, V "z"));

fun subexps e = e::
    (case e of
        A(e1,e2) => subexps e1 @ subexps e2
      | M(e1,e2) => subexps e1 @ subexps e2
      | _ => nil);
