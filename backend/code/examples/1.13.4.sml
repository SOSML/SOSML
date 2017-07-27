fun newton (a:real, x:real, n:int) : real =
    if n<1 then a else newton (0.5*(a+x/a), x, n-1);

fun sqrt (x:real) = newton (x/2.0, x , 5);

sqrt 4.0;
sqrt 2.0;
sqrt 81.0;
