val x = 3+2;
fun f (y:int) = x+y;
fun g (y:int) : int = if y<x then 0 else y+g(y-1);
