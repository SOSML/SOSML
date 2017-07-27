datatype tree = T of tree list;
val t1 = T[];
val t2 = T[t1, t1, t1];
val t3 = T[T[t2], t1, t2];
fun dst (T ts) k = List.nth(ts, k-1);

fun ast t nil = t
  | ast t (n::a) = ast (dst t n) a;
ast t3 [1,1,3];
ast t3 [1,1];

ast t3 [1,2];
