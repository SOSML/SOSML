(* map + List.filter + List.exists + List.all should also be predefined *)
fun map f nil = nil
  | map f (x::xr) = (f x) :: (map f xr);

map (fn x => 2*x) [2, 4, 11, 34];
map op~ [2, 4, 11, 34];
fun minus5 xs = map (fn x => x-5) xs;
minus5 [3, 6, 99, 72];
map rev [[3, 4, 5], [2, 3], [7, 8, 9]];
map length [[3, 4, 5], [2, 3], [7, 8, 9]];

fun filter f nil = nil
  | filter f (x::xr) = if f x then x :: filter f xr
                        else filter f xr;

filter (fn x => x<0) [0, ~1, 2, ~3, ~4];
filter (fn x => x>=0) [0, ~1, 2, ~3, ~4];

fun exists f nil = false
  | exists f (x::xr) = f x orelse exists f xr;

exists (fn x => x<0) [1, 2, 3];
exists (fn x => x<0) [1, ~2, 3];

fun all f nil = true
  | all f (x::xr) = f x andalso all f xr;
all (fn x => x>0) [1, 2, 3];
all (fn x => x>0) [1, ~2, 3];
