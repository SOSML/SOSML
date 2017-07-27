fun compose f g x = f (g x);

fun plus x y = x+y;
fun times x y = x*y;
val foo = compose (plus 2) (times 3);
foo 4;

val foo = (plus 2) o (times 3);
foo 7;
op o;
