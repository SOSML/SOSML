fun length nil = 0
  | length (x::xr) = 1 + length xr;
length [1,1,1,1];
