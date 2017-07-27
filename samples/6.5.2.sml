exception New;
exception Newer of int;

exception Unbound;

(raise New) handle New => ();
(raise Newer 7) handle Newer x => x;
fun test f = f() handle Newer x => x | Overflow => ~1;
test (fn () => raise Newer 6);
fun fac n = if n<1 then 1 else n*fac(n-1);
fac 15;
test (fn () => fac 15);

fun adjoin env env' x = env' x handle Unbound => env x;
