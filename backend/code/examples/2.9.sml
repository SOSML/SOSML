fun p (x:int, y:int) = x+y;
fun p (y:int, x:int) = x+y;

val x = 999999999;
val y = x;
val z = (x-y)*(x-y);

val z = x*x - 2*x*y + y*y;

fun p (x:int, y:int) = (x+y)*(x+y);
fun q (x:int, y:int) = x*x + 2*x*y + y*y;
