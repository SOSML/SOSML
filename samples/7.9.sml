datatype tree = T of tree list;

datatype 'a ltr = L of 'a * 'a ltr list;

val t1 = L(7,[]);
val t2 = L(1, [L(2,[]), t1, t1]);
val t3 = L(3, [L(0,[t2]), L(4,[]), t2]);

fun head (L(x,_)) = x;

fun shape (L(_,ts)) = T(map shape ts);
shape t2;

fun sameshape t t' = shape t = shape t';

sameshape t2 (L(1, [L(2,[]), L(7,[]), L(7,[])]));
