fun or false false = false
  | or _ _ = true;

fun or x y = case (x,y)
            of (false, false) => false
            | ( _ , _ ) => true;

fun or (x:bool) = fn (y:bool) =>
                    (fn (false , false ) => false
                    | (a:bool, b:bool) => true ) (x,y);
