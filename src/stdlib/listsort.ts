import { Module } from '../stdlib';

export let LISTSORT_LIB: Module = {
    'native': undefined,
    'code': `structure Listsort : sig
            val sort: ('a * 'a -> order) -> 'a list -> 'a list;
            val sorted: ('a * 'a -> order) -> 'a list -> bool;
            val mergeUniq: ('a * 'a -> order) -> 'a list * 'a list -> 'a list;
            val merge: ('a * 'a -> order) -> 'a list * 'a list -> 'a list;
            val eqclasses: ('a * 'a -> order) -> 'a list -> 'a list list;
        end = struct
          fun take ordr x1 xr []       = x1 :: xr
            | take ordr x1 xr (y1::yr) = (case ordr(x1, y1) of
                LESS    => x1 :: take ordr y1 yr xr
              | _       => y1 :: take ordr x1 xr yr);

          fun takeUniq ordr x1 xr []       = x1 :: xr
            | takeUniq ordr x1 xr (y1::yr) = (case ordr(x1, y1) of
                LESS    => x1 :: takeUniq ordr y1 yr xr
              | GREATER => y1 :: takeUniq ordr x1 xr yr
              | EQUAL   => takeUniq ordr x1 xr yr);

          fun merge ordr ([],     ys) = ys
            | merge ordr (x1::xr, ys) = take ordr x1 xr ys;

          fun mergeUniq ordr ([],     ys) = ys
            | mergeUniq ordr (x1::xr, ys) = takeUniq ordr x1 xr ys;

          fun mergepairs ordr l1  [] k              = [l1]
            | mergepairs ordr l1 (l2::lr) k =
              if k mod 2 = 1 then l1::l2::lr
              else mergepairs ordr (merge ordr (l1, l2)) lr (k div 2);

          fun nextrun ordr run []      = (run, [])
            | nextrun ordr run (x::xr) =
              if ordr(x, List.hd run) = LESS then (run, x::xr)
              else nextrun ordr (x::run) xr;

          fun sorting ordr []      ls r = List.hd(mergepairs ordr [] ls 0)
            | sorting ordr (x::xs) ls r = let
                val (revrun, tail) = nextrun ordr [x] xs
              in
                sorting ordr tail (mergepairs ordr (List.rev revrun) ls (r+1)) (r+1)
              end;

          fun group ordr last rest cs1 css = case rest of
              []     => cs1 :: css
            | r1::rr => if ordr(r1, last) = EQUAL then group ordr r1 rr (r1 :: cs1) css
                        else group ordr r1 rr [r1] (cs1 :: css);

          fun sort ordr []               = []
            | sort ordr [x]              = [x]
            | sort ordr [x1, x2]         = (case ordr(x1, x2) of
                GREATER => [x2, x1]
              | _       => [x1, x2])
            | sort ordr xs = sorting ordr xs [] 0;

          fun sorted ordr []           = true
            | sorted ordr [x]          = true
            | sorted ordr (x1::x2::xr) =
              ordr(x1, x2) <> GREATER andalso sorted ordr (x2::xr);

          fun eqclasses ordr xs = let
              val xs = List.rev (sort ordr xs)
            in
              case xs of
                  []     => []
                | x1::xr => group ordr x1 xr [x1] []
              end;
        end;
        structure List = struct
            open List;
            open Listsort;
        end;`,
    'requires': ['List']
};
