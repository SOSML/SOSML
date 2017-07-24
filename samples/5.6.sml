fun pf'(k,n) = if k*k>n then [n] else
                if n mod k = 0 then k::pf'(k, n div k)
                else pf'(k+1,n);
fun pf n = pf'(2,n);
pf 1989;
