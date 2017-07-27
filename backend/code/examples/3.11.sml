fun iter (n:int) (s:int) (f:int->int) : int =
    if n<1 then s else iter (n-1) (f s) f;
fun first (s:int) (p:int->bool) : int =
    if p s then s else first (s+1) p;
fun sqrt (x:int) = first 1 (fn (k:int) => k*k>x) - 1;
fun forall m n p = m>n orelse (p m andalso forall (m+1) n p);

fun prime x = x>=2 andalso
                forall 2 (sqrt x) (fn k => x mod k <> 0);

fun nextprime x = first (x+1) prime;

fun nthprime n = iter n 1 nextprime;
nthprime 100;
