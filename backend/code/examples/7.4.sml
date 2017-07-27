datatype tree = T of tree list;
val t1 = T[];
val t2 = T[t1, t1, t1];
val t3 = T[T[t2], t1, t2];

fun size (T ts) = foldl op+ 1 (map size ts);
size t3;

fun depth (T ts) = 1 + foldl Int.max ~1 (map depth ts);
depth t3;
