fun split xs = foldl (fn (x, (ys,zs)) => (zs, x::ys))
                    (nil, nil) xs;
fun merge (nil , ys ) = ys
 | merge (xs , nil ) = xs
 | merge (x::xr, y::yr) = if x<=y then x::merge(xr,y::yr)
                            else y::merge(x::xr,yr);
fun msort [] = []
  | msort [x] = [x]
  | msort xs = let val (ys,zs) = split xs
                in merge(msort ys, msort zs) end;
