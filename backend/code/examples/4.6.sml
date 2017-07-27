fun rev nil = nil
  | rev (x::xr) = rev xr @ [x];

fun test [] = 0
  | test [(x,y)] = x+y
  | test [(x,5), (7,y)] = x*y
  | test (_::_::ps) = test ps;
