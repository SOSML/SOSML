datatype tree = T of tree list;
val t1 = T[];
val t2 = T[t1, t1, t1];
val t3 = T[T[t2], t1, t2];

fun fold f (T ts) = f (map (fold f) ts);

val size = fold (foldl op+ 1);
