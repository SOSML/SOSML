signature QUEUE = sig
  type 'a queue
  val empty : 'a queue
  val snoc : 'a queue -> 'a -> 'a queue
  val head : 'a queue -> 'a (* Empty *)
  val tail : 'a queue -> 'a queue (* Empty *)
end;
structure Queue :> QUEUE = struct
  type 'a queue = 'a list
  val empty = nil
  fun snoc q x = q@[x]
  val head = hd
  val tail = tl
end;

structure FQueue :> QUEUE = struct
  type 'a queue = 'a list * 'a list
  val empty = ([],[])
  fun snoc ([],_) x = ([x],[])
    | snoc (q, r) x = (q, x::r)
  fun head (q, r) = hd q
  fun tail ([x], r) = (rev r, [])
    | tail ( q , r) = (tl q, r)
end;
