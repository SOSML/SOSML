fun ifi (b:bool, x:int, y:int) = if b then x else y;

fun p (n:int) : int = if n=0 then p(n-1) else n;
fun q (n:int) : int = ifi(n=0, q(n-1), n);
