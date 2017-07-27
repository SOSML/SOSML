val a = 2*2;
val b = a*a;
val c = b*b;

fun hoch8 (x:int) =
    let
        val a = x*x
        val b = a*a
    in
        b*b
    end;
hoch8 2;

fun q (y:int) = y*y;
fun hoch8 (x:int) = q (q (q x));
