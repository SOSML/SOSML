fun position compare v x = let
  fun position' l r =
    if l>r then NONE
    else let val m = (l+r) div 2
              val y = Vector.sub(v,m)
          in case compare(x,y) of
              EQUAL => SOME m
            | LESS => position' l (m-1)
            | GREATER => position' (m+1) r
          end
in
  position' 0 (Vector.length v - 1)
end;
