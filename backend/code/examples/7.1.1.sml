datatype tree = T of tree list;

val t1 = T[];
val t2 = T[t1, t1, t1];
val t3 = T[T[t2], t1, t2];

fun arity (T ts) = length ts;
arity t3;
fun dst (T ts) k = List.nth(ts, k-1);
dst t3 3;
