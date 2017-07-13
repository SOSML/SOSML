
exception Failed of string;

val failed = if mult 2 3 == 6 then false else true;

if failed then raise Failed("mult is not behaving as expected!");
