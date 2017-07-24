const Lexer = require("../src/lexer");
const Parser = require("../src/parser");
const Errors = require("../src/errors");

const API = require("../src/main.ts");

const State = require("../src/state.ts");
const InitialState = require("../src/initialState.ts");
const Expr = require("../src/expressions.ts");
const Decl = require("../src/declarations.ts");
const Type = require("../src/types.ts");
const Val = require("../src/values.ts");

const TestHelper = require("./test_helper.ts");
TestHelper.init();

//TODO determine actual types
function run_test(commands): void {
    let oldTests = [];
    let state = InitialState.getInitialState();
    let exception;
    let value;
    for(let step of commands) {
        step[1](() => { [state, exception, value] = API.Interpreter.interpret(step[0], state); });

        step[2](state, exception, value);

        for(let test of oldTests)
            test[1](test[0][0], test[0][1], test[0][2]);

        oldTests.push([[state, exception, value], step[2]]);
    }
}

//TODO maybe explicitly check the all functions? (currently only != undefined)

it("1.1", () => {
    /*
val x = 4*7+3;
val y = x*(x-29);

val x = 7+4;
val y = x*(x-1);
val z = ~x*(y-2);
     */
    //TODO test types
    run_test([
        ['val x = 4*7+3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('x')).toEqualWithType(new Val.Integer(31));
            //expect(state.getStaticValue('x')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['val y = x*(x-29);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('y')).toEqualWithType(new Val.Integer(62));
            //expect(state.getStaticValue('y')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['val x = 7+4;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('x')).toEqualWithType(new Val.Integer(11));
            //expect(state.getStaticValue('x')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['val y = x*(x-1);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('y')).toEqualWithType(new Val.Integer(110));
            //expect(state.getStaticValue('y')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['val z = ~x*(y-2);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('y')).toEqualWithType(new Val.Integer(-1188));
            //expect(state.getStaticValue('z')).toEqualWithType(new Type.PrimitiveType('int'));
        }]
    ]);
});

it("1.2", () => {
    /*
val x = 4*7+3;
val y = (x-29)*x;

val a = x-y;
val b = x+y;

val a = x-y val b = x+y;
     */
    //TODO test types
    run_test([
        ['val x = 4*7+3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('x')).toEqualWithType(new Val.Integer(31));
            //expect(state.getStaticValue('x')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['val y = (x-29)*x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('y')).toEqualWithType(new Val.Integer(62));
            //expect(state.getStaticValue('y')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['val a = x-y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('a')).toEqualWithType(new Val.Integer(-31));
            //expect(state.getStaticValue('a')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['val b = x+y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('b')).toEqualWithType(new Val.Integer(93));
            //expect(state.getStaticValue('b')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['val a = x-y val b = x+y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('a')).toEqualWithType(new Val.Integer(-31));
            //expect(state.getStaticValue('a')).toEqualWithType(new Type.PrimitiveType('int'));
            expect(state.getDynamicValue('b')).toEqualWithType(new Val.Integer(93));
            //expect(state.getStaticValue('b')).toEqualWithType(new Type.PrimitiveType('int'));
        }]
    ]);
});

it("1.2.1", () => {
    /*
val x = 2;
val x = 3;
val y = x*x;
     */
    //TODO test types
    run_test([
        ['val x = 2;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('x')).toEqualWithType(new Val.Integer(2));
            //expect(state.getStaticValue('x')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['val x = 3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('x')).toEqualWithType(new Val.Integer(3));
            //expect(state.getStaticValue('x')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['val y = x*x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('y')).toEqualWithType(new Val.Integer(9));
            //expect(state.getStaticValue('y')).toEqualWithType(new Type.PrimitiveType('int'));
        }]
    ]);
});

it("1.2.2", () => {
    /*
val it = 4*7+3;
4*7+3;
val x = it+it;
it+it;
it-60;
     */
    //TODO test types
    run_test([
        ['val it = 4*7+3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(31));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['4*7+3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(31));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['val x = it+it;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('x')).toEqualWithType(new Val.Integer(62));
            //expect(state.getStaticValue('x')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['it+it;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(62));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitveType('int'));
        }],
        ['it-60;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(2));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
    ]);
});

it("1.2.3", () => {
    /*
vall x = 5;
     */
    run_test([
        ['vall x = 5;', (x) => { expect(x).toThrow(Errors.EvaluationError); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
        }]
    ]);
});

it("1.3", () => {
    /*
fun quadrat (x:int) = x*x;

quadrat(2+3);
quadrat 4;

quadrat 2 + 3;
(quadrat 2) + 3;

quadrat 2 + quadrat 3;
quadrat (2 + quadrat 3);
quadrat (quadrat 3);

fun quadrat' (y:int) = y*(y-1)+y;
     */
    //TODO test types
    run_test([
        ['fun quadrat (x:int) = x*x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('quadrat')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['quadrat(2+3);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(25));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['quadrat 4;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(16));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['quadrat 2 + 3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(7));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['(quadrat 2) + 3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(7));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['quadrat 2 + quadrat 3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(13));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['quadrat (2 + quadrat 3);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(121));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['quadrat (quadrat 3);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(81));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['fun quadrat\' (y:int) = y*(y-1)+y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('quadrat\'')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('quadrat\'')).toEqualWithType(TODO);
        }]
    ]);
});

it("1.4", () => {
    /*
3<3;
3<=3;
3>=3;
3=3;
3<>3;

if false then 5 else 7;
if true then 5 else 7;

if 4<2 then 3*5 else 7*1;
if 4=2*2 then 3*5 else 7*1;

fun betrag (x:int) = if x<0 then ~x else x;
betrag ~3;

if 4<2 then 3 else if 2<3 then ~1 else 1;
     */
    //TODO test types
    run_test([
        ['3<3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.BoolValue(false));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('bool'));
        }],
        ['3<=3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.BoolValue(true));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('bool'));
        }],
        ['3>=3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.BoolValue(true));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('bool'));
        }],
        ['3=3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.BoolValue(true));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('bool'));
        }],
        ['3<>3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.BoolValue(false));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('bool'));
        }],
        ['if false then 5 else 7;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(7));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['if true then 5 else 7;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(5));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['if 4<2 then 3*5 else 7*1;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(7));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['if 4=2*2 then 3*5 else 7*1;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(15));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['fun betrag (x:int) = if x<0 then ~x else x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('betrag')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['betrag ~3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(3));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['if 4<2 then 3 else if 2<3 then ~1 else 1;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(-1));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }]
    ]);
});

it("1.5", () => {
    /*
val a = 2*2;
val b = a*a;
val c = b*b;

fun hoch8 (x:int) =
    let
        val a = x*x
        val b = a*a
    in
        b*b
    end;
hoch8 2;

fun q (y:int) = y*y;
fun hoch8 (x:int) = q (q (q x));
     */
    //TODO test types
    run_test([
        ['val a = 2*2;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('a')).toEqualWithType(new Val.Integer(4));
            //expect(state.getStaticValue('a')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['val b = a*a;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('b')).toEqualWithType(new Val.Integer(16));
            //expect(state.getStaticValue('b')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['val c = b*b;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('c')).toEqualWithType(new Val.Integer(256));
            //expect(state.getStaticValue('c')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['fun hoch8 (x:int) = let val a = x*x val b = a*a in b*b end;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('hoch8')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('hoch8')).toEqualWithType(TODO);
        }],
        ['hoch8 2;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(256));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['fun q (y:int) = y*y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('q')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('q')).toEqualWithType(TODO);
        }],
        ['fun hoch8 (x:int) = q (q (q x));', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('hoch8')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('hoch8')).toEqualWithType(TODO);
        }]
    ]);
});

it("1.6", () => {
    /*
(7, 2, true, 2);
(7+2, 2*7);

();

val x = (5-2, 1<2, 2*2);
#3 x;
#2 x;
     */
    //TODO test types
    run_test([
        ['(7, 2, true, 2);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.RecordValue(new Map([
                ['1', new Val.Integer(7)],
                ['2', new Val.Integer(2)],
                ['3', new Val.BoolValue(true)],
                ['4', new Val.Integer(2)]
            ])));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['(7+2, 2*7);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.RecordValue(new Map([
                ['1', new Val.Integer(9)],
                ['2', new Val.Integer(14)]
            ])));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['();', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.RecordValue(new Map([])));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['val x = (5-2, 1<2, 2*2);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('x')).toEqualWithType(new Val.RecordValue(new Map([
                ['1', new Val.Integer(3)],
                ['2', new Val.BoolValue(true)],
                ['3', new Val.Integer(4)]
            ])));
            //expect(state.getStaticValue('x')).toEqualWithType(TODO);
        }],
        ['#3 x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(4));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['#2 x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.BoolValue(true));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('bool'));
        }]
    ]);
});

it("1.7", () => {
    /*
val (x,y) = (3,4);

val (x,y) = (y,x);

fun swap (p:int*int) = (#2p, #1p);
fun swap (p:int*int) = let val (x,y) = p in (y,x) end;
fun swap (x:int, y:int) = (y,x);

fun max (x:int, y:int) = if x<y then y else x;
max (5,3);
max (~5,3);
     */
    //TODO test types
    run_test([
        ['val (x,y) = (3,4);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('x')).toEqualWithType(new Val.Integer(3));
            //expect(state.getStaticValue('x')).toEqualWithType(new Type.PrimitiveType('int'));
            expect(state.getDynamicValue('y')).toEqualWithType(new Val.Integer(4));
            //expect(state.getStaticValue('y')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['val (x,y) = (y,x);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('x')).toEqualWithType(new Val.Integer(4));
            //expect(state.getStaticValue('x')).toEqualWithType(new Type.PrimitiveType('int'));
            expect(state.getDynamicValue('y')).toEqualWithType(new Val.Integer(3));
            //expect(state.getStaticValue('y')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['fun swap (p:int*int) = (#2p, #1p);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('swap')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('swap')).toEqualWithType(TODO);
        }],
        ['fun swap (p:int*int) = let val (x,y) = p in (y,x) end;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('swap')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('swap')).toEqualWithType(TODO);
        }],
        ['fun swap (x:int, y:int) = (y,x);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('swap')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('swap')).toEqualWithType(TODO);
        }],
        ['fun max (x:int, y:int) = if x<y then y else x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('max')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('max')).toEqualWithType(TODO);
        }],
        ['max (5,3);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(5));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['max (~5,3);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(3));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }]
    ]);
});

it("1.8", () => {
    /*
12 div 3;
12 mod 3;
12 div 5;
12 mod 5;

1 div 0;
     */
    //TODO test types
    run_test([
        ['12 div 3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(4));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['12 mod 3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(0));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['12 div 5;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(2));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['12 mod 5;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(2));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['1 div 0;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(true);
            expect(exceptionValue).toEqualWithType(new Val.ExceptionValue('Div'));
        }]
    ]);
});

it("1.9", () => {
    /*
fun potenz (x:int, n:int) : int =
    if n>0 then x*potenz(x,n-1) else 1;

potenz (2,10);
     */
    //TODO test types
    run_test([
        ['fun potenz (x:int, n:int) : int = if n>0 then x*potenz(x,n-1) else 1;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('potenz')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('potenz')).toEqualWithType(TODO);
        }],
        ['potenz (2,10);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(1024));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }]
    ]);
});

it("1.10", () => {
    /*
fun w (k:int,n:int) : int = if k*k>n then k else w(k+1,n);
fun wurzel (n:int) = w(1,n)-1;
wurzel 15;
     */
    //TODO test types
    run_test([
        ['fun w (k:int,n:int) : int = if k*k>n then k else w(k+1,n);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('w')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('w')).toEqualWithType(TODO);
        }],
        ['fun wurzel (n:int) = w(1,n)-1;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('wurzel')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('wurzel')).toEqualWithType(TODO);
        }],
        ['wurzel 15;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(3));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }]
    ]);
});

it("1.11", () => {
    /*
fun w (k:int, n:int) : int = if k*k>n then k else w(k+1,n);

fun p (a:int, x:int, n:int) : int = if n<1 then a else p(a*x,x,n-1);
fun potenz (x:int, n:int) = p(1,x,n);
     */
    //TODO test types
    run_test([
        ['fun w (k:int,n:int) : int = if k*k>n then k else w(k+1,n);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('w')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('w')).toEqualWithType(TODO);
        }],
        ['fun p (a:int, x:int, n:int) : int = if n<1 then a else p(a*x,x,n-1);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('p')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('p')).toEqualWithType(TODO);
        }],
        ['fun potenz (x:int, n:int) = p(1,x,n);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('potenz')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('potenz')).toEqualWithType(TODO);
        }]
    ]);
});

it("1.12", () => {
    /*
fun p (x:int) : int = p x;

fun q (x:int) : int = 0 + q x;

val it = q 0;
     */
    //TODO test types
    run_test([
        ['fun p (x:int) : int = p x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('p')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('p')).toEqualWithType(TODO);
        }],
        ['fun q (x:int) : int = 0 + q x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('q')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('q')).toEqualWithType(TODO);
        }],
        /*
        ['val it = q 0;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            //TODO how to check for timeout?
        }]*/
    ]);
});

it("1.13.1", () => {
    /*
4*1073741823;
     */
    //TODO maybe this is no overflow for us yet?
    run_test([
        ['4*1073741823;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(true);
            expect(exceptionValue).toEqualWithType(new Val.ExceptionValue('Overflow'));
        }]
    ]);
});

it("1.13.2", () => {
    /*
4.5 + 2.0 * 5.5;

2 * 5.5;
     */
    //TODO test types
    run_test([
        ['4.5 + 2.0 * 5.5;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Real(15.5));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('real'));
        }],
        ['2 * 5.5;', (x) => { expect(x).toThrow(Errors.SemanticError); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
        }]
    ]);
});

it("1.13.3", () => {
    /*
1.0 / 3.0;
2.0 * 5.00000000001;
     */
    //TODO test types
    run_test([
        ['1.0 / 3.0;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Real(0.3333333333333333));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('real'));
        }],
        ['2.0 * 5.00000000001;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            // not the intended result from the book, but our reals have too many significant digits
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Real(10.00000000002));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('real'));
        }]
    ]);
});

it("1.13.4", () => {
    /*
fun newton (a:real, x:real, n:int) : real =
    if n<1 then a else newton (0.5*(a+x/a), x, n-1);

fun sqrt (x:real) = newton (x/2.0, x , 5);

sqrt 4.0;
sqrt 2.0;
sqrt 81.0;
     */
    //TODO test types
    run_test([
        ['fun newton (a:real, x:real, n:int) : real = if n<1 then a else newton (0.5*(a+x/a), x, n-1);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('newton')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('newton')).toEqualWithType(TODO);
        }],
        ['fun sqrt (x:real) = newton (x/2.0, x , 5);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('sqrt')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('sqrt')).toEqualWithType(TODO);
        }],
        ['sqrt 4.0;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Real(2));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('real'));
        }],
        ['sqrt 2.0;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            //TODO adjust the significant digits
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Real(1.41421356237));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('real'));
        }],
        ['sqrt 81.0;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            //TODO adjust the significant digits
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Real(9.00000941552));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('real'));
        }]
    ]);
});

it("1.14", () => {
    /*
Math.sqrt 4.0;
Real.fromInt 45;
Real.round 1.5;

Math.pi;
     */
    //TODO add the real test once we have modules
});

//TODO Chapter 2

it("3.1", () => {
    /*
fn (x:int) => x*x;
(fn (x:int) => x*x) 7;
fn (x:int, y:int) => x*y;
(fn (x:int, y:int) => x*y) (4,7);

fun mul (x:int) = fn (y:int) => x*y;
mul 7;
it 3;
mul 7 5;

fun mul (x:int, y:int) = x*y;
mul (7,5);

fun f (x:int) (y:int) (z:int) = x+y+z;
fun f (x:int) = fn (y:int) => fn (z:int) => x+y+z;
     */
    //TODO test types
    run_test([
        ['fn (x:int) => x*x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['(fn (x:int) => x*x) 7;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(49));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['fn (x:int, y:int) => x*y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['(fn (x:int, y:int) => x*y) (4,7);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(28));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['fun mul (x:int) = fn (y:int) => x*y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('mul')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('mul')).toEqualWithType(TODO);
        }],
        ['mul 7;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['it 3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(21));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['mul 7 5;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(35));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['fun mul (x:int, y:int) = x*y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('mul')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('mul')).toEqualWithType(TODO);
        }],
        ['mul (7,5);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(35));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['fun f (x:int) (y:int) (z:int) = x+y+z;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('f')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('f')).toEqualWithType(TODO);
        }],
        ['fun f (x:int) = fn (y:int) => fn (z:int) => x+y+z;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('f')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('f')).toEqualWithType(TODO);
        }]
    ]);
});

it("3.2", () => {
    /*
fun f (x:int) (y:int) = x+y;
val g = f 7;

fun f (x:int) (y:int) : int = f x y;
val g = f 7;
     */
    //TODO test types
    run_test([
        ['fun f (x:int) (y:int) = x+y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('f')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('f')).toEqualWithType(TODO);
        }],
        ['val g = f 7;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('g')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('g')).toEqualWithType(TODO);
        }],
        ['fun f (x:int) (y:int) : int = f x y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('f')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('f')).toEqualWithType(TODO);
        }],
        ['val g = f 7;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('g')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('g')).toEqualWithType(TODO);
        }]
    ]);
});

it("3.3", () => {
    /*
fun sum (f:int->int) (n:int) : int =
    if n<1 then 0 else sum f (n-1) + f n;

sum (fn (i:int) => i) 100;

sum (fn (i:int) => i*i) 10;

val gauss = sum (fn (i:int) => i);
     */
    //TODO test types
    run_test([
        ['fun sum (f:int->int) (n:int) : int = if n<1 then 0 else sum f (n-1) + f n;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('sum')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('sum')).toEqualWithType(TODO);
        }],
        ['sum (fn (i:int) => i) 100;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(5050));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['sum (fn (i:int) => i*i) 10;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(385));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['val gauss = sum (fn (i:int) => i);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('gauss')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('gauss')).toEqualWithType(TODO);
        }]
    ]);
});

it("3.3.1", () => {
    /*
fun iter (n:int) (s:int) (f:int->int) : int =
    if n<1 then s else iter (n-1) (f s) f;

fun power (x:int) (n:int) = iter n 1 (fn (a:int) => a*x);
power 2 10;
     */
    //TODO test types
    run_test([
        ['fun iter (n:int) (s:int) (f:int->int) : int = if n<1 then s else iter (n-1) (f s) f;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('iter')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('iter')).toEqualWithType(TODO);
        }],
        ['fun power (x:int) (n:int) = iter n 1 (fn (a:int) => a*x);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('power')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('power')).toEqualWithType(TODO);
        }],
        ['power 2 10;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(1024));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }]
    ]);
});

it("3.3.2", () => {
    /*
fun first (s:int) (p:int->bool) : int =
    if p s then s else first (s+1) p;

fun sqrt (x:int) = first 1 (fn (k:int) => k*k>x) - 1;
sqrt 15;
     */
    //TODO test types
    run_test([
        ['fun first (s:int) (p:int->bool) : int = if p s then s else first (s+1) p;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('first')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('first')).toEqualWithType(TODO);
        }],
        ['fun sqrt (x:int) = first 1 (fn (k:int) => k*k>x) - 1;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('sqrt')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('sqrt')).toEqualWithType(TODO);
        }],
        ['sqrt 15;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(3));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }]
    ]);
});

it("3.4", () => {
    /*
fun 'a iter (n:int) (s:'a) (f:'a->'a) : 'a =
    if n<1 then s else iter (n-1) (f s) f;

fun power (x:int) (n:int) = iter n 1 (fn (a:int) => a*x);
power 2 10;
fun power' (x:real) (n:int) = iter n 1.0 (fn (a:real) => a*x);
power' 2.0 10;

fun gauss (n:int) =
    #2(iter n (1,0) (fn (i:int, a:int) => (i+1, a+i)));
gauss 10;
     */
    //TODO test types
    run_test([
        ['fun \'a iter (n:int) (s:\'a) (f:\'a->\'a) : \'a = if n<1 then s else iter (n-1) (f s) f;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('iter')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('iter')).toEqualWithType(TODO);
        }],
        ['fun power (x:int) (n:int) = iter n 1 (fn (a:int) => a*x);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('power')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('power')).toEqualWithType(TODO);
        }],
        ['power 2 10;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(1024));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['fun power\' (x:real) (n:int) = iter n 1.0 (fn (a:real) => a*x);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('power')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('power')).toEqualWithType(TODO);
        }],
        ['power\' 2.0 10;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Real(1024));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('real'));
        }],
        ['fun gauss (n:int) = #2(iter n (1,0) (fn (i:int, a:int) => (i+1, a+i)));', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('gauss')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('gauss')).toEqualWithType(TODO);
        }],
        ['gauss 10;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(55));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }]
    ]);
});

it("3.5", () => {
    /*
fun ('a,'b) project2 (x:'a, y:'b) = y;
project2 (1,~1);
project2 (1,true);
     */
    //TODO test types
    run_test([
        ['fun (\'a,\'b) project2 (x:\'a, y:\'b) = y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('project2')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('project2')).toEqualWithType(TODO);
        }],
        ['project2 (1,~1);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(-1));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['project2 (1,true);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.BoolValue(true));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('bool'));
        }]
    ]);
});

it("3.5.1", () => {
    /*
fun 'a id (x:'a) = x;

val x = id 5;

val x = id 5.0;

val x = id(id 3, id 5.0);
     */
    //TODO test types
    run_test([
        ['fun \'a id (x:\'a) = x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('id')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('id')).toEqualWithType(TODO);
        }],
        ['val x = id 5;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('x')).toEqualWithType(new Val.Integer(5));
            //expect(state.getStaticValue('x')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['val x = id 5.0;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('x')).toEqualWithType(new Val.Real(5));
            //expect(state.getStaticValue('x')).toEqualWithType(new Type.PrimitiveType('real'));
        }],
        ['val x = id(id 3, id 5.0);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('x')).toEqualWithType(new Val.RecordValue(new Map([
                ['1', new Val.Integer(3)],
                ['2', new Val.Real(5)]
            ])));
            //expect(state.getStaticValue('x')).toEqualWithType(TODO);
        }]
    ]);
});

it("3.5.2", () => {
    /*
fun 'a id (x:'a) = x;

val f = id id;

val z = f 5;

val f = id id;
val z = f 5;

val f = id id;
val z = f 5;
val u = f 5.0;

val g = id;
     */
    //TODO we can't really test this unless we have ambigue types
});

it("3.6", () => {
    /*
fun con x y = if x then y else false;
fun sum f n = if n<1 then 0 else sum f (n-1) + f n;
val sqsum = sum (fn i => i*i);
fun id x = x;
fun iter n s f = if n<1 then s else iter (n-1) (f s) f;
fun power x n = iter n 1 (fn a => a*x);

fun plus x y = x+y;

fun plus (x:real) y = x+y;

fun plus x y : real = x+y;

fun plus (x:real) (y:real) : real = x+y;

fn (x,y) => (x+y : real) * x;
(fn x => x) : bool -> bool;

val f : real -> real = fn x => x;
     */
    //TODO test types
    run_test([
        ['fun con x y = if x then y else false;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('con')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('con')).toEqualWithType(TODO);
        }],
        ['fun sum f n = if n<1 then 0 else sum f (n-1) + f n;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('sum')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('sum')).toEqualWithType(TODO);
        }],
        ['val sqsum = sum (fn i => i*i);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('sqsum')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('sqsum')).toEqualWithType(TODO);
        }],
        ['fun id x = x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('id')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('id')).toEqualWithType(TODO);
        }],
        ['fun iter n s f = if n<1 then s else iter (n-1) (f s) f;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('iter')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('iter')).toEqualWithType(TODO);
        }],
        ['fun power x n = iter n 1 (fn a => a*x);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('power')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('power')).toEqualWithType(TODO);
        }],
        ['fun plus x y = x+y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('plus')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('plus')).toEqualWithType(TODO);
        }],
        ['fun plus (x:real) y = x+y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('plus')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('plus')).toEqualWithType(TODO);
        }],
        ['fun plus x y : real = x+y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('plus')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('plus')).toEqualWithType(TODO);
        }],
        ['fun plus (x:real) (y:real) : real = x+y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('plus')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('plus')).toEqualWithType(TODO);
        }],
        ['fn (x,y) => (x+y : real) * x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['(fn x => x) : bool -> bool;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['val f : real -> real = fn x => x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }]
    ]);
});

it("3.7", () => {
    /*
fun eq x y = x = y;
fun neq x y = x <> y;
fun f (x,y,z) = if x=y then x else z;
(fn x => 2*x) = (fn x => 2*x);
     */
    //TODO test types
    run_test([
        ['fun eq x y = x = y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('eq')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('eq')).toEqualWithType(TODO);
        }],
        ['fun neq x y = x <> y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('neq')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('neq')).toEqualWithType(TODO);
        }],
        ['fun f (x,y,z) = if x=y then x else z;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('f')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('f')).toEqualWithType(TODO);
        }],
        ['(fn x => 2*x) = (fn x => 2*x);', (x) => { expect(x).toThrow(Errors.SemanticError); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
        }]
    ]);
});

it("3.8.1", () => {
    /*
fn x => fn y => z x (y x);
     */
    run_test([
        ['fn x => fn y => z x (y x);', (x) => { expect(x).toThrow(Errors.SemanticError); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
        }]
    ]);
});

it("3.8.2", () => {
    /*
let
    val x = 2*x
    val x = 2*x
    fun f x = if x<2 then x
        else f(x-1)
    val f = fn x => f x
in
    f x - y
end;
     */
    run_test([
        ['let val x = 2*x val x = 2*x fun f x = if x<2 then x else f(x-1) val f = fn x => f x in f x - y end;', (x) => { expect(x).toThrow(Errors.SemanticError); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
        }]
    ]);
});

it("3.8.3", () => {
    /*
val x = 4*5;
fun f y = if y then x else ~x;
fun id z = z;
     */
    //TODO test types
    run_test([
        ['val x = 4*5;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('x')).toEqualWithType(new Val.Integer(20));
            //expect(state.getStaticValue('x')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['fun f y = if y then x else ~x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('f')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('f')).toEqualWithType(TODO);
        }],
        ['fun id z = z;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('id')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('id')).toEqualWithType(TODO);
        }]
    ]);
});

it("3.10", () => {
    /*
fun forall m n p = m>n orelse (p m andalso forall (m+1) n p);

fun snd (_, y) = y;

op+(8,9);
op+(8.0, 9.0);
op+;
     */
    //TODO test types
    run_test([
        ['fun forall m n p = m>n orelse (p m andalso forall (m+1) n p);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('forall')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('forall')).toEqualWithType(TODO);
        }],
        ['fun snd (_, y) = y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('snd')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('snd')).toEqualWithType(TODO);
        }],
        ['op+(8,9);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(17));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['op+(8.0, 9.0);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Real(17));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('real'));
        }],
        ['op+;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }]
    ]);
});

it("3.11", () => {
    /*
fun iter (n:int) (s:int) (f:int->int) : int =
    if n<1 then s else iter (n-1) (f s) f;
fun first (s:int) (p:int->bool) : int =
    if p s then s else first (s+1) p;
fun sqrt (x:int) = first 1 (fn (k:int) => k*k>x) - 1;
fun forall m n p = m>n orelse (p m andalso forall (m+1) n p);

fun prime x = x>=2 andalso
                forall 2 (sqrt x) (fn k => x mod k <> 0);

fun nextprime x = first (x+1) prime;

fun nthprime n = iter n 1 nextprime;
nthprime 100;
     */
    //TODO test types
    run_test([
        ['fun iter (n:int) (s:int) (f:int->int) : int = if n<1 then s else iter (n-1) (f s) f;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('iter')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('iter')).toEqualWithType(TODO);
        }],
        ['fun first (s:int) (p:int->bool) : int = if p s then s else first (s+1) p;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('first')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('first')).toEqualWithType(TODO);
        }],
        ['fun sqrt (x:int) = first 1 (fn (k:int) => k*k>x) - 1;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('sqrt')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('sqrt')).toEqualWithType(TODO);
        }],
        ['fun forall m n p = m>n orelse (p m andalso forall (m+1) n p);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('forall')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('forall')).toEqualWithType(TODO);
        }],
        ['fun prime x = x>=2 andalso forall 2 (sqrt x) (fn k => x mod k <> 0);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('prime')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('prime')).toEqualWithType(TODO);
        }],
        ['fun nextprime x = first (x+1) prime;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('nextprime')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('nextprime')).toEqualWithType(TODO);
        }],
        ['fun nthprime n = iter n 1 nextprime;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('nthprime')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('nthprime')).toEqualWithType(TODO);
        }],
        ['nthprime 100;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(541));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }]
    ]);
});

it("3.12", () => {
    /*
fun compose f g x = f (g x);

fun plus x y = x+y;
fun times x y = x*y;
val foo = compose (plus 2) (times 3);
foo 4;

val foo = (plus 2) o (times 3);
foo 7;
op o;
     */
    //TODO test types
    run_test([
        ['fun compose f g x = f (g x);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('compose')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('compose')).toEqualWithType(TODO);
        }],
        ['fun plus x y = x+y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('plus')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('plus')).toEqualWithType(TODO);
        }],
        ['fun times x y = x*y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('times')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('times')).toEqualWithType(TODO);
        }],
        ['val foo = compose (plus 2) (times 3);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('foo')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('foo')).toEqualWithType(TODO);
        }],
        ['foo 4;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(14));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['val foo = (plus 2) o (times 3);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('foo')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('foo')).toEqualWithType(TODO);
        }],
        ['foo 7;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(23));
            //expect(state.getStaticValue('it')).toEqualWithType(new Type.PrimitiveType('int'));
        }],
        ['op o;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }]
    ]);
});

it("3.13", () => {
    /*
fun iterup m n s f = if m>n then s else iterup (m+1) n (f(m,s)) f;
fun iterdn n m s f = if n<m then s else iterdn (n-1) m (f(n,s)) f;
     */
    //TODO test types
    run_test([
        ['fun iterup m n s f = if m>n then s else iterup (m+1) n (f(m,s)) f;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('iterup')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('iterup')).toEqualWithType(TODO);
        }],
        ['fun iterdn n m s f = if n<m then s else iterdn (n-1) m (f(n,s)) f;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('iterdn')).not.toEqualWithType(undefined);
            //expect(state.getStaticValue('iterdn')).toEqualWithType(TODO);
        }]
    ]);
});

//TODO Chapter 4

//TODO Chapter 5

//TODO Chapter 6

//TODO Chapter 7

//TODO Chapter 12

//TODO Chapter 13

//TODO Chapter 14

//TODO Exercises
