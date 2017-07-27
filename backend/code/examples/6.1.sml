datatype shape =
    Circle of real
  | Square of real
  | Triangle of real * real * real;

Circle 4.0;
Square 3.0;
Triangle (4.0, 3.0, 5.0);

fun area (Circle r) = Math.pi*r*r
  | area (Square a) = a*a
  | area (Triangle(a,b,c)) = let val s = (a+b+c)/2.0
                            in Math.sqrt(s*(s-a)*(s-b)*(s-c))
                            end;
area (Square 3.0);
area (Triangle(6.0, 6.0, Math.sqrt 72.0));
