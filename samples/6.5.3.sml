exception New;

(raise Overflow, raise Subscript);

(5 ; 7);
(raise New ; 7);

fun testOverflow x y = (x*y ; false) handle Overflow => true;
testOverflow 2 3;
testOverflow 100000 100000;
