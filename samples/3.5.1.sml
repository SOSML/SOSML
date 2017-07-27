fun 'a id (x:'a) = x;

val x = id 5;

val x = id 5.0;

val x = id(id 3, id 5.0);
