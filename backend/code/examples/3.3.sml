fun sum (f:int->int) (n:int) : int =
    if n<1 then 0 else sum f (n-1) + f n;

sum (fn (i:int) => i) 100;

sum (fn (i:int) => i*i) 10;

val gauss = sum (fn (i:int) => i);
