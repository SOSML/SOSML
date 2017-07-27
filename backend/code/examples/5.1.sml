fun insert (x, nil) = [x]
  | insert (x, y::yr) = if x<=y then x::y::yr else y::insert(x,yr);
fun isort xs = foldl insert nil xs;

fun pisort compare =
    let
        fun insert (x, nil) = [x]
          | insert (x, y::yr) = case compare(x,y) of
                                GREATER => y::insert(x,yr)
                                | _ => x::y::yr
    in
        foldl insert nil
    end;

val xs = List.tabulate(5000, fn x => x);
val ys = rev xs;
