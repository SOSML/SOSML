/* TODO: tests
*/

const Lexer = require("../src/lexer");
const Parser = require("../src/parser");
const Value = require("../src/values");
const Errors = require("../src/errors");
const State = require("../src/state");
const InitialState = require("../src/initialState");
const API = require("../src/main");

const diff = require('jest-diff');
const chalk = require('chalk');

function printBasis( state: any, dynamicBasis: any, staticBasis: any, indent: number = 0 ): string {
    let istr = '';
    for( let i = 0; i < indent; ++i ) {
        istr += '  ';
    }
    let out = '';
    let stsym = '>';
    for( let i in dynamicBasis.valueEnvironment ) {
        if( dynamicBasis.valueEnvironment.hasOwnProperty( i ) ) {
            if( staticBasis ) {
                out += stsym + ' ' + istr + printBinding( state,
                    [ i, dynamicBasis.valueEnvironment[ i ],
                        staticBasis.getValue( i ) ] ) + '\n';
            } else {
                out += stsym + ' ' + istr + printBinding( state,
                    [ i, dynamicBasis.valueEnvironment[ i ], undefined ] ) + '\n';
            }
        }
    }

    for( let i in dynamicBasis.structureEnvironment ) {
        if( dynamicBasis.structureEnvironment.hasOwnProperty( i ) ) {
            out += stsym + ' ' + istr + 'structure ' + i + ' = {\n';
            if( staticBasis ) {
                out += printBasis( state, dynamicBasis.getStructure( i ),
                    staticBasis.getStructure( i ), indent + 1 );
            } else {
                out += printBasis( state, dynamicBasis.getStructure( i ),
                    undefined, indent + 1 );
            }
            out += stsym + ' ' + istr + '}\n';
        }
    }
    for( let i in dynamicBasis.functorEnvironment ) {
        if( dynamicBasis.functorEnvironment.hasOwnProperty( i ) ) {
            out += stsym + ' ' + istr + 'functor ' + i + ' = {\n';
            if( staticBasis ) {
                out += printBasis( state, dynamicBasis.getFunctor( i ),
                    staticBasis.getFunctor( i ), indent + 1 );
            } else {
                out += printBasis( state, dynamicBasis.getFunctor( i ),
                    undefined, indent + 1 );
            }
            out += stsym + ' ' + istr + '}\n';
        }
    }
    return out;
}

function printBinding( state: any, bnd: [ string, [any, any], [any, any] ] ): string {
    let res = '';

    if( bnd[ 1 ][ 0 ] instanceof Value.ValueConstructor ) {
        res += 'con';
    } else if( bnd[ 1 ][ 0 ] instanceof Value.ExceptionConstructor ) {
        res += 'exn';
    } else {
        res += 'val';
    }

    if( bnd[ 1 ] ) {
        if( bnd[ 2 ] && bnd[ 2 ][ 0 ].isOpaque( ) ) {
            res += ' ' + bnd[ 0 ] + ' = <' + bnd[ 2 ][ 0 ].getOpaqueName( ) + '>';
        } else {
            res += ' ' + bnd[ 0 ] + ' = ' + bnd[ 1 ][ 0 ].toString( state, new Value.PrintCounter() );
        }
    } else {
        return res + ' ' + bnd[ 0 ] + ' = undefined;';
    }

    if( bnd[ 2 ] ) {
        return res + ': ' + bnd[ 2 ][ 0 ].toString( state, new Value.PrintCounter() ) + ';';
    } else {
        return res + ': undefined;';
    }
}

function run( stuff: string, moreStuff: string[ ] = [ ], evaluate: boolean = true ) {
    it( stuff, ( ) => {
        //let tokens = Lexer.lex( stuff );
        //let ast = Parser.parse( tokens, InitialState.getInitialState( ) );
        //console.log(ast);
        //console.log(ast.simplify().toString());
        //return;
        // if( evaluate ) {
        //    let res = ast.simplify( ).evaluate( InitialState.getInitialState( ) );
        //}
        let out = stuff + '\n'; // + '\n ~> ' + ast.simplify().toString();
        try {

            let opts = {
                'allowUnicodeInStrings': false,
                'allowSuccessorML': true,
                'disableElaboration': false,
                'allowLongFunctionNames': false,
                'strictMode': true
            };

            if( evaluate ) {
                let usestdlib = true;
                let res = API.interpret( stuff, API.getFirstState(), opts );
                let i = 0;
                let st = API.getFirstState().id + 1;
                do {
                    if( res.evaluationErrored ) {
                        out += '\x1b[30;47;1mUncaught exception: '
                            + res.error + '\x1b[39;49;0m';
                        break;
                    } else {
                        out += printBasis( res.state,
                            res.state.getDynamicChanges( st - 1 ),
                            res.state.getStaticChanges( st - 1 ) );
                    }
                    if( res.warnings !== undefined ) {
                        for( let i = 0; i < res.warnings.length; ++i ) {
                            if( res.warnings[ i ].position >= -1 ) {
                                out += 'WARN: ' + res.warnings[ i ].message;
                            } else {
                                out += 'Printed: ' + res.warnings[ i ].message;
                            }
                        }
                    }
                    if( i < moreStuff.length ) {
                        st = res.state.id + 1;
                        out += '\n' + moreStuff[ i ] + '\n';
                        res = API.interpret( moreStuff[ i ], res.state, opts );
                    } else {
                        break;
                    }
                    //                out += 'State: ' + st + '\n';
                    // res[0].getDefinedIdentifiers().forEach((val: string) => {
                    //     out += val + ' ';
                    // });
                    // out += '\n';
                    ++i;
                } while( true );
            }
        } catch (e) {
            out += '\x1b[31;40;1m' + e + '\x1b[39;49;0m\n';
            console.log( out );
            throw e;
        }
        console.log( out );
    });
}

run('String.size "hia";');
run('String.sub ("hia", 1);');
run('String.sub ("hia", 10);');

run(`fun exists f nil = false
  | exists f (x::xr) = if exists f xr then true else f x;

val y = [false, false, true, false];
exists (fn x=>x) y;
val x = [false, false, true, false];
exists (fn x=>x) x;`);

//run(
//`signature ITERABLE =
//sig
    //type elem
    //type collection
    //val next : collection -> (elem * collection) option
//end;
//`,[
//`signature FOLD =
//sig
    //type elem
    //type collection
    //val fold : (elem * 'b -> 'b) -> 'b -> collection -> 'b
//end;
//`,
//`functor FoldFunctor(Iter : ITERABLE) :> FOLD =
//struct
    //type elem = Iter.elem
    //type collection = Iter.collection

    //fun fold f e xs =
        //case Iter.next xs of
            //NONE => e
          //| SOME (x, xs') => fold f (f (x, e)) xs'
//end;
//`,
//`structure I :> ITERABLE = struct
  //type elem = int;
  //type collection = int list;
  //fun next [] = NONE | next (x::xs) = SOME (x, xs);
//end;
//`,
//`structure S = FoldFunctor(I);
//`
//]);

//run('fn (a, b) => let val c = b 5 in c end;');
// run('datatype X = con; fun f x = let datatype X = con in con end;', ['val a = f 10;', 'val b = f 10;', 'datatype X = con;']);


//// run('signature a = b where type c=d and type e=f;');

//run('fun f x = x; val g = f f;');

//run('op +;');


//run(`fun pot [] = [[]]
  //| pot (x::xs) = let
    //val p = pot xs
  //in
    //p @ (List.map (fn a => x :: a) p)
  //end;`);

//run(`fun pot [] = [[]]
  //| pot (x::xs) = let
    //val p = pot xs
  //in
    //(List.map (fn a => x :: a) p) @ p
  //end;`);


//run('fun test xs y = case rev xs of _::x::_ => x<y | _ => false;');

//run('fun forall m n p = m>n orelse (p m andalso forall (m+1) n p);',
//['fun snd (_, y) = y;',

//'op+(8,9);',
//'op+(8.0, 9.0);',
//'op+;']);

//run(`fun insert (x, nil) = [x]
  //| insert (x, y::yr) = if x<=y then x::y::yr else y::insert(x,yr);`,
//['fun isort xs = foldl insert nil xs;',
//`fun pisort compare =
    //let
        //fun insert (x, nil) = [x]
          //| insert (x, y::yr) = case compare(x,y) of
                                //GREATER => y::insert(x,yr)
                                //| _ => x::y::yr
    //in
        //foldl insert nil
    //end;`,
//'val xs = List.tabulate(5000, fn x => x);',
//'val ys = rev xs;']);


//run('datatype D = A | B; fun f A = A | f A = B | f B = B;');
//run('fun f 0 = 1 | f 0 = 0;');

//run('fun f (a::b, 3::b) = b;');

//run('fun f x as (a::b) = b;');

//run('fun f ((0, x), 0) = 0 | f ((x, 1), x) = 1;');
//run('fun f (x, 0) = 0 | f (1, x) = 1;');
 //run('fun f (x, 0) = 0 | f _ = 5 | f (1, x) = 1;');
 //run('fun f x = 0 | f 1 = 1;');
 //run('fun f true = false;');
 //run('fun f true = false | f false = true;');
 //run('fun f (x, y) = 3 | f (1, 2) = 3;');
 //run('fun f (x, y) = 3;');
 //run('fun f [] = 1 | f (1::[]) = 3;');
 //run('fun f [] = 1 | f (x::y) = 3;');
 //run('fun f [] = [] | f (3::xs) = xs;');

//run('fn x:int*int => x;');
//run('datatype D = A | B; fun f (A, A) = B | f (B, B) = A;');
//run('datatype D = A | B; fun f ((A,_), A) = B | f ((B, A), A) = A | f ((B, B), _) = B | f (_, B) = A;');
//run('datatype D = A | B; fun f (A, A) = B | f (B, B) = A | f (A, B) = B | f (B, A) = A;');

//run(`structure S = struct
  //datatype L = n | c of int * L;
//end;`, ['fun f S.n = [] | f (S.c (2, x)) = [];']);
//run(`structure S = struct
  //fun shout_then_apply f = (print "I should be printed first.\\n"; f)
  //fun id x = x
  //val _ = shout_then_apply id (print "I should be printed second.\\n")
//end;`);

 //run('signature a = sig type b = c end;');

 //run('fun plus x y : real = x + y;');

 //run('fun g x y = g x y and f x y = g x x;');
//run(`datatype X = con;
//local
    //datatype X = con;
//in
    //val x = con;
//end;
//val y = let
    //datatype X = con;
//in
    //con
//end;
//datatype X = con;
//val z = con;`, [

//'x = y;',
//'x = z;',
//'y = z;']);

//run(`fun id x = x;

//fun getDelayed x =
//let
    //val t = ref x;
//in
    //fn y => let
        //val old = !t
    //in
        //(t := y; old)
    //end
//end;

//val 'a f = getDelayed (fn x:'a => x);

//val g = (f (fn x => x + 1));
//val h = (f (fn x => x + 1.0));

//h 1.0;`);
//run(`signature ISET = sig
  //type set
  //val set : int list -> set
  //val subset : set -> set -> bool
  //val union : set -> set -> set
//end;`,
//[`structure ISet :> ISET = struct
  //type set = int list
  //fun set xs = xs
  //fun union xs ys = xs@ys
  //fun elem ys x = List.exists (fn y => y=x) ys
  //fun subset xs ys = List.all (elem ys) xs
//end;`,

     //`val s = ISet.set [3,2];
     //val s' = ISet.set [5,9,4];
     //ISet.subset s s';`,

//`open ISet;`,
//`val s = union (set[1,2,3]) (set[3,4]);
//subset (set[1,4]) s;`]);

//run('fun f x y = if (f y x) then true else false;');

//run('val rec f = fn  x => fn y => f x x;');

//run('val rec f = fn x => f x x;');
//run('fun f x = f;');
//run(`datatype T = A;`,
//['val x = A;',
//'datatype T = B;',
//'val y = B;',
//`x = y;`]);


//run(`fun tabulate (n, f) = let
    //fun h i = if i<n then f i :: h (i+1) else []
//in
    //if n < 0 then raise Match else h 0
//end;`, ['tabulate (10, fn v => 4) ;' ]);
//run("fun 'a iter (n:int) (s:'a) (f:'a->'a) : 'a = if n<1 then s else iter (n-1) (f s) f;");
//run("fun f (a:'x) b = let fun g (b:'x) = b in (a, g b) end;");
//run('signature a = b where type c=d and type e=f;');

//run('do print 3;');

//run(`signature QUEUE = sig
  //type 'a queue
  //val add : 'a -> 'a queue -> 'a queue
//end
//signature QUEUE' = sig
  //type 'a queue
  //val add : 'a -> 'a queue -> 'a queue
  //val head : 'a queue -> 'a
//end
//structure Queue : QUEUE = struct
  //type 'a queue = 'a list;
  //fun add x q = x :: q
//end;`, [
//`structure Queue :> QUEUE' = struct
  //open Queue;
  //fun head q = hd q;
//end;`]);

//run(`signature QUEUE = sig
  //type 'a queue
  //val add : 'a * 'a queue -> 'a queue
//end
//structure Queue :> QUEUE = struct
  //type 'a queue = 'a list;
  //fun add (x, q) = x :: q
//end;`);

//run(`signature QUEUE = sig
  //type 'a queue
  //val empty : 'a queue
//end
//structure Queue :> QUEUE = struct
  //val empty = nil
  //type 'a queue = 'a list
//end;`);

 //run("structure T :> sig type 'a t end = struct type 'a t = int list end;");
//run(`fun getDelayed x =
//let
    //val t = ref x
//in
    //fn y => let
        //val old = !t
    //in
        //(fn () => old) (t := y)
    //end
//end;`, ['val f = getDelayed (fn x => x);'];
//run(`fun getDelayed x =
//let
    //val t = ref x
//in
    //fn y => let
        //val old = !t
    //in
        //t := y ; old
    //end
//end;`, ['val f = getDelayed (fn x => x);'];


//run("datatype 'a L = n | c of 'a * 'a L;", [
    //'datatype G = datatype L;',
    //'fun f (x : int G) = x;',
    //'f n;']);

//run("fun 'a iter (n:int) (s:'a) (f:'a->'a) : 'a = if n<1 then s else iter (n-1) (f s) f;");
//run(`signature QUEUE = sig
  //type 'a queue
  //val empty : 'a queue
  //val snoc : 'a queue -> 'a -> 'a queue
  //val head : 'a queue -> 'a (* Empty *)
  //val tail : 'a queue -> 'a queue (* Empty *)
//end;`, [
    //`structure Queue :> QUEUE = struct
  //type 'a queue = 'a list
  //val empty = nil
  //fun snoc q x = q@[x]
  //val head = hd
  //val tail = tl
//end;`,
    //'Queue.empty;', 'Queue.snoc it 3;', 'Queue.head it;',
//`structure FQueue :> QUEUE = struct
  //type 'a queue = 'a list * 'a list
  //val empty = ([],[])
  //fun snoc ([],_) x = ([x],[])
    //| snoc (q, r) x = (q, x::r)
  //fun head (q, r) = hd q
  //fun tail ([x], r) = (rev r, [])
    //| tail ( q , r) = (tl q, r)
//end;`,
    //'FQueue.empty;', 'FQueue.snoc it 3; val _ = print it;', 'FQueue.head it;',
//]);

 //run('fn _ => 3;');
 //run('fun a _ = 5;');

 //run('fn (x as [_, b]) => [b, 3]; it [1, 2];');
 //run('fn (x as _) => [0, 0];');

 //run('val a as [x, _, d] = [1, 2, 5];');

//run(`fun id x = x;

//fun getDelayed x =
//let
    //val t = ref x;
//in
    //fn y => let
        //val old = !t
    //in
        //(t := y; old)
    //end
//end;`, ['val f = getDelayed id;', 'val g = (f (fn x => x + 1));', 'val h = (f (fn x => x + 1.0));']);

//run(`fun id x = x;

//fun getDelayed x =
//let
    //val t = ref x;
//in
    //fn y => let
        //val old = !t
    //in
        //(t := y; old)
    //end
//end;

//val f = getDelayed id;

//val g = (f (fn x => x + 1));
//val h = (f (fn x => x + 1.0));`);


//run("datatype 'a E = e of 'a * 'a E | f;",
    //['infixr e;', 'val (x e y e f) = 3 e 4 e f;']);

 //run('[[[[]]]];');
//run('datatype (\'a, \'b) L = n | c of (\'b * \'a) * (\'b, \'a) L;', [
    //'c ((3.0, 1), c ((1, 3.0), n));']);
//run('val [f, g] = [1, 3];');

//run("fun quadrat' (y:int) = y * (y - 1) + y ;");


 //run("fun f (a:'x) b = let fun g (b:'x) = b in (a, g b) end;");
 //run("fun f (a:'x) c = let fun g (b:'x) = b in (a, g c) end;");



 //run('let val r = ref (fn (x, y) => x) in r end;');
 //run('val r = ref (fn x => x); r := (fn () => ()); 1 + (!r 4);');

 //run('fn (a, b) => let val c = b 5 in c end;');


//run('val r = ref (fn x => x);', [
    //'r := (fn (x, y) => (y, x));',
    //'r;',
    //'r := (fn (2, 3) => (3, 2));',
    //'r;',
//]);

  //run("val a = fn (x: 'a->'a) => x; a (fn (x,y) => (y,x));");



 //run('do print 42;');

//run('structure S = struct val a = 4 fun f x = x+1 end;', ['open S S;']);

//run('structure S = struct val a = 4 fun f x = x+1 end;', [ 'S.a;', 'S.f(2*S.a + S.a);' ]);

//run('structure S = struct val a = 4 exception E datatype t = A | B structure T = struct val a = a+3 end end;', ['S.T.a;', 'fun switch S.A = S.B | switch S.B = S.A;', 'open S.T;']);

 //run('fun check (n, m) = if n = m then n else raise Match;');


  //run('fun f 0 a b = b | f n a b = f (n-1) b (a + b) 3; f 1 0 1;');



 //run('fn x => x;');

 //run("fun f (a:'x) b = let fun g (b:'x) = b in (a, g b) end;");

 //run('exception Blob; fun f x = raise Blob; exception Blob; f 42 handle Blob => false;');

 //run('let do if true then print 5; in 5 end;');


//run('fun ! (a : \'a ref): \'a = ! a; !;', [
    //'fun op := ((a, b) : (\'a ref * \'a)): unit = a := b; op :=;',
   //'fun ref (a : \'a): \'a ref = ref a; ref;',
   //'val a = ref 0;', 'local val _ = a := 10; in val b = !a end;', 'b; !a;']);
//run('val a = ref 0;', ['local val _ = a := 10; in val b = !a end;', 'b; !a;']);


//run('fn (a, b) => (a * b : real);');


//run('fun hd (x::xs) = x;', [
   //' fun tl (x::xs) = xs;',
   //'fun append (xs,ys) = if xs=nil then ys else hd xs :: append(tl xs, ys);',
   //'fun null nil = true | null _ = false;',
   //'fun match (a,ts) t = if null ts orelse hd ts <> t ' +
           //'                      then raise Match ' +
           //'                      else (a, tl ts);',
           //'fun parse p ts = case p ts of ' +
           //'                  (a,nil) => a ' +
           //'                  | _ => raise Match ' +
   //';']);
 //run('fun extend (a,ts) p f = let val (a\',tr) = p ts in (f(a,a\'),tr) end;');
 //run('fn x => (fn y => (fn x => y) x) y;');

//run('val f : real -> real = fn x => x;');

//run('(case 2 of 1 => true) handle Match => false;');


 //run( 'fun map f nil = nil | map f (x::xr) = (f x) :: (map f xr);' );




 //run('val (x, y) = (2, 3);', ['fun f x = fn x => #1(x,y);',
    //'val y = x*y;',
    //'fun g g = f x g;']);


 //run( 'fun f a b c = b (a c);' );

//run( 'fun f 0 = 42 | f x = f (x - 1);', ['f 0;'] );

 //run( 'fun f a b = a b + a b; ');

 //run('fun f 0 b c = c | f n b c = f (n-1) c (b+c); f 5 0 1;');


 //run('type \'a il = \'a list; exception E of int il list;');

 //run('type i = int; datatype D = d of i; d 3;');




//run('[];');
 //run('[[1]];');


//run("datatype 'a tree = T of 'a * 'a tree list;", [
    //'val t1 = T (1, []);',
    //'val t2 = T (2, [t1, t1, t1]);',
    //'val t3 = T (4, [T (3, [t2]), t1, t2]);']);


//run('datatype tree = T of tree list;', [
     //'val t1 = T[];',
     //'val t2 = T[t1, t1, t1];',
     //'val t3 = T[T[t2], t1, t2];']);


//run('val x = 2; fun f x = 2;', ['f 2 = 2;', ' print f;']);
//run('infixr f; fun a f b = 42;');

//run("datatype 'a ltr = L of 'a * 'a ltr list;");
//run('nonfix ::;', [':: {1 = 1, 2 = :: {1 = 2, 2 = :: {1 = 3, 2 = :: {1 = 4, 2 = :: {1 = 5, 2 = nil}}}}};']);

//run('abstype tree = T of tree list with  fun empty _ = T []; fun combine (T a) (T b) = (T (a @ b)); end;', ['combine (empty 1) (empty 2);']);

//run('local datatype L = l of int | a; fun r x = 3; in val empty = a; fun new x = l x; end;', ['new 3;']);

//run('val r = ref 0;', ['val it = (r := 25; !r);']);
 //run('val ref a = ref 0;');

 //run('val a = ref 0;', [
     //'fun f x = (!a, a := (!a) + x, !a);',
     //'(f 1; f 2);',
     //'f 5;'
 //];

    
//run('print; fun f 0 = 1 | f 1 = 1 | f n = (it n; f (n-1) + f (n-2)); f 5;');



//run('type (\'a, \'b) c = int; exception E of (int, int) c;');

//run('exception a of int * int -> bool;');

//run('datatype \'a L = l of int; exception Match of \'a L -> int;', ['(case 2 of 1 => true) handle Match => false;']);

////run('infix 1 f; infixr 1 g; infix h; a f b h c g d;');
////run('infixr +; infix -;', ['1 + 2 - 3;']);
////run('infixr +; infix -;', ['1 - 2 + 3;']);
////run('infixr 5 @;', ['fun (x::xr) @ ys = x::(xr @ ys);']);
////run('fun hd nil = raise Empty | hd (x::xr) = x;');

////run('exception Overflow;', [ 'exception New;',
    ////'exception Newer of int;',
    ////'fun test New = 0 | test (Newer x) = x | test _ = ~1;',
    ////'test New;',
    ////'test (Newer 23123);',
    ////'test Overflow;']);

////run('type var = string;', [
    ////'datatype exp = C of int | V of var | A of exp * exp | M of exp * exp;',
    ////'val e = M(A(M(C 2, V "x"), V "y"), A(V "x", C 3));',
    ////'type env = var -> int;',
    ////'exception Unbound;',
    ////'val env = fn "x" => 5 | "y" => 3 | _ => raise Unbound;',
    ////'fun eval env (C c) = c | eval env (V v) = env v | eval env (A(e,e\')) = eval env e + eval env e\' | eval env (M(e,e\')) = eval env e * eval env e\';',
    ////'eval env e;']);


////run( ';', ['fun f 0 = 1 | f 1 = 1 | f n = f (n-1) + f (n-2);', 'f 5;']);

////run(';', [
    ////'fun compose f g x = f (g x);',
    ////'fun plus x y = x+y;',
    ////'fun times x y = x*y;',
    ////'val foo = compose (plus 2) (times 3);',
    ////'foo 4;']);


////run(';', ['val x = 10;', 'fun f _ = x;', 'val x = 42;', 'f 0;']);

////run('if false then 2 else 3;' );

////run('1 div 0;');
////run('exception E of int; exception E;', ['exception E of \'a * exn;']);
////run('fn x => ~x;', ['val a = it 3;']);
////run('(fn true => 1 | false => 2) false;');
////run( 'if true then if false then 2 else 3 else 4;' );
////run('fun mul a = fn b => a * b;', ['mul 7;', 'it 3;']);
////run('val mul = fn a => fn b => a * b;', ['mul 7;', 'it 3;']);


////run('op +;');

////run( 'let local fun a 1 = 1; val b = a 2; in val d = print("Hello") end in 1 end;' );
////run( 'let local fun a 1 = 1; val b = a 2; val c = print "1" in val d = print("Heelo") end in 1 end handle Match => 2;' );
////run( '[1,2,3,4];' );
////run( 'print [1,2,3]; print "Test";' );

////run( '42 * 42; it * it;' );


////run( "infix f;");
////run( "val ('a, 'b) (_,_) = (1,2);");
////run( "val (_,_) = (42, 42);" );
////run( "val (_) = 42;" );
////run( "0 andalso 1 orelse 2 andalso 3 orelse 4 andalso 5;" );
////run("#1 (2,3);");
////run("#a (2,3);");
////run("42: { 1337: 'a, * : 'b, uiaeui: int };");
////run("if true then true else false;");
////run("val a = b 42 : int * int list -> int list list;");
////run("type a = int * int list -> int list list;");
////run("type a = int * int;");
////run("type a = int list list;");
////run("42; val x = 10;");
////run("val a = 1 + (2 + 3);");
////run("val a = 1 + 2 + 3 < f 4 + 5;");
////run("val a = 42;");
////run(";");
////run("fun f x = f x;");
////run("op <;");
////run("3 + 5;");
////run("(); {};");

////run("val it = [ 1, 2, 3, 4, 5];");
////run("nonfix f; fun f (1, 2) = 3 | f _ = 4;");
////run("infix f; fun op f (1, 2) = 3 | _ f _ = 4;");
////run("infix f; fun (1 f 2) = 3 | _ f _ = 4;");

////run("3 + 5 : int : int;");
////run("while true do 42;");
////run("val x _ = 42;");

////run(";;42;");
////run("val {x:int as _} = 42;");
////run("datatype blub = X of 'a | Y of 'b;");
////run("local val it = 42 in end;");
////run("val _ = 42 and rec _ = 42 and _ = 42;");
////run("let val it = 42 in 42 end;");
////run("val {x:int as _} = 42;");
////run("val {x as _} = 42;");
////run("val {x:int} = 42;");
////run("infix * + /;");
////run("op =; op *;");
////run("val x = (1;2); val x = case 1 of (_) => 2;");
////run("val (_) = 2;");
////run("val rec f = fn a => a and f = fn a => a;");
////run("val rec f = 3;");
////run("val rec (f,g) = (fn a => a, fn b => b);");
////run("val x = #1;");
////run("val rec _ = fn a => a;");


////run( "nonfix =;", ['= (2,3);'] );

////run( 'fun f 0 = 1 | f 1 = 1 | f n = f (n-1) + f (n-2);', [
    ////'f 10;',
    ////"datatype 'a L = l of 'a * 'a L list;",
    ////'fun l (1, []) = "1";',
    ////'l (2, []) handle Match => "Hello";',
    ////'[ 1, 2,3 ];',
    ////'val a = 1.1;',
    ////'nonfix =;',
    ////'val a = = (1,2);',
    ////'val it = op = (1, 2);',
    ////'val b = it;'
////]);

////run("exception error;", ['(raise error;true) orelse true handle error => false;', 'error;']);


