datatype day = Monday | Tuesday | Wednesday
            | Thursday | Friday | Saturday | Sunday;

fun weekend Saturday = true
  | weekend Sunday = true
  | weekend _ = false;

weekend Saturday;
map weekend [Monday, Wednesday, Friday, Saturday, Sunday];

(* rebinding is NOT allowed here *)
datatype bool = false | true;
datatype order = LESS | EQUAL | GREATER;
