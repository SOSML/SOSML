exception Double;
fun mask compare p = case compare p of
    EQUAL => raise Double | v => v;
fun testDouble compare xs =
    (List.sort (mask compare) xs ; false)
    handle Double => true;
