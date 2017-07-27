fun f (x:bool) = if x then 1 else 0;
val x = 5*7;
fun g (z:int) = f(z<x)<x;
val x = g 5;
