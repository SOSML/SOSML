datatype tree = T of tree list;
val t1 = T[];
val t2 = T[t1, t1, t1];
val t3 = T[T[t2], t1, t2];

fun subtree t (T ts) = (t = T ts) orelse
                        List.exists (subtree t) ts;
subtree (T[t2]) t3;
subtree t3 t2;

fun count t (T ts) = if (t = T ts) then 1
                    else foldl op+ 0 (map (count t) ts);
count t1 t3;

fun linear (T nil) = true
  | linear (T [t]) = linear t
  | linear _ = false;
