fun sum xs = foldl op+ 0 xs;

sum [4,3,6,2,8];

fun rev xs = foldl op:: nil xs;

fun append (xs,ys) = foldr op:: ys xs;

fun length xs = foldl (fn (x,n) => n+1) 0 xs;
fun append (xs,ys) = foldr op:: ys xs;
fun rev xs = foldl op:: nil xs;
fun concat xs = foldr op@ nil xs;
fun map f = foldr (fn (x,yr) => (f x)::yr) nil;
fun filter f = foldr (fn (x,ys) => if f x then x::ys else ys) nil;

fun foldl f s nil = s
  | foldl f s (x::xr) = foldl f (f(x,s)) xr;
fun foldr f s nil = s
  | foldr f s (x::xr) = f(x, foldr f s xr);
