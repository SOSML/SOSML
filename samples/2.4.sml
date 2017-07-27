fun q (x:int) = 3+(p x);

fun p (x:int) = x;
fun q (x:int) = 3+(p x);

fun f (x:int) : int = if x<1 then 1 else x*f(x-1);
