fun forall m n p = m>n orelse (p m andalso forall (m+1) n p);

fun snd (_, y) = y;

op+(8,9);
op+(8.0, 9.0);
op+;
