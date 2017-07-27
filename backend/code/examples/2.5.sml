val a = 2*7;
fun p (x:int) = x+a;

val a = 2*7;
fun p (x:int) = x+a;
fun q (x:int) = x + p x;

fun p (x:int) = x;
fun q (x:int) = p x;
fun p (x:int) = 2*x;
val a = (p 5, q 5);
