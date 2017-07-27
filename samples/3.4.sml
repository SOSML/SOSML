fun 'a iter (n:int) (s:'a) (f:'a->'a) : 'a =
    if n<1 then s else iter (n-1) (f s) f;

fun power (x:int) (n:int) = iter n 1 (fn (a:int) => a*x);
power 2 10;
fun power' (x:real) (n:int) = iter n 1.0 (fn (a:real) => a*x);
power' 2.0 10;

fun gauss (n:int) =
    #2(iter n (1,0) (fn (i:int, a:int) => (i+1, a+i)));
gauss 10;
