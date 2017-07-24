datatype tree = T of tree list;
val t1 = T[];
val t2 = T[t1, t1, t1];
val t3 = T[T[t2], t1, t2];

fun depth' (T nil) = 0
  | depth' (T(t::tr)) = 1+foldl Int.max (depth' t) (map depth’ tr);

exception Unbalanced;
fun check (n,m) = if n=m then n else raise Unbalanced;
fun depthb (T nil) = 0
  | depthb (T(t::tr)) = 1+foldl check (depthb t) (map depthb tr)

fun balanced t = (depthb t ; true) handle Unbalanced => false;
