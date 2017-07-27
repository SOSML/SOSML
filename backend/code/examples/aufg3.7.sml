let val a = 7
    fun f (x:int) = a + x
    fun g (x:int) (y:int) : int = g (f x) y
in
    g (f 5)
end;
