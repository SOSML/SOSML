structure S = struct
  val a = 4
  fun f x = x+1
end;

S.a;
S.f(2*S.a + S.a);

structure S = struct
  val a = 4
  exception E
  datatype t = A | B
  structure T = struct val a = a+3 end
end;

S.T.a;

fun switch S.A = S.B
  | switch S.B = S.A;
