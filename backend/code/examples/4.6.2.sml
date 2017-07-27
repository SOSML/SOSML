fun test nil = 0
  | test [_] = 1;

exception SomethingWrong;
fun test nil = 0
  | test [_] = 1
  | test _ = raise SomethingWrong;
test [1,2];
