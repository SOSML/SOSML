fun w (k:int, n:int) : int = if k*k>n then k else w(k+1,n);

fun p (a:int, x:int, n:int) : int = if n<1 then a else p(a*x,x,n-1);
fun potenz (x:int, n:int) = p(1,x,n);
