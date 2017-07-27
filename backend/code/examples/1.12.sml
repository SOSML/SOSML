fun p (x:int) : int = p x;

fun q (x:int) : int = 0 + q x;

val it = q 0;
