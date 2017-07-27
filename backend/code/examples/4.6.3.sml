fn true => false
 | false => true;

fun test xs y = case rev xs
                of _::x::_ => x<y
                | _ => false;
