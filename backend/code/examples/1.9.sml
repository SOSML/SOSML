fun potenz (x:int, n:int) : int =
    if n>0 then x*potenz(x,n-1) else 1;

potenz (2,10);
