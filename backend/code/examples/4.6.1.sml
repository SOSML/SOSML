fun length nil = 0
  | length (_::xr) = 1 + length xr;

fun length (_::xr) = 1 + length xr
  | length nil = 0;

fun test (_::_::_) = true
  | test _ = false;

fun power (x, 0) = 1
  | power (x, n) = x * power(x, n-1);

fun potenz (x,n) = if n<1 then 1 else x*potenz(x,n-1);

fun or (false, false) = false
  | or _ = true;
