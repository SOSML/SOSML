let
    val x = 2*x
    val x = 2*x
    fun f x = if x<2 then x
        else f(x-1)
    val f = fn x => f x
in
    f x - y
end;
