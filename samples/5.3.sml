fun invert (compare : ’a * ’a -> order) (x,y) = compare (y,x);
pisort (invert Int.compare) [5, 2, 2, 13, 4, 9, 9, 13, ~2];

fun lex (compare : ’a * ’a -> order) p = case p of
                                        (nil, _::_) => LESS
                                        | (nil, nil) => EQUAL
                                        | (_::_, nil) => GREATER
                                        | (x::xr, y::yr) => case compare(x,y) of
                                        EQUAL => lex compare (xr,yr)
                                        | s => s;

pisort (lex Int.compare) [[4,1], [], [4], [4,1,~8]];
