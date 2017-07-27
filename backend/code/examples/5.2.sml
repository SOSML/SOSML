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

pisort Int.compare;
pisort Int.compare [5, 2, 2, 13, 4, 9, 9, 13, ~2];
pisort Real.compare [5.0, 2.0, 2.0, 13.0, 4.0, 9.0];
