fun append (nil, ys) = ys
  | append (x::xr, ys) = x::append(xr,ys);
append([2,3], [6,7,8]);

fun rev nil = nil
  | rev (x::xr) = rev xr @ [x];
rev [1, 2, 3, 4];

fun concat nil = nil
  | concat (x::xr) = x @ concat xr;


fun iterdn n m s f = if n<m then s else iterdn (n-1) m (f(n,s)) f;

fun tabulate (n,f) = iterdn (n-1) 0 nil (fn (i,xs) => f i::xs);

tabulate(5, fn x => x);
tabulate(5, fn x => x*x);

(* length, rev, List.concat, List.tabulate have to be predefined *)
