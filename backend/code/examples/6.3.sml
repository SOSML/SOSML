type point = real * real;

datatype object = Circle of point * real
                | Triangle of point * point * point;

fun mirror ((x,y):point) = (x,~y);

datatype point = Point of real * real;

Point (2.0, 3.0);
fun mirror (Point(x,y)) = Point(x,~y);
