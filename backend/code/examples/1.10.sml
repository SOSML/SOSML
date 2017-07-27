fun w (k:int,n:int) : int = if k*k>n then k else w(k+1,n);
fun wurzel (n:int) = w(1,n)-1;
wurzel 15;
