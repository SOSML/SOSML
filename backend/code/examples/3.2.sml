fun f (x:int) (y:int) = x+y;
val g = f 7;

fun f (x:int) (y:int) : int = f x y;
val g = f 7;
