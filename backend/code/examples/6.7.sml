(* should be predefined *)
datatype 'a option = NONE | SOME of 'a;

fun nth n xs = if n<0 orelse null xs then NONE
                else if n=0 then SOME (hd xs) else nth (n-1) (tl xs);
nth 2 [3,4,5];
nth 3 [3,4,5];

(* should be predefined *)
fun valOf (SOME x) = x
  | valOf NONE = raise Option.Option;

valOf (nth 2 [3,4,5]);

(* should be predefined *)
fun isSome NONE = false
  | isSome (SOME _) = true;

Int.minInt;

Int.maxInt;
valOf Int.minInt + valOf Int.maxInt;

fun findDouble compare xs = let
    exception Double of 'a
    fun compare' (x,y) = case compare (x,y) of
        EQUAL => raise Double x | v => v
in
    (List.sort compare' xs ; NONE)
    handle Double x => SOME x
end;
