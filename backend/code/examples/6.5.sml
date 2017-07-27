raise Empty;

Empty;

exception New;

exception Newer of int;

(Overflow, New, Newer);
fun test New = 0
  | test (Newer x) = x
  | test _ = ~1;
test Overflow;
test (Newer 13);
