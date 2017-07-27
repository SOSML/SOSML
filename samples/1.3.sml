fun quadrat (x:int) = x*x;

quadrat(2+3);
quadrat 4;

quadrat 2 + 3;
(quadrat 2) + 3;

quadrat 2 + quadrat 3;
quadrat (2 + quadrat 3);
quadrat (quadrat 3);

fun quadrat' (y:int) = y*(y-1)+y;
