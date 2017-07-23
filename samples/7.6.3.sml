datatype tree = T of tree list;
val t1 = T[];
val t2 = T[t1, t1, t1];
val t3 = T[T[t2], t1, t2];

fun pre (T ts) = length ts :: List.concat (map pre ts);
fun post (T ts) = List.concat (map post ts) @ [length ts];
