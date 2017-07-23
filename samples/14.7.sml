functor Set
(
  type t
  val compare : t * t -> order
)
:>
sig
  type set
  val set : t list -> set
  val union : set -> set -> set
  val subset : set -> set -> bool
end
=
struct
  type set = t list
  val set = ssort compare
  val union = smerge compare
  val subset = ssublist compare
end;

structure StringSet = Set(type t = string
                        val compare = String.compare);
