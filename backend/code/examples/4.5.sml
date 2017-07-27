hd [1,2,3,4,5];
tl [1,2,3,4,5];

hd nil;
tl nil;

fun hd nil = raise Empty
  | hd (x::xr) = x;
fun tl nil = raise Empty
  | tl (x::xr) = xr;

fun null nil = true
  | null (x::xr) = false;

fun append (xs,ys) = if null xs then ys
                    else hd xs :: append(tl xs, ys);

fun append (xs,ys) = if xs=nil then ys
                    else hd xs :: append(tl xs, ys);


fun nth(xs,n) = if n<0 orelse null xs then raise Subscript
                else if n=0 then hd xs else nth(tl xs, n-1);
nth ([3,4,5], 0);
nth ([3,4,5], 2);
nth ([3,4,5], 3);
