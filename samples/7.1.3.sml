datatype tree = T of tree list;
val t1 = T[];
val t2 = T[t1, t1, t1];
val t3 = T[T[t2], t1, t2];

fun compareTree (T ts, T tr) = List.collate compareTree (ts,tr);
compareTree(t2,t3);
compareTree(T[T[T[T[T[]]]]], t3);
