signature ISET = sig
  type set
  val set : int list -> set
  val union : set -> set -> set
  val subset : set -> set -> bool
end;
structure ISet :> ISET = struct
  type set = int list
  fun set xs = xs
  fun union xs ys = xs@ys
  fun elem ys x = List.exists (fn y => y=x) ys
  fun subset xs ys = List.all (elem ys) xs
end;

val s = ISet.set [3,2];
val s' = ISet.set [5,9,4];
ISet.subset s s';

open ISet;
val s = union (set[1,2,3]) (set[3,4]);
subset (set[1,4]) s;
