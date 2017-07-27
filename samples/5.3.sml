fun insert (x, nil) = [x]
  | insert (x, y::yr) = if x<=y then x::y::yr else y::insert(x,yr);
fun pisort compare =
    let
        fun insert (x, nil) = [x]
          | insert (x, y::yr) = case compare(x,y) of
                                GREATER => y::insert(x,yr)
                                | _ => x::y::yr
    in
        foldl insert nil
    end;

fun invert (compare : 'a * 'a -> order) (x,y) = compare (y,x);
pisort (invert Int.compare) [5, 2, 2, 13, 4, 9, 9, 13, ~2];

fun lex (compare : 'a * 'a -> order) p = case p of
                                        (nil, _::_) => LESS
                                        | (nil, nil) => EQUAL
                                        | (_::_, nil) => GREATER
                                        | (x::xr, y::yr) => case compare(x,y) of
                                        EQUAL => lex compare (xr,yr)
                                        | s => s;

pisort (lex Int.compare) [[4,1], [], [4], [4,1,~8]];
