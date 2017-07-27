datatype tree = T of tree list;

fun fold f (T ts) = f (map (fold f) ts);

val size = fold (foldl op+ 1);
