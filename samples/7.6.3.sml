datatype tree = T of tree list;

fun pre (T ts) = length ts :: List.concat (map pre ts);
fun post (T ts) = List.concat (map post ts) @ [length ts];
