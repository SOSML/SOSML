const Token = require("../src/tokens");
const Parser = require("../src/parser");
const Errors = require("../src/errors");

const API = require("../src/main.ts");

const State = require("../src/state.ts");
const Expr = require("../src/expressions.ts");
const Decl = require("../src/declarations.ts");
const Type = require("../src/types.ts");
const Val = require("../src/values.ts");

const TestHelper = require("./test_helper.ts");
TestHelper.init();

//TODO determine actual types
function run_test(commands): void {
    let oldTests = [];
    let state = API.getFirstState(true);
    let exception;
    let value;
    for(let step of commands) {
        step[1](() => {
            let res = API.interpret(step[0], state, {'allowLongFunctionNames': true});
            state = res['state'];
            exception = res['evaluationErrored'];
            value = res['error'];
        });

        step[2](state, exception, value);

        for(let test of oldTests)
            test[1](test[0][0], test[0][1], test[0][2]);

        oldTests.push([[state, exception, value], step[2]]);
    }
}

function createTuple(list: Val.Value[]): Val.RecordValue {
    let map = new Map<string, Val.Value>();

    for(let i = 0; i < list.length; ++i)
        map.set(''+(i+1), list[i]);

    return new Val.RecordValue(map);
}

function createList(list: Val.Value[]): Val.Value {
    let ret: Val.Value = new Val.ConstructedValue('nil');

    for(let i = list.length - 1; i >= 0; --i)
        ret = new Val.ConstructedValue('::', createTuple([list[i], ret]));

    return ret;
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
    run_test([
        ['val x = 4*7+3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('x')).toEqualWithType([new Val.Integer(31), 0]);
            expect(state.getStaticValue('x')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['val y = x*(x-29);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('y')).toEqualWithType([new Val.Integer(62), 0]);
            expect(state.getStaticValue('y')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['val x = 7+4;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('x')).toEqualWithType([new Val.Integer(11), 0]);
            expect(state.getStaticValue('x')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['val y = x*(x-1);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('y')).toEqualWithType([new Val.Integer(110), 0]);
            expect(state.getStaticValue('y')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['val z = ~x*(y-2);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('z')).toEqualWithType([new Val.Integer(-1188), 0]);
            expect(state.getStaticValue('z')).toEqualWithType([new Type.CustomType('int'), 0]);
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
    run_test([
        ['val x = 4*7+3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('x')).toEqualWithType([new Val.Integer(31), 0]);
            expect(state.getStaticValue('x')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['val y = (x-29)*x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('y')).toEqualWithType([new Val.Integer(62), 0]);
            expect(state.getStaticValue('y')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['val a = x-y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('a')).toEqualWithType([new Val.Integer(-31), 0]);
            expect(state.getStaticValue('a')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['val b = x+y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('b')).toEqualWithType([new Val.Integer(93), 0]);
            expect(state.getStaticValue('b')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['val a = x-y val b = x+y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('a')).toEqualWithType([new Val.Integer(-31), 0]);
            expect(state.getStaticValue('a')).toEqualWithType([new Type.CustomType('int'), 0]);
            expect(state.getDynamicValue('b')).toEqualWithType([new Val.Integer(93), 0]);
            expect(state.getStaticValue('b')).toEqualWithType([new Type.CustomType('int'), 0]);
        }]
    ]);
});

it("1.2.1", () => {
    /*
val x = 2;
val x = 3;
val y = x*x;
     */
    run_test([
        ['val x = 2;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('x')).toEqualWithType([new Val.Integer(2), 0]);
            expect(state.getStaticValue('x')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['val x = 3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('x')).toEqualWithType([new Val.Integer(3), 0]);
            expect(state.getStaticValue('x')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['val y = x*x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('y')).toEqualWithType([new Val.Integer(9), 0]);
            expect(state.getStaticValue('y')).toEqualWithType([new Type.CustomType('int'), 0]);
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
    run_test([
        ['val it = 4*7+3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType([new Val.Integer(31), 0]);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['4*7+3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType([new Val.Integer(31), 0]);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['val x = it+it;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('x')).toEqualWithType([new Val.Integer(62), 0]);
            expect(state.getStaticValue('x')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['it+it;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType([new Val.Integer(62), 0]);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['it-60;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType([new Val.Integer(2), 0]);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
    ]);
});

it("1.2.3", () => {
    /*
vall x = 5;
     */
    run_test([
        ['vall x = 5;', (x) => { expect(x).toThrow(Errors.ElaborationError); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
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
    run_test([
        ['fun quadrat (x:int) = x*x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('quadrat')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('quadrat')).toEqualWithType([new Type.FunctionType(new Type.CustomType('int', [], 15), new Type.CustomType('int', [], 15), 0), 0]);
        }],
        ['quadrat(2+3);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType([new Val.Integer(25), 0]);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int', [], 15), 0]);
        }],
        ['quadrat 4;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType([new Val.Integer(16), 0]);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int', [], 15), 0]);
        }],
        ['quadrat 2 + 3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType([new Val.Integer(7), 0]);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int', [], 15), 0]);
        }],
        ['(quadrat 2) + 3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType([new Val.Integer(7), 0]);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int', [], 15), 0]);
        }],
        ['quadrat 2 + quadrat 3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType([new Val.Integer(13), 0]);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int', [], 15), 0]);
        }],
        ['quadrat (2 + quadrat 3);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType([new Val.Integer(121), 0]);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int', [], 15), 0]);
        }],
        ['quadrat (quadrat 3);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType([new Val.Integer(81), 0]);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int', [], 15), 0]);
        }],
        ['fun quadrat\' (y:int) = y*(y-1)+y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('quadrat\'')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('quadrat\'')).toEqualWithType([new Type.FunctionType(
                new Type.CustomType('int', [], 16),
                new Type.CustomType('int', [], 16)
            , 0), 0]);
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
    run_test([
        ['3<3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType([new Val.BoolValue(false), 0]);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('bool'), 0]);
        }],
        ['3<=3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType([new Val.BoolValue(true), 0]);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('bool'), 0]);
        }],
        ['3>=3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType([new Val.BoolValue(true), 0]);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('bool'), 0]);
        }],
        ['3=3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType([new Val.BoolValue(true), 0]);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('bool'), 0]);
        }],
        ['3<>3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType([new Val.BoolValue(false), 0]);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('bool'), 0]);
        }],
        ['if false then 5 else 7;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType([new Val.Integer(7), 0]);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['if true then 5 else 7;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType([new Val.Integer(5), 0]);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['if 4<2 then 3*5 else 7*1;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType([new Val.Integer(7), 0]);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['if 4=2*2 then 3*5 else 7*1;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType([new Val.Integer(15), 0]);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['fun betrag (x:int) = if x<0 then ~x else x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('betrag')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('betrag')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 14),
                    new Type.CustomType('int', [], 14),
                0),
            0]);
        }],
        ['betrag ~3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType([new Val.Integer(3), 0]);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int', [], 14), 0]);
        }],
        ['if 4<2 then 3 else if 2<3 then ~1 else 1;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType([new Val.Integer(-1), 0]);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
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
    run_test([
        ['val a = 2*2;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('a')).toEqualWithType([new Val.Integer(4), 0]);
            expect(state.getStaticValue('a')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['val b = a*a;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('b')).toEqualWithType([new Val.Integer(16), 0]);
            expect(state.getStaticValue('b')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['val c = b*b;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('c')).toEqualWithType([new Val.Integer(256), 0]);
            expect(state.getStaticValue('c')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['fun hoch8 (x:int) = let val a = x*x val b = a*a in b*b end;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('hoch8')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('hoch8')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 13),
                    new Type.CustomType('int', [], 13),
                0),
            0]);
        }],
        ['hoch8 2;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType([new Val.Integer(256), 0]);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int', [], 13), 0]);
        }],
        ['fun q (y:int) = y*y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('q')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('q')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 9),
                    new Type.CustomType('int', [], 9),
                0),
            0]);
        }],
        ['fun hoch8 (x:int) = q (q (q x));', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('hoch8')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('hoch8')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 13),
                    new Type.CustomType('int', [], 9),
                0),
            0]);
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
    run_test([
        ['(7, 2, true, 2);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.RecordValue(new Map([
                ['1', new Val.Integer(7)],
                ['2', new Val.Integer(2)],
                ['3', new Val.BoolValue(true)],
                ['4', new Val.Integer(2)]
            ])));
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.RecordType(
                    new Map<string, Type>([
                        ['1', new Type.CustomType('int')],
                        ['2', new Type.CustomType('int')],
                        ['3', new Type.CustomType('bool')],
                        ['4', new Type.CustomType('int')]
                    ])
                ),
            0]);
        }],
        ['(7+2, 2*7);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.RecordValue(new Map([
                ['1', new Val.Integer(9)],
                ['2', new Val.Integer(14)]
            ])));
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.RecordType(new Map<string, Type> ([
                    ['1', new Type.CustomType('int')],
                    ['2', new Type.CustomType('int')]
                ])),
            0]);
        }],
        ['();', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.RecordValue(new Map([])));
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.RecordType(new Map()),
            0]);
        }],
        ['val x = (5-2, 1<2, 2*2);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('x')[0]).toEqualWithType(new Val.RecordValue(new Map([
                ['1', new Val.Integer(3)],
                ['2', new Val.BoolValue(true)],
                ['3', new Val.Integer(4)]
            ])));
            expect(state.getStaticValue('x')).toEqualWithType([
                new Type.RecordType(
                    new Map<string, Type>([
                        ['1', new Type.CustomType('int')],
                        ['2', new Type.CustomType('bool')],
                        ['3', new Type.CustomType('int')]
                    ])
                ),
            0]);
        }],
        ['#3 x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(4));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['#2 x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.BoolValue(true));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('bool'), 0]);
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
    run_test([
        ['val (x,y) = (3,4);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('x')[0]).toEqualWithType(new Val.Integer(3));
            expect(state.getStaticValue('x')).toEqualWithType([new Type.CustomType('int'), 0]);
            expect(state.getDynamicValue('y')[0]).toEqualWithType(new Val.Integer(4));
            expect(state.getStaticValue('y')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['val (x,y) = (y,x);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('x')[0]).toEqualWithType(new Val.Integer(4));
            expect(state.getStaticValue('x')).toEqualWithType([new Type.CustomType('int'), 0]);
            expect(state.getDynamicValue('y')[0]).toEqualWithType(new Val.Integer(3));
            expect(state.getStaticValue('y')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['fun swap (p:int*int) = (#2p, #1p);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('swap')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('swap')).toEqualWithType([
                new Type.FunctionType(
                    new Type.RecordType(
                        new Map([
                            ['1', new Type.CustomType('int', [], 12)],
                            ['2', new Type.CustomType('int', [], 16)]
                        ]),
                        true,
                        15
                    ),
                    new Type.RecordType(
                        new Map([
                            ['1', new Type.CustomType('int', [], 16)],
                            ['2', new Type.CustomType('int', [], 12)]
                        ])
                    )
                )
            0]);
        }],
        ['fun swap (p:int*int) = let val (x,y) = p in (y,x) end;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('swap')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('swap')).toEqualWithType([
                new Type.FunctionType(
                    new Type.RecordType(
                        new Map([
                            ['1', new Type.CustomType('int', [], 12)],
                            ['2', new Type.CustomType('int', [], 16)]
                        ]),
                        true,
                        15
                    ),
                    new Type.RecordType(
                        new Map([
                            ['1', new Type.CustomType('int', [], 16)],
                            ['2', new Type.CustomType('int', [], 12)]
                        ])
                    )
                ),
            0]);
        }],
        ['fun swap (x:int, y:int) = (y,x);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('swap')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('swap')).toEqualWithType([
                new Type.FunctionType(
                    new Type.RecordType(
                        new Map([
                            ['1', new Type.CustomType('int', [], 12)],
                            ['2', new Type.CustomType('int', [], 19)]
                        ])
                    ),
                    new Type.RecordType(
                        new Map([
                            ['1', new Type.CustomType('int', [], 19)],
                            ['2', new Type.CustomType('int', [], 12)]
                        ])
                    )
                ),
            0]);
        }],
        ['fun max (x:int, y:int) = if x<y then y else x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('max')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('max')).toEqualWithType([
                new Type.FunctionType(
                    new Type.RecordType(
                        new Map([
                            ['1', new Type.CustomType('int', [], 11)],
                            ['2', new Type.CustomType('int', [], 18)]
                        ])
                    ),
                    new Type.CustomType('int', [], 18)
                ),
            0]);
        }],
        ['max (5,3);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(5));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int', [], 18), 0]);
        }],
        ['max (~5,3);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(3));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int', [], 18), 0]);
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
    run_test([
        ['12 div 3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(4));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['12 mod 3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(0));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['12 div 5;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(2));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['12 mod 5;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(2));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
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
            expect(state.getDynamicValue('potenz')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('potenz')).toEqualWithType([
                new Type.FunctionType(
                    new Type.RecordType(
                        new Map([
                            ['1', new Type.CustomType('int', [], 14)],
                            ['2', new Type.CustomType('int', [], 21)]
                        ])
                    ),
                    new Type.CustomType('int', [], 14)
                ),
            0]);
        }],
        ['potenz (2,10);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(1024));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int', [], 14), 0]);
        }]
    ]);
});

it("1.10", () => {
    /*
fun w (k:int,n:int) : int = if k*k>n then k else w(k+1,n);
fun wurzel (n:int) = w(1,n)-1;
wurzel 15;
     */
    run_test([
        ['fun w (k:int,n:int) : int = if k*k>n then k else w(k+1,n);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('w')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('w')).toEqualWithType([
                new Type.FunctionType(
                    new Type.RecordType(
                        new Map([
                            ['1', new Type.CustomType('int', [], 9)],
                            ['2', new Type.CustomType('int', [], 15)]
                        ])
                    ),
                    new Type.CustomType('int', [], 9)
                ),
            0]);
        }],
        ['fun wurzel (n:int) = w(1,n)-1;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('wurzel')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('wurzel')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 14),
                    new Type.CustomType('int', [], 9)
                ),
            0]);
        }],
        ['wurzel 15;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(3));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int', [], 9), 0]);
        }]
    ]);
});

it("1.11", () => {
    /*
fun w (k:int, n:int) : int = if k*k>n then k else w(k+1,n);

fun p (a:int, x:int, n:int) : int = if n<1 then a else p(a*x,x,n-1);
fun potenz (x:int, n:int) = p(1,x,n);
     */
    run_test([
        ['fun w (k:int,n:int) : int = if k*k>n then k else w(k+1,n);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('w')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('w')).toEqualWithType([
                new Type.FunctionType(
                    new Type.RecordType(
                        new Map([
                            ['1', new Type.CustomType('int', [], 9)],
                            ['2', new Type.CustomType('int', [], 15)]
                        ])
                    ),
                    new Type.CustomType('int', [], 9)
                ),
            0]);
        }],
        ['fun p (a:int, x:int, n:int) : int = if n<1 then a else p(a*x,x,n-1);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('p')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('p')).toEqualWithType([
                new Type.FunctionType(
                    new Type.RecordType(
                        new Map([
                            ['1', new Type.CustomType('int', [], 9)],
                            ['2', new Type.CustomType('int', [], 16)],
                            ['3', new Type.CustomType('int', [], 23)]
                        ])
                    ),
                    new Type.CustomType('int', [], 9)
                ),
            0]);
        }],
        ['fun potenz (x:int, n:int) = p(1,x,n);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('potenz')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('potenz')).toEqualWithType([
                new Type.FunctionType(
                    new Type.RecordType(
                        new Map([
                            ['1', new Type.CustomType('int', [], 14)],
                            ['2', new Type.CustomType('int', [], 21)]
                        ])
                    ),
                    new Type.CustomType('int', [], 9)
                ),
            0]);
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
            expect(state.getDynamicValue('p')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('p')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 9),
                    new Type.CustomType('int', [], 16)
                ),
            0]);
        }],
        ['fun q (x:int) : int = 0 + q x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('q')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('q')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 9),
                    new Type.CustomType('int', [])
                ),
            0]);
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
    run_test([
        ['4.5 + 2.0 * 5.5;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Real(15.5));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('real'), 0]);
        }],
        ['2 * 5.5;', (x) => { expect(x).toThrow(Errors.ElaborationError); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
        }]
    ]);
});

it("1.13.3", () => {
    /*
1.0 / 3.0;
2.0 * 5.00000000001;
     */
    run_test([
        ['1.0 / 3.0;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Real(0.3333333333333333));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('real'), 0]);
        }],
        ['2.0 * 5.00000000001;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Real(10.00000000002));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('real'), 0]);
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
    run_test([
        ['fun newton (a:real, x:real, n:int) : real = if n<1 then a else newton (0.5*(a+x/a), x, n-1);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('newton')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('newton')).toEqualWithType([
                new Type.FunctionType(
                    new Type.RecordType(
                        new Map([
                            ['1', new Type.CustomType('real', [], 14)],
                            ['2', new Type.CustomType('real', [], 22)],
                            ['3', new Type.CustomType('int', [], 30)]
                        ])
                    ),
                    new Type.CustomType('real', [], 14)
                ),
            0]);
        }],
        ['fun sqrt (x:real) = newton (x/2.0, x , 5);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('sqrt')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('sqrt')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('real', [], 12),
                    new Type.CustomType('real', [], 14)
                ),
            0]);
        }],
        ['sqrt 4.0;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Real(2));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('real', [], 14), 0]);
        }],
        ['sqrt 2.0;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Real(1.414213562373095));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('real', [], 14), 0]);
        }],
        ['sqrt 81.0;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Real(9.000009415515176));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('real', [], 14), 0]);
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
    run_test([
        ['Math.sqrt 4.0;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Real(2));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('real'), 0]);
        }],
        ['Real.fromInt 45;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Real(45));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('real'), 0]);
        }],
        ['Real.round 1.5;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(2));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['Math.pi;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Real(3.14159265359));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('real'), 0]);
        }]
    ]);
});


it("2.2.1", () => {
    /*
fun f (t: int*int*int) = if #1t=0 then #2t else 2*(#3t);
     */
    run_test([
        ['fun f (t: int*int*int) = if #1t=0 then #2t else 2*(#3t);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('f')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('f')).toEqualWithType([
                new Type.FunctionType(
                    new Type.RecordType(
                        new Map([
                            ['1', new Type.CustomType('int', [], 10)],
                            ['2', new Type.CustomType('int', [], 14)],
                            ['3', new Type.CustomType('int', [], 18)]
                        ]), true, 13
                    ),
                    new Type.CustomType('int', [], 14)
                ),
            0]);
        }]
    ]);
});

it("2.4", () => {
    /*
fun q (x:int) = 3+(p x);

fun p (x:int) = x;
fun q (x:int) = 3+(p x);

fun f (x:int) : int = if x<1 then 1 else x*f(x-1);
     */
    run_test([
        ['fun q (x:int) = 3+(p x);', (x) => { expect(x).toThrow(Errors.ElaborationError); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
        }],
        ['fun p (x:int) = x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('p')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('p')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 9),
                    new Type.CustomType('int', [], 9)
                ),
            0]);
        }],
        ['fun q (x:int) = 3+(p x);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('p')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('p')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 9),
                    new Type.CustomType('int', [], 9)
                ),
            0]);
        }],
        ['fun f (x:int) : int = if x<1 then 1 else x*f(x-1);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('f')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('f')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 9),
                    new Type.CustomType('int')
                ),
            0]);
        }]
    ]);
});

it("2.5", () => {
    /*
val a = 2*7;
fun p (x:int) = x+a;

val a = 2*7;
fun p (x:int) = x+a;
fun q (x:int) = x + p x;

fun p (x:int) = x;
fun q (x:int) = p x;
fun p (x:int) = 2*x;
val a = (p 5, q 5);
     */
    run_test([
        ['val a = 2*7;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('a')[0]).toEqualWithType(new Val.Integer(14));
            expect(state.getStaticValue('a')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['fun p (x:int) = x+a;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('p')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('p')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 9),
                    new Type.CustomType('int', [], 9)
                ),
            0]);
        }],
        ['val a = 2*7;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('a')[0]).toEqualWithType(new Val.Integer(14));
            expect(state.getStaticValue('a')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['fun p (x:int) = x+a;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('p')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('p')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 9),
                    new Type.CustomType('int', [], 9)
                ),
            0]);
        }],
        ['fun q (x:int) = x + p x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('q')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('q')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 9),
                    new Type.CustomType('int', [], 9)
                ),
            0]);
        }],
        ['fun p (x:int) = x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('p')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('p')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 9),
                    new Type.CustomType('int', [], 9)
                ),
            0]);
        }],
        ['fun q (x:int) = p x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('q')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('q')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 9),
                    new Type.CustomType('int', [], 9)
                ),
            0]);
        }],
        ['fun p (x:int) = 2*x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('p')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('p')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 9),
                    new Type.CustomType('int')
                ),
            0]);
        }],
        ['val a = (p 5, q 5);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('a')[0]).toEqualWithType(createTuple([
                new Val.Integer(10),
                new Val.Integer(5)
            ]));
            expect(state.getStaticValue('a')).toEqualWithType([
                new Type.RecordType(
                    new Map<string, Type>([
                        ['1', new Type.CustomType('int')],
                        ['2', new Type.CustomType('int', [], 9)]
                    ])
                ),
            0]);
        }]
    ]);
});

it("2.6", () => {
    /*
fun f (x:int) : int = if x<y then 1 else x*f(x-1);

val y = 1;
fun f (x:int) : int = if x<y then 1 else x*f(x-1);
     */
    //TODO test types
    run_test([
        ['fun f (x:int) : int = if x<y then 1 else x*f(x-1);', (x) => { expect(x).toThrow(Errors.ElaborationError); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
        }],
        ['val y = 1;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('y')[0]).toEqualWithType(new Val.Integer(1));
            expect(state.getStaticValue('y')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['fun f (x:int) : int = if x<y then 1 else x*f(x-1);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('f')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('f')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 9),
                    new Type.CustomType('int')
                ),
            0]);
        }]
    ]);
});

it("2.9", () => {
    /*
fun p (x:int, y:int) = x+y;
fun p (y:int, x:int) = x+y;

val x = 999999999;
val y = x;
val z = (x-y)*(x-y);

val z = x*x - 2*x*y + y*y;

fun p (x:int, y:int) = (x+y)*(x+y);
fun q (x:int, y:int) = x*x + 2*x*y + y*y;
     */
    run_test([
        ['fun p (x:int, y:int) = x+y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('p')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('p')).toEqualWithType([
                new Type.FunctionType(
                    new Type.RecordType(
                        new Map([
                            ['1', new Type.CustomType('int', [], 9)],
                            ['2', new Type.CustomType('int', [], 16)]
                        ])
                    ),
                    new Type.CustomType('int', [], 9)
                ),
            0]);
        }],
        ['fun p (y:int, x:int) = x+y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('p')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('p')).toEqualWithType([
                new Type.FunctionType(
                    new Type.RecordType(
                        new Map([
                            ['1', new Type.CustomType('int', [], 9)],
                            ['2', new Type.CustomType('int', [], 16)]
                        ])
                    ),
                    new Type.CustomType('int', [], 16)
                ),
            0]);
        }],
        ['val x = 999999999;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('x')[0]).toEqualWithType(new Val.Integer(999999999));
            expect(state.getStaticValue('x')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['val y = x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('y')[0]).toEqualWithType(new Val.Integer(999999999));
            expect(state.getStaticValue('y')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['val z = (x-y)*(x-y);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('z')[0]).toEqualWithType(new Val.Integer(0));
            expect(state.getStaticValue('z')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['val z = x*x - 2*x*y + y*y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(true);
            expect(exceptionValue).toEqualWithType(new Val.ExceptionValue('Overflow'));
        }],
        ['fun p (x:int, y:int) = (x+y)*(x+y);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('p')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('p')).toEqualWithType([
                new Type.FunctionType(
                    new Type.RecordType(
                        new Map([
                            ['1', new Type.CustomType('int', [], 9)],
                            ['2', new Type.CustomType('int', [], 16)]
                        ])
                    ),
                    new Type.CustomType('int', [], 9)
                ),
            0]);
        }],
        ['fun q (x:int, y:int) = x*x + 2*x*y + y*y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('q')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('q')).toEqualWithType([
                new Type.FunctionType(
                    new Type.RecordType(
                        new Map([
                            ['1', new Type.CustomType('int', [], 9)],
                            ['2', new Type.CustomType('int', [], 16)]
                        ])
                    ),
                    new Type.CustomType('int', [], 9)
                ),
            0]);
        }]
    ]);
});

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
    run_test([
        ['fn (x:int) => x*x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 6),
                    new Type.CustomType('int', [], 6)
                ),
            0]);
        }],
        ['(fn (x:int) => x*x) 7;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(49));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int', [], 7), 0]);
        }],
        ['fn (x:int, y:int) => x*y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.FunctionType(
                    new Type.RecordType(
                        new Map([
                            ['1', new Type.CustomType('int', [], 6)],
                            ['2', new Type.CustomType('int', [], 13)]
                        ])
                    ),
                    new Type.CustomType('int', [], 6)
                ),
            0]);
        }],
        ['(fn (x:int, y:int) => x*y) (4,7);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(28));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int', [], 7), 0]);
        }],
        ['fun mul (x:int) = fn (y:int) => x*y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('mul')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('mul')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 11),
                    new Type.FunctionType(
                        new Type.CustomType('int', [], 24),
                        new Type.CustomType('int', [], 11)
                    )
                ),
            0]);
        }],
        ['mul 7;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 24),
                    new Type.CustomType('int', [], 11)
                ),
            0]);
        }],
        ['it 3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(21));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int', [], 11), 0]);
        }],
        ['mul 7 5;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(35));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int', [], 11), 0]);
        }],
        ['fun mul (x:int, y:int) = x*y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('mul')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('mul')).toEqualWithType([
                new Type.FunctionType(
                    new Type.RecordType(
                        new Map([
                            ['1', new Type.CustomType('int', [], 11)],
                            ['2', new Type.CustomType('int', [], 18)]
                        ])
                    ),
                    new Type.CustomType('int', [], 11)
                ),
            0]);
        }],
        ['mul (7,5);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(35));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int', [], 11), 0]);
        }],
        ['fun f (x:int) (y:int) (z:int) = x+y+z;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('f')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('f')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 9),
                    new Type.FunctionType(
                        new Type.CustomType('int', [], 17),
                        new Type.FunctionType(
                            new Type.CustomType('int', [], 25),
                            new Type.CustomType('int', [], 9)
                        )
                    )
                ),
            0]);
        }],
        ['fun f (x:int) = fn (y:int) => fn (z:int) => x+y+z;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('f')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('f')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 9),
                    new Type.FunctionType(
                        new Type.CustomType('int', [], 22),
                        new Type.FunctionType(
                            new Type.CustomType('int', [], 36),
                            new Type.CustomType('int', [], 9)
                        )
                    )
                ),
            0]);
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
    run_test([
        ['fun f (x:int) (y:int) = x+y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('f')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('f')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 9),
                    new Type.FunctionType(
                        new Type.CustomType('int', [], 17),
                        new Type.CustomType('int', [], 9)
                    )
                ),
            0]);
        }],
        ['val g = f 7;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('g')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('g')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 17),
                    new Type.CustomType('int', [], 9)
                ),
            0]);
        }],
        ['fun f (x:int) (y:int) : int = f x y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('f')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('f')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 9),
                    new Type.FunctionType(
                        new Type.CustomType('int', [], 17),
                        new Type.CustomType('int', [], 24)
                    )
                ),
            0]);
        }],
        ['val g = f 7;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('g')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('g')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 17),
                    new Type.CustomType('int', [], 24)
                ),
            0]);
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
    run_test([
        ['fun sum (f:int->int) (n:int) : int = if n<1 then 0 else sum f (n-1) + f n;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('sum')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('sum')).toEqualWithType([
                new Type.FunctionType(
                    new Type.FunctionType(
                        new Type.CustomType('int', [], 11),
                        new Type.CustomType('int', [], 16),
                    14),
                    new Type.FunctionType(
                        new Type.CustomType('int', [], 24),
                        new Type.CustomType('int')
                    )
                ),
            0]);
        }],
        ['sum (fn (i:int) => i) 100;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(5050));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['sum (fn (i:int) => i*i) 10;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(385));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['val gauss = sum (fn (i:int) => i);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('gauss')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('gauss')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 24),
                    new Type.CustomType('int')
                ),
            0]);
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
    run_test([
        ['fun iter (n:int) (s:int) (f:int->int) : int = if n<1 then s else iter (n-1) (f s) f;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('iter')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('iter')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 12),
                    new Type.FunctionType(
                        new Type.CustomType('int', [], 20),
                        new Type.FunctionType(
                            new Type.FunctionType(
                                new Type.CustomType('int', [], 28),
                                new Type.CustomType('int', [], 33),
                                31
                            ),
                            new Type.CustomType('int', [], 20)
                        )
                    )
                ),
            0]);
        }],
        ['fun power (x:int) (n:int) = iter n 1 (fn (a:int) => a*x);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('power')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('power')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 13),
                    new Type.FunctionType(
                        new Type.CustomType('int', [], 21),
                        new Type.CustomType('int', [], 20)
                    )
                ),
            0]);
        }],
        ['power 2 10;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(1024));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int', [], 20), 0]);
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
    run_test([
        ['fun first (s:int) (p:int->bool) : int = if p s then s else first (s+1) p;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('first')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('first')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 13),
                    new Type.FunctionType(
                        new Type.FunctionType(
                            new Type.CustomType('int', [], 21),
                            new Type.CustomType('bool', [], 26),
                            24
                        ),
                        new Type.CustomType('int', [], 13)
                    )
                ),
            0]);
        }],
        ['fun sqrt (x:int) = first 1 (fn (k:int) => k*k>x) - 1;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('sqrt')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('sqrt')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 12),
                    new Type.CustomType('int', [], 13)
                ),
            0]);
        }],
        ['sqrt 15;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(3));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int', [], 13), 0]);
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
    run_test([
        ['fun \'a iter (n:int) (s:\'a) (f:\'a->\'a) : \'a = if n<1 then s else iter (n-1) (f s) f;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('iter')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('iter')).toEqualWithType([
                new Type.TypeVariableBind(
                    '\'a',
                    new Type.FunctionType(
                        new Type.CustomType('int', [], 15),
                        new Type.FunctionType(
                            new Type.TypeVariable('\'a', 23),
                            new Type.FunctionType(
                                new Type.FunctionType(
                                    new Type.TypeVariable('\'a', 30),
                                    new Type.TypeVariable('\'a', 34),
                                    32
                                ),
                                new Type.TypeVariable('\'a', 23)
                            )
                        )
                    )
                ),
            0]);
        }],
        ['fun power (x:int) (n:int) = iter n 1 (fn (a:int) => a*x);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('power')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('power')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 13),
                    new Type.FunctionType(
                        new Type.CustomType('int', [], 21),
                        new Type.CustomType('int')
                    )
                ),
            0]);
        }],
        ['power 2 10;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(1024));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['fun power\' (x:real) (n:int) = iter n 1.0 (fn (a:real) => a*x);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('power\'')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('power\'')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('real', [], 14),
                    new Type.FunctionType(
                        new Type.CustomType('int', [], 23),
                        new Type.CustomType('real')
                    )
                ),
            0]);
        }],
        ['power\' 2.0 10;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Real(1024));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('real'), 0]);
        }],
        ['fun gauss (n:int) = #2(iter n (1,0) (fn (i:int, a:int) => (i+1, a+i)));', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('gauss')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('gauss')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 13),
                    new Type.CustomType('int')
                ),
            0]);
        }],
        ['gauss 10;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(55));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }]
    ]);
});

it("3.5", () => {
    /*
fun ('a,'b) project2 (x:'a, y:'b) = y;
project2 (1,~1);
project2 (1,true);
     */
    run_test([
        ['fun (\'a,\'b) project2 (x:\'a, y:\'b) = y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('project2')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('project2')).toEqualWithType([
                new Type.TypeVariableBind(
                    '\'a',
                    new Type.TypeVariableBind(
                        '\'b',
                        new Type.FunctionType(
                            new Type.RecordType(
                                new Map([
                                    ['1', new Type.TypeVariable('\'a', 24)],
                                    ['2', new Type.TypeVariable('\'b', 30)]
                                ])
                            ),
                            new Type.TypeVariable('\'b', 30)
                        )
                    )
                ),
            0]);
        }],
        ['project2 (1,~1);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(-1));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['project2 (1,true);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.BoolValue(true));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('bool'), 0]);
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
    run_test([
        ['fun \'a id (x:\'a) = x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('id')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('id')).toEqualWithType([
                new Type.TypeVariableBind(
                    '\'a',
                    new Type.FunctionType(
                        new Type.TypeVariable('\'a', 13),
                        new Type.TypeVariable('\'a', 13)
                    )
                ),
            0]);
        }],
        ['val x = id 5;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('x')[0]).toEqualWithType(new Val.Integer(5));
            expect(state.getStaticValue('x')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['val x = id 5.0;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('x')[0]).toEqualWithType(new Val.Real(5));
            expect(state.getStaticValue('x')).toEqualWithType([new Type.CustomType('real'), 0]);
        }],
        ['val x = id(id 3, id 5.0);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('x')[0]).toEqualWithType(new Val.RecordValue(new Map([
                ['1', new Val.Integer(3)],
                ['2', new Val.Real(5)]
            ])));
            expect(state.getStaticValue('x')).toEqualWithType([
                new Type.RecordType(
                    new Map([
                        ['1', new Type.CustomType('int')],
                        ['2', new Type.CustomType('real')]
                    ])
                ),
            0]);
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
            expect(state.getDynamicValue('con')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('con')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('bool'),
                    new Type.FunctionType(
                        new Type.CustomType('bool'),
                        new Type.CustomType('bool')
                    )
                ),
            0]);
        }],
        ['fun sum f n = if n<1 then 0 else sum f (n-1) + f n;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('sum')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('sum')).toEqualWithType([
                new Type.FunctionType(
                    new Type.FunctionType(
                        new Type.CustomType('int'),
                        new Type.CustomType('int')
                    ),
                    new Type.FunctionType(
                        new Type.CustomType('int'),
                        new Type.CustomType('int')
                    )
                ),
            0]);
        }],
        ['val sqsum = sum (fn i => i*i);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('sqsum')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('sqsum')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int'),
                    new Type.CustomType('int')
                ),
            0]);
        }],
        ['fun id x = x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('id')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('id')).toEqualWithType(TODO);
        }],
        ['fun iter n s f = if n<1 then s else iter (n-1) (f s) f;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('iter')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('iter')).toEqualWithType(TODO);
        }],
        ['fun power x n = iter n 1 (fn a => a*x);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('power')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('power')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int'),
                    new Type.FunctionType(
                        new Type.CustomType('int'),
                        new Type.CustomType('int')
                    )
                ),
            0]);
        }],
        ['fun plus x y = x+y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('plus')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('plus')).toEqualWithType(TODO);
        }],
        ['fun plus (x:real) y = x+y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('plus')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('plus')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('real', [], 12),
                    new Type.FunctionType(
                        new Type.CustomType('real', [], 12),
                        new Type.CustomType('real', [], 12)
                    )
                ),
            0]);
        }],
        ['fun plus x y : real = x+y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('plus')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('plus')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('real', [], 15),
                    new Type.FunctionType(
                        new Type.CustomType('real', [], 15),
                        new Type.CustomType('real', [], 15)
                    )
                ),
            0]);
        }],
        ['fun plus (x:real) (y:real) : real = x+y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('plus')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('plus')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('real', [], 12),
                    new Type.FunctionType(
                        new Type.CustomType('real', [], 21),
                        new Type.CustomType('real', [])
                    )
                ),
            0]);
        }],
        ['fn (x,y) => (x+y : real) * x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.FunctionType(
                    new Type.RecordType(
                        new Map([
                            ['1', new Type.CustomType('real', [], 19)],
                            ['2', new Type.CustomType('real', [], 19)]
                        ])
                    ),
                    new Type.CustomType('real', [], 19)
                ),
            0]);
        }],
        ['(fn x => x) : bool -> bool;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('bool', [], 14),
                    new Type.CustomType('bool')
                ),
            0]);
        }],
        ['val f : real -> real = fn x => x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('f')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('f')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('real', [], 8),
                    new Type.CustomType('real', [], 8)
                ),
            0]);
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
            expect(state.getDynamicValue('eq')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('eq')).toEqualWithType(TODO);
        }],
        ['fun neq x y = x <> y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('neq')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('neq')).toEqualWithType(TODO);
        }],
        ['fun f (x,y,z) = if x=y then x else z;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('f')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('f')).toEqualWithType(TODO);
        }],
        ['(fn x => 2*x) = (fn x => 2*x);', (x) => { expect(x).toThrow(Errors.ElaborationError); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
        }]
    ]);
});

it("3.8.1", () => {
    /*
fn x => fn y => z x (y x);
     */
    run_test([
        ['fn x => fn y => z x (y x);', (x) => { expect(x).toThrow(Errors.ElaborationError); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
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
        ['let val x = 2*x val x = 2*x fun f x = if x<2 then x else f(x-1) val f = fn x => f x in f x - y end;', (x) => { expect(x).toThrow(Errors.ElaborationError); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
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
            expect(state.getDynamicValue('x')[0]).toEqualWithType(new Val.Integer(20));
            expect(state.getStaticValue('x')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['fun f y = if y then x else ~x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('f')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('f')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('bool'),
                    new Type.CustomType('int')
                )
            , 0]);
        }],
        ['fun id z = z;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('id')).not.toEqualWithType(undefined); // TODO exact value
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
            expect(state.getDynamicValue('forall')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('forall')).toEqualWithType(TODO);
        }],
        ['fun snd (_, y) = y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('snd')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('snd')).toEqualWithType(TODO);
        }],
        ['op+(8,9);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(17));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['op+(8.0, 9.0);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Real(17));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('real'), 0]);
        }],
        ['op+;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).not.toEqualWithType(undefined); // TODO exact value
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
            expect(state.getDynamicValue('iter')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('iter')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 12),
                    new Type.FunctionType(
                        new Type.CustomType('int', [], 20),
                        new Type.FunctionType(
                            new Type.FunctionType(
                                new Type.CustomType('int', [], 28),
                                new Type.CustomType('int', [], 33),
                                31
                            ),
                            new Type.CustomType('int', [], 20)
                        )
                    )
                )
            , 0]);
        }],
        ['fun first (s:int) (p:int->bool) : int = if p s then s else first (s+1) p;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('first')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('first')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 13),
                    new Type.FunctionType(
                        new Type.FunctionType(
                            new Type.CustomType('int', [], 21),
                            new Type.CustomType('bool', [], 26),
                            24
                        ),
                        new Type.CustomType('int', [], 13)
                    )
                )
            , 0]);
        }],
        ['fun sqrt (x:int) = first 1 (fn (k:int) => k*k>x) - 1;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('sqrt')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('sqrt')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 12),
                    new Type.CustomType('int', [], 13)
                )
            , 0]);
        }],
        ['fun forall m n p = m>n orelse (p m andalso forall (m+1) n p);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('forall')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('forall')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', []),
                    new Type.FunctionType(
                        new Type.CustomType('int', []),
                        new Type.FunctionType(
                            new Type.FunctionType(
                                new Type.CustomType('int'),
                                new Type.CustomType('bool')
                            ),
                            new Type.CustomType('bool')
                        )
                    )
                )
            , 0]);
        }],
        ['fun prime x = x>=2 andalso forall 2 (sqrt x) (fn k => x mod k <> 0);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('prime')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('prime')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 12),
                    new Type.CustomType('bool')
                )
            , 0]);
        }],
        ['fun nextprime x = first (x+1) prime;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('nextprime')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('nextprime')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int'),
                    new Type.CustomType('int', [], 13)
                )
            , 0]);
        }],
        ['fun nthprime n = iter n 1 nextprime;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('nthprime')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('nthprime')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', [], 12),
                    new Type.CustomType('int', [], 20)
                )
            , 0]);
        }],
        ['nthprime 100;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(541));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int', [], 20), 0]);
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
            expect(state.getDynamicValue('compose')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('compose')).toEqualWithType(TODO);
        }],
        ['fun plus x y = x+y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('plus')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('plus')).toEqualWithType(TODO);
        }],
        ['fun times x y = x*y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('times')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('times')).toEqualWithType(TODO);
        }],
        ['val foo = compose (plus 2) (times 3);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('foo')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('foo')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', []),
                    new Type.CustomType('int', [])
                )
            , 0]);
        }],
        ['foo 4;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(14));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['val foo = (plus 2) o (times 3);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('foo')).not.toEqualWithType(undefined); // TODO exact value
            expect(state.getStaticValue('foo')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('int', []),
                    new Type.CustomType('int', [])
                )
            , 0]);
        }],
        ['foo 7;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(23));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['op o;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).not.toEqualWithType(undefined); // TODO exact value
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
            expect(state.getDynamicValue('iterup')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('iterup')).toEqualWithType(TODO);
        }],
        ['fun iterdn n m s f = if n<m then s else iterdn (n-1) m (f(n,s)) f;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('iterdn')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('iterdn')).toEqualWithType(TODO);
        }]
    ]);
});

it("4.1.1", () => {
    /*
[1, 2, 3];
[2, 3] @ [4, 5, 6];
op@;
[1.0, 2.0, 3.0];
[(2,3), (5,1), (7,2)];
[[2, 3], [4, 5, 6], []];

[1,2,3,4] = [1] @ [2,3,4];
     */
    //TODO test types
    run_test([
        ['[1, 2, 3];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.Integer(1),
                new Val.Integer(2),
                new Val.Integer(3)
            ]));
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.CustomType(
                    'list',
                    [
                        new Type.CustomType('int')
                    ]
                )
            , 0]);
        }],
        ['[2, 3] @ [4, 5, 6];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.Integer(2),
                new Val.Integer(3),
                new Val.Integer(4),
                new Val.Integer(5),
                new Val.Integer(6)
            ]));
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.CustomType(
                    'list',
                    [
                        new Type.CustomType('int')
                    ]
                )
            , 0]);
        }],
        ['op@;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['[1.0, 2.0, 3.0];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.Real(1),
                new Val.Real(2),
                new Val.Real(3)
            ]));
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.CustomType(
                    'list',
                    [
                        new Type.CustomType('real')
                    ]
                )
            , 0]);
        }],
        ['[(2,3), (5,1), (7,2)];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                createTuple([new Val.Integer(2), new Val.Integer(3)]),
                createTuple([new Val.Integer(5), new Val.Integer(1)]),
                createTuple([new Val.Integer(7), new Val.Integer(2)])
            ]));
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.CustomType(
                    'list',
                    [
                        new Type.RecordType(
                            new Map([
                                ['1', new Type.CustomType('int')],
                                ['2', new Type.CustomType('int')]
                            ])
                        )
                    ]
                )
            , 0]);
        }],
        ['[[2, 3], [4, 5, 6], []];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                createList([new Val.Integer(2), new Val.Integer(3)]),
                createList([new Val.Integer(4), new Val.Integer(5), new Val.Integer(6)]),
                createList([])
            ]));
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.CustomType(
                    'list',
                    [
                        new Type.CustomType('list', [new Type.CustomType('int')])
                    ]
                )
            , 0]);
        }],
        ['[1,2,3,4] = 1 :: [2,3,4];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.BoolValue(true));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('bool'), 0]);
        }]
    ]);
});

it("4.1.2", () => {
    /*
(1,(2,()));

val xs = 1::(2::nil);
val ys = 0::xs;

1::2::3::nil = [1,2,3];
1::2::3::nil = 1::[2,3];
[1,2,3] @ [3,5,6] @ [2,6,9];
1::2::3::nil @ 4::5::nil;
     */
    //TODO test types
    run_test([
        ['(1,(2,()));', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createTuple([
                new Val.Integer(1),
                createTuple([
                    new Val.Integer(2),
                    createTuple([])
                ])
            ]));
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.RecordType(new Map([
                    ['1', new Type.CustomType('int')],
                    ['2', new Type.RecordType(new Map([
                        ['1', new Type.CustomType('int')],
                        ['2', new Type.RecordType(new Map())]
                    ]))]
                ]))
            , 0]);
        }],
        ['val xs = 1::(2::nil);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('xs')[0]).toEqualWithType(createList([
                new Val.Integer(1),
                new Val.Integer(2)
            ]));
            expect(state.getStaticValue('xs')).toEqualWithType([
                new Type.CustomType(
                    'list',
                    [
                        new Type.CustomType('int')
                    ]
                )
            , 0]);
        }],
        ['val ys = 0::xs;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('ys')[0]).toEqualWithType(createList([
                new Val.Integer(0),
                new Val.Integer(1),
                new Val.Integer(2)
            ]));
            expect(state.getStaticValue('ys')).toEqualWithType([
                new Type.CustomType(
                    'list',
                    [
                        new Type.CustomType('int')
                    ]
                )
            , 0]);
        }],
        ['1::2::3::nil = [1,2,3];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.BoolValue(true));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('bool'), 0]);
        }],
        ['1::2::3::nil = 1::[2,3];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.BoolValue(true));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('bool'), 0]);
        }],
        ['[1,2,3] @ [3,5,6] @ [2,6,9];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.Integer(1),
                new Val.Integer(2),
                new Val.Integer(3),
                new Val.Integer(3),
                new Val.Integer(5),
                new Val.Integer(6),
                new Val.Integer(2),
                new Val.Integer(6),
                new Val.Integer(9)
            ]));
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.CustomType(
                    'list',
                    [
                        new Type.CustomType('int')
                    ]
                )
            , 0]);
        }],
        ['1::2::3::nil @ 4::5::nil;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.Integer(1),
                new Val.Integer(2),
                new Val.Integer(3),
                new Val.Integer(4),
                new Val.Integer(5)
            ]));
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.CustomType(
                    'list',
                    [
                        new Type.CustomType('int')
                    ]
                )
            , 0]);
        }]
    ]);
});

it("4.1.3", () => {
    /*
fun length nil = 0
  | length (x::xr) = 1 + length xr;
length [1,1,1,1];
     */
    //TODO test types
    run_test([
        ['fun length nil = 0 | length (x::xr) = 1 + length xr;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('length')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('length')).toEqualWithType([TODO, 0]);
        }],
        ['length [1,1,1,1];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(4));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }]
    ]);
});

it("4.2", () => {
    /*
fun append (nil, ys) = ys
  | append (x::xr, ys) = x::append(xr,ys);
append([2,3], [6,7,8]);

fun rev nil = nil
  | rev (x::xr) = rev xr @ [x];
rev [1, 2, 3, 4];

fun concat nil = nil
  | concat (x::xr) = x @ concat xr;


fun iterdn n m s f = if n<m then s else iterdn (n-1) m (f(n,s)) f;

fun tabulate (n,f) = iterdn (n-1) 0 nil (fn (i,xs) => f i::xs);

tabulate(5, fn x => x);
tabulate(5, fn x => x*x)

(* length, rev, List.concat, List.tabulate have to be predefined *)
     */
    //TODO test types
    run_test([
        ['fun append (nil, ys) = ys | append (x::xr, ys) = x::append(xr,ys);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('append')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('append')).toEqualWithType(TODO);
        }],
        ['append([2,3], [6,7,8]);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.Integer(2),
                new Val.Integer(3),
                new Val.Integer(6),
                new Val.Integer(7),
                new Val.Integer(8)
            ]));
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.CustomType(
                    'list',
                    [
                        new Type.CustomType('int')
                    ]
                )
            , 0]);
        }],
        ['fun rev nil = nil | rev (x::xr) = rev xr @ [x];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('rev')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('rev')).toEqualWithType(TODO);
        }],
        ['rev [1, 2, 3, 4];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.Integer(4),
                new Val.Integer(3),
                new Val.Integer(2),
                new Val.Integer(1)
            ]));
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.CustomType(
                    'list',
                    [
                        new Type.CustomType('int')
                    ]
                )
            , 0]);
        }],
        ['fun concat nil = nil | concat (x::xr) = x @ concat xr;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('concat')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('concat')).toEqualWithType(TODO);
        }],
        ['fun iterdn n m s f = if n<m then s else iterdn (n-1) m (f(n,s)) f;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('iterdn')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('iterdn')).toEqualWithType(TODO);
        }],
        ['fun tabulate (n,f) = iterdn (n-1) 0 nil (fn (i,xs) => f i::xs);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('tabulate')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('tabulate')).toEqualWithType(TODO);
        }],
        ['tabulate(5, fn x => x);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.Integer(0),
                new Val.Integer(1),
                new Val.Integer(2),
                new Val.Integer(3),
                new Val.Integer(4)
            ]));
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.CustomType(
                    'list',
                    [
                        new Type.CustomType('int')
                    ]
                )
            , 0]);
        }],
        ['tabulate(5, fn x => x*x);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.Integer(0),
                new Val.Integer(1),
                new Val.Integer(4),
                new Val.Integer(9),
                new Val.Integer(16)
            ]));
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.CustomType(
                    'list',
                    [
                        new Type.CustomType('int')
                    ]
                )
            , 0]);
        }]
    ]);
});

it("4.3", () => {
    /*
(* map + List.filter + List.exists + List.all should also be predefined *)
fun map f nil = nil
  | map f (x::xr) = (f x) :: (map f xr);

map (fn x => 2*x) [2, 4, 11, 34];
map op~ [2, 4, 11, 34];
fun minus5 xs = map (fn x => x-5) xs;
minus5 [3, 6, 99, 72];
map rev [[3, 4, 5], [2, 3], [7, 8, 9]];
map length [[3, 4, 5], [2, 3], [7, 8, 9]];

fun filter f nil = nil
  | filter f (x::xr) = if f x then x :: filter f xr
                        else filter f xr;

filter (fn x => x<0) [0, ~1, 2, ~3, ~4];
filter (fn x => x>=0) [0, ~1, 2, ~3, ~4];

fun exists f nil = false
  | exists f (x::xr) = f x orelse exists f xr;

exists (fn x => x<0) [1, 2, 3];
exists (fn x => x<0) [1, ~2, 3];

fun all f nil = true
  | all f (x::xr) = f x andalso all f xr;
all (fn x => x>0) [1, 2, 3];
all (fn x => x>0) [1, ~2, 3];
     */
    //TODO test types
    run_test([
        ['fun map f nil = nil | map f (x::xr) = (f x) :: (map f xr);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('map')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('map')).toEqualWithType(TODO);
        }],
        ['map (fn x => 2*x) [2, 4, 11, 34];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.Integer(4),
                new Val.Integer(8),
                new Val.Integer(22),
                new Val.Integer(68)
            ]));
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.CustomType(
                    'list',
                    [
                        new Type.CustomType('int')
                    ]
                )
            , 0]);
        }],
        ['map op~ [2, 4, 11, 34];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.Integer(-2),
                new Val.Integer(-4),
                new Val.Integer(-11),
                new Val.Integer(-34)
            ]));
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.CustomType(
                    'list',
                    [
                        new Type.CustomType('int')
                    ]
                )
            , 0]);
        }],
        ['fun minus5 xs = map (fn x => x-5) xs;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('minus5')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('minus5')).toEqualWithType(TODO);
        }],
        ['minus5 [3, 6, 99, 72];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.Integer(-2),
                new Val.Integer(1),
                new Val.Integer(94),
                new Val.Integer(67)
            ]));
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.CustomType(
                    'list',
                    [
                        new Type.CustomType('int')
                    ]
                )
            , 0]);
        }],
        ['map rev [[3, 4, 5], [2, 3], [7, 8, 9]];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                createList([new Val.Integer(5), new Val.Integer(4), new Val.Integer(3)]),
                createList([new Val.Integer(3), new Val.Integer(2)]),
                createList([new Val.Integer(9), new Val.Integer(8), new Val.Integer(7)])
            ]));
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.CustomType(
                    'list',
                    [
                        new Type.CustomType('list', [new Type.CustomType('int')])
                    ]
                )
            , 0]);
        }],
        ['map length [[3, 4, 5], [2, 3], [7, 8, 9]];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.Integer(3),
                new Val.Integer(2),
                new Val.Integer(3)
            ]));
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.CustomType(
                    'list',
                    [
                        new Type.CustomType('int')
                    ]
                )
            , 0]);
        }],
        ['fun filter f nil = nil | filter f (x::xr) = if f x then x :: filter f xr else filter f xr;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('filter')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('filter')).toEqualWithType(TODO);
        }],
        ['filter (fn x => x<0) [0, ~1, 2, ~3, ~4];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.Integer(-1),
                new Val.Integer(-3),
                new Val.Integer(-4)
            ]));
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.CustomType(
                    'list',
                    [
                        new Type.CustomType('int')
                    ]
                )
            , 0]);
        }],
        ['filter (fn x => x>=0) [0, ~1, 2, ~3, ~4];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.Integer(0),
                new Val.Integer(2)
            ]));
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.CustomType(
                    'list',
                    [
                        new Type.CustomType('int')
                    ]
                )
            , 0]);
        }],
        ['fun exists f nil = false | exists f (x::xr) = f x orelse exists f xr;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('exists')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('exists')).toEqualWithType(TODO);
        }],
        ['exists (fn x => x<0) [1, 2, 3];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.BoolValue(false));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('bool'), 0]);
        }],
        ['exists (fn x => x<0) [1, ~2, 3];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.BoolValue(true));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('bool'), 0]);
        }],
        ['fun all f nil = true | all f (x::xr) = f x andalso all f xr;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('all')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('all')).toEqualWithType(TODO);
        }],
        ['all (fn x => x>0) [1, 2, 3];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.BoolValue(true));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('bool'), 0]);
        }],
        ['all (fn x => x>0) [1, ~2, 3];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.BoolValue(false));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('bool'), 0]);
        }]
    ]);
});

it("4.4", () => {
    /*
fun sum xs = foldl op+ 0 xs;

sum [4,3,6,2,8];

fun rev xs = foldl op:: nil xs;

fun append (xs,ys) = foldr op:: ys xs;

fun length xs = foldl (fn (x,n) => n+1) 0 xs;
fun append (xs,ys) = foldr op:: ys xs;
fun rev xs = foldl op:: nil xs;
fun concat xs = foldr op@ nil xs;
fun map f = foldr (fn (x,yr) => (f x)::yr) nil;
fun filter f = foldr (fn (x,ys) => if f x then x::ys else ys) nil;

fun foldl f s nil = s
  | foldl f s (x::xr) = foldl f (f(x,s)) xr;
fun foldr f s nil = s
  | foldr f s (x::xr) = f(x, foldr f s xr);
     */
    //TODO test types
    run_test([
        ['fun sum xs = foldl op+ 0 xs;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('sum')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('sum')).toEqualWithType(TODO);
        }],
        ['sum [4,3,6,2,8];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(23));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['fun rev xs = foldl op:: nil xs;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('rev')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('rev')).toEqualWithType(TODO);
        }],
        ['fun append (xs,ys) = foldr op:: ys xs;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('append')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('append')).toEqualWithType(TODO);
        }],
        ['fun length xs = foldl (fn (x,n) => n+1) 0 xs;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('length')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('length')).toEqualWithType(TODO);
        }],
        ['fun rev xs = foldl op:: nil xs;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('rev')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('rev')).toEqualWithType(TODO);
        }],
        ['fun concat xs = foldr op@ nil xs;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('concat')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('concat')).toEqualWithType(TODO);
        }],
        ['fun map f = foldr (fn (x,yr) => (f x)::yr) nil;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('map')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('map')).toEqualWithType(TODO);
        }],
        ['fun filter f = foldr (fn (x,ys) => if f x then x::ys else ys) nil;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('filter')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('filter')).toEqualWithType(TODO);
        }],
        ['fun foldl f s nil = s | foldl f s (x::xr) = foldl f (f(x,s)) xr;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('foldl')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('foldl')).toEqualWithType(TODO);
        }],
        ['fun foldr f s nil = s | foldr f s (x::xr) = f(x, foldr f s xr);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('foldr')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('foldr')).toEqualWithType(TODO);
        }]
    ]);
});

it("4.5", () => {
    /*
hd [1,2,3,4,5];
tl [1,2,3,4,5];

hd nil;
tl nil;

fun hd nil = raise Empty
  | hd (x::xr) = x;
fun tl nil = raise Empty
  | tl (x::xr) = xr;

fun null nil = true
  | null (x::xr) = false;

fun append (xs,ys) = if null xs then ys
                    else hd xs :: append(tl xs, ys);

fun append (xs,ys) = if xs=nil then ys
                    else hd xs :: append(tl xs, ys);


fun nth(xs,n) = if n<0 orelse null xs then raise Subscript
                else if n=0 then hd xs else nth(tl xs, n-1);
nth ([3,4,5], 0);
nth ([3,4,5], 2);
nth ([3,4,5], 3);
     */
    //TODO test types
    run_test([
        ['hd [1,2,3,4,5];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(1));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['tl [1,2,3,4,5];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.Integer(2),
                new Val.Integer(3),
                new Val.Integer(4),
                new Val.Integer(5)
            ]));
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.CustomType(
                    'list',
                    [
                        new Type.CustomType('int')
                    ]
                )
            , 0]);
        }],
        ['hd nil;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(true);
            expect(exceptionValue).toEqualWithType(new Val.ExceptionValue('Empty', undefined));
        }],
        ['tl nil;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(true);
            expect(exceptionValue).toEqualWithType(new Val.ExceptionValue('Empty', undefined));
        }],
        ['fun hd nil = raise Empty | hd (x::xr) = x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('hd')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('hd')).toEqualWithType(TODO);
        }],
        ['fun tl nil = raise Empty | tl (x::xr) = xr;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('tl')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('tl')).toEqualWithType(TODO);
        }],
        ['fun null nil = true | null (x::xr) = false;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('null')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('null')).toEqualWithType(TODO);
        }],
        ['fun append (xs,ys) = if null xs then ys else hd xs :: append(tl xs, ys);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('append')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('append')).toEqualWithType(TODO);
        }],
        ['fun append (xs,ys) = if xs=nil then ys else hd xs :: append(tl xs, ys);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('append')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('append')).toEqualWithType(TODO);
        }],
        ['fun nth(xs,n) = if n<0 orelse null xs then raise Subscript else if n=0 then hd xs else nth(tl xs, n-1);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('nth')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('nth')).toEqualWithType(TODO);
        }],
        ['nth ([3,4,5], 0);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(3));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['nth ([3,4,5], 2);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(5));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['nth ([3,4,5], 3);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(true);
            expect(exceptionValue).toEqualWithType(new Val.ExceptionValue('Subscript', undefined));
        }]
    ]);
});

it("4.6", () => {
    /*
fun rev nil = nil
  | rev (x::xr) = rev xr @ [x];

fun test [] = 0
  | test [(x,y)] = x+y
  | test [(x,5), (7,y)] = x*y
  | test (_::_::ps) = test ps;
     */
    //TODO test types
    //TODO maybe test the functions work?
    run_test([
        ['fun rev nil = nil | rev (x::xr) = rev xr @ [x];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('rev')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('rev')).toEqualWithType(TODO);
        }],
        ['fun test [] = 0 | test [(x,y)] = x+y | test [(x,5), (7,y)] = x*y | test (_::_::ps) = test ps;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('test')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('test')).toEqualWithType(TODO);
        }]
    ]);
});

it("4.6.1", () => {
    /*
fun length nil = 0
  | length (_::xr) = 1 + length xr;

fun length (_::xr) = 1 + length xr
  | length nil = 0;

fun test (_::_::_) = true
  | test _ = false;

fun power (x, 0) = 1
  | power (x, n) = x * power(x, n-1);

fun potenz (x,n) = if n<1 then 1 else x*potenz(x,n-1);

fun or (false, false) = false
  | or _ = true;
     */
    //TODO test types
    //TODO maybe test the functions work?
    run_test([
        ['fun length nil = 0 | length (_::xr) = 1 + length xr;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('length')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('length')).toEqualWithType(TODO);
        }],
        ['fun length (_::xr) = 1 + length xr | length nil = 0;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('length')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('length')).toEqualWithType(TODO);
        }],
        ['fun test (_::_::_) = true | test _ = false;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('test')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('test')).toEqualWithType(TODO);
        }],
        ['fun power (x, 0) = 1 | power (x, n) = x * power(x, n-1);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('power')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('power')).toEqualWithType(TODO);
        }],
        ['fun potenz (x,n) = if n<1 then 1 else x*potenz(x,n-1);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('potenz')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('potenz')).toEqualWithType(TODO);
        }],
        ['fun or (false, false) = false | or _ = true;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('or')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('or')).toEqualWithType(TODO);
        }]
    ]);
});

it("4.6.2", () => {
    /*
fun test nil = 0
  | test [_] = 1;

exception SomethingWrong;
fun test nil = 0
  | test [_] = 1
  | test _ = raise SomethingWrong;
test [1,2];
     */
    //TODO test types
    //TODO somehow check for non exhaustive matching warning
    run_test([
        ['fun test nil = 0 | test [_] = 1;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('test')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('test')).toEqualWithType(TODO);
        }],
        ['exception SomethingWrong;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('SomethingWrong')[0]).toEqualWithType(new Val.ExceptionConstructor('SomethingWrong', undefined));
            //expect(state.getStaticValue('SomethingWrong')).toEqualWithType(TODO);
        }],
        ['fun test nil = 0 | test [_] = 1 | test _ = raise SomethingWrong;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('test')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('test')).toEqualWithType(TODO);
        }],
        ['test [1,2];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(true);
            expect(exceptionValue).toEqualWithType(new Val.ExceptionValue('SomethingWrong', undefined));
        }]
    ]);
});

it("4.6.3", () => {
    /*
fn true => false
 | false => true;

fun test xs y = case rev xs
                of _::x::_ => x<y
                | _ => false;
     */
    //TODO test types
    //TODO maybe test the functions work?
    run_test([
        ['fn true => false | false => true;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['fun test xs y = case rev xs of _::x::_ => x<y | _ => false;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }]
    ]);
});

it("4.6.4", () => {
    /*
fun or false false = false
  | or _ _ = true;

fun or x y = case (x,y)
            of (false, false) => false
            | ( _ , _ ) => true;

fun or (x:bool) = fn (y:bool) =>
                    (fn (false , false ) => false
                    | (a:bool, b:bool) => true ) (x,y);
     */
    //TODO test types
    //TODO maybe test the functions work?
    run_test([
        ['fun or false false = false | or _ _ = true;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('or')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('or')).toEqualWithType(TODO);
        }],
        ['fun or x y = case (x,y) of (false, false) => false | ( _ , _ ) => true;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('or')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('or')).toEqualWithType(TODO);
        }],
        ['fun or (x:bool) = fn (y:bool) => (fn (false , false ) => false | (a:bool, b:bool) => true ) (x,y);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('or')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('or')).toEqualWithType(TODO);
        }]
    ]);
});

it("4.7", () => {
    /*
"Saarbrücken";
"4567899999999 is a large number";
"true ist ein Boolescher Wert";

#"M";
[#"S", #"M", #"L"];

explode("Hallo");
implode [#"H", #"a", #"l", #"l", #"o"];

"Programmier" ^ "sprache";
"Aller " ^ "Anfang " ^ "ist schwer.";
op^;

fn (s,s') => implode(explode s @ explode s');
     */
    //TODO test types
    run_test([
        ['"Saarbrücken";', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.StringValue("Saarbrücken"));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('string'), 0]);
        }],
        ['"4567899999999 is a large number";', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.StringValue("4567899999999 is a large number"));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('string'), 0]);
        }],
        ['"true ist ein Boolescher Wert";', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.StringValue("true ist ein Boolescher Wert"));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('string'), 0]);
        }],
        ['#"M";', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.CharValue("M"));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('char'), 0]);
        }],
        ['[#"S", #"M", #"L"];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.CharValue("S"),
                new Val.CharValue("M"),
                new Val.CharValue("L")
            ]));
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.CustomType(
                    'list',
                    [
                        new Type.CustomType('char')
                    ]
                )
            , 0]);
        }],
        ['explode("Hallo");', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.CharValue("H"),
                new Val.CharValue("a"),
                new Val.CharValue("l"),
                new Val.CharValue("l"),
                new Val.CharValue("o")
            ]));
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.CustomType(
                    'list',
                    [
                        new Type.CustomType('char')
                    ]
                )
            , 0]);
        }],
        ['implode [#"H", #"a", #"l", #"l", #"o"];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.StringValue("Hallo"));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('string'), 0]);
        }],
        ['"Programmier" ^ "sprache";', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.StringValue("Programmiersprache"));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('string'), 0]);
        }],
        ['"Aller " ^ "Anfang " ^ "ist schwer.";', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.StringValue("Aller Anfang ist schwer."));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('string'), 0]);
        }],
        ['op^;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['fn (s,s\') => implode(explode s @ explode s\');', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }]
    ]);
});

it("4.7.1", () => {
    /*
ord #"1";
chr 49;
map ord (explode "019abz");
chr 255;
chr 256;

"\"\\\t\na";
explode "\"\\\t\na";
     */
    //TODO test types
    run_test([
        ['ord #"1";', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(49));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['chr 49;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.CharValue('1'));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('char'), 0]);
        }],
        ['map ord (explode "019abz");', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.Integer(48),
                new Val.Integer(49),
                new Val.Integer(57),
                new Val.Integer(97),
                new Val.Integer(98),
                new Val.Integer(122)
            ]));
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.CustomType(
                    'list',
                    [
                        new Type.CustomType('int')
                    ]
                )
            , 0]);
        }],
        ['chr 255;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.CharValue(String.fromCharCode(255)));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('char'), 0]);
        }],
        ['chr 256;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(true);
            expect(exceptionValue).toEqualWithType(new Val.ExceptionValue('Chr'));
        }],
        ['"\\"\\\\\\t\\na";', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.StringValue('\"\\\t\na'));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('string'), 0]);
        }],
        ['explode "\\"\\\\\\t\\na";', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.CharValue('\"'),
                new Val.CharValue('\\'),
                new Val.CharValue('\t'),
                new Val.CharValue('\n'),
                new Val.CharValue('a')
            ]));
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.CustomType(
                    'list',
                    [
                        new Type.CustomType('char')
                    ]
                )
            , 0]);
        }]
    ]);
});

it("4.7.2", () => {
    /*
"Adam" < "Eva";
"Adam" < "Adamo";

"rufen" < "Zukunft";

map ord (explode "ABab");
     */
    //TODO test types
    run_test([
        ['"Adam" < "Eva";', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.BoolValue(true));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('bool'), 0]);
        }],
        ['"Adam" < "Adamo";', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.BoolValue(true));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('bool'), 0]);
        }],
        ['"rufen" < "Zukunft";', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.BoolValue(false));
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('bool'), 0]);
        }],
        ['map ord (explode "ABab");', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.Integer(65),
                new Val.Integer(66),
                new Val.Integer(97),
                new Val.Integer(98)
            ]));
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.CustomType(
                    'list',
                    [
                        new Type.CustomType('int')
                    ]
                )
            , 0]);
        }]
    ]);
});

it("5.1", () => {
    /*
fun insert (x, nil) = [x]
  | insert (x, y::yr) = if x<=y then x::y::yr else y::insert(x,yr);
fun isort xs = foldl insert nil xs;

fun pisort compare =
    let
        fun insert (x, nil) = [x]
          | insert (x, y::yr) = case compare(x,y) of
                                GREATER => y::insert(x,yr)
                                | _ => x::y::yr
    in
        foldl insert nil
    end;

val xs = List.tabulate(5000, fn x => x);
val ys = rev xs;
     */
    //TODO test types
    run_test([
        ['fun insert (x, nil) = [x] | insert (x, y::yr) = if x<=y then x::y::yr else y::insert(x,yr);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('insert')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('insert')).toEqualWithType(TODO);
        }],
        ['fun isort xs = foldl insert nil xs;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('isort')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('isort')).toEqualWithType(TODO);
        }],
        ['fun pisort compare = let fun insert (x, nil) = [x] | insert (x, y::yr) = case compare(x,y) of GREATER => y::insert(x,yr) | _ => x::y::yr in foldl insert nil end;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('pisort')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('pisort')).toEqualWithType(TODO);
        }],
        ['val xs = List.tabulate(5000, fn x => x);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            let res = [];
            for (let i = 0; i < 5000; ++i) {
                res.push(new Val.Integer(i));
            }
            expect(state.getDynamicValue('xs')[0]).toEqualWithType(createList(res));
            //expect(state.getStaticValue('xs')).toEqualWithType(TODO);
        }],
        ['val ys = rev xs;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            let res = [];
            for (let i = 5000-1; i >= 0; --i) {
                res.push(new Val.Integer(i));
            }
            expect(state.getDynamicValue('ys')[0]).toEqualWithType(createList(res));
            //expect(state.getStaticValue('ys')).toEqualWithType(TODO);
        }]
    ]);
});

it("5.2", () => {
    /*
fun insert (x, nil) = [x]
  | insert (x, y::yr) = if x<=y then x::y::yr else y::insert(x,yr);
fun pisort compare =
    let
        fun insert (x, nil) = [x]
          | insert (x, y::yr) = case compare(x,y) of
                                GREATER => y::insert(x,yr)
                                | _ => x::y::yr
    in
        foldl insert nil
    end;

pisort Int.compare;
pisort Int.compare [5, 2, 2, 13, 4, 9, 9, 13, ~2];
pisort Real.compare [5.0, 2.0, 2.0, 13.0, 4.0, 9.0];
     */
    //TODO test types
    run_test([
        ['fun insert (x, nil) = [x] | insert (x, y::yr) = if x<=y then x::y::yr else y::insert(x,yr);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            // copy from 5.1
        }],
        ['fun pisort compare = let fun insert (x, nil) = [x] | insert (x, y::yr) = case compare(x,y) of GREATER => y::insert(x,yr) | _ => x::y::yr in foldl insert nil end;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            // copy from 5.1
        }],
        ['pisort Int.compare;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['pisort Int.compare [5, 2, 2, 13, 4, 9, 9, 13, ~2];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.Integer(-2),
                new Val.Integer(2),
                new Val.Integer(2),
                new Val.Integer(4),
                new Val.Integer(5),
                new Val.Integer(9),
                new Val.Integer(9),
                new Val.Integer(13),
                new Val.Integer(13)
            ]));
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.CustomType(
                    'list',
                    [
                        new Type.CustomType('int')
                    ]
                )
            , 0]);
        }],
        ['pisort Real.compare [5.0, 2.0, 2.0, 13.0, 4.0, 9.0];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.Real(2),
                new Val.Real(2),
                new Val.Real(4),
                new Val.Real(5),
                new Val.Real(9),
                new Val.Real(13)
            ]));
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.CustomType(
                    'list',
                    [
                        new Type.CustomType('real')
                    ]
                )
            , 0]);
        }]
    ]);
});

it("5.3", () => {
    /*
fun insert (x, nil) = [x]
  | insert (x, y::yr) = if x<=y then x::y::yr else y::insert(x,yr);
fun pisort compare =
    let
        fun insert (x, nil) = [x]
          | insert (x, y::yr) = case compare(x,y) of
                                GREATER => y::insert(x,yr)
                                | _ => x::y::yr
    in
        foldl insert nil
    end;

fun invert (compare : 'a * 'a -> order) (x,y) = compare (y,x);
pisort (invert Int.compare) [5, 2, 2, 13, 4, 9, 9, 13, ~2];

fun lex (compare : 'a * 'a -> order) p = case p of
                                        (nil, _::_) => LESS
                                        | (nil, nil) => EQUAL
                                        | (_::_, nil) => GREATER
                                        | (x::xr, y::yr) => case compare(x,y) of
                                        EQUAL => lex compare (xr,yr)
                                        | s => s;

pisort (lex Int.compare) [[4,1], [], [4], [4,1,~8]];
     */
    //TODO test types
    run_test([
        ['fun insert (x, nil) = [x] | insert (x, y::yr) = if x<=y then x::y::yr else y::insert(x,yr);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            // copy from 5.1
        }],
        ['fun pisort compare = let fun insert (x, nil) = [x] | insert (x, y::yr) = case compare(x,y) of GREATER => y::insert(x,yr) | _ => x::y::yr in foldl insert nil end;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            // copy from 5.1
        }],
        ['fun invert (compare : \'a * \'a -> order) (x,y) = compare (y,x);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('invert')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('invert')).toEqualWithType(TODO);
        }],
        ['pisort (invert Int.compare) [5, 2, 2, 13, 4, 9, 9, 13, ~2];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.Integer(13),
                new Val.Integer(13),
                new Val.Integer(9),
                new Val.Integer(9),
                new Val.Integer(5),
                new Val.Integer(4),
                new Val.Integer(2),
                new Val.Integer(2),
                new Val.Integer(-2)
            ]));
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.CustomType(
                    'list',
                    [
                        new Type.CustomType('int')
                    ]
                )
            , 0]);
        }],
        ['fun lex (compare : \'a * \'a -> order) p = case p of (nil, _::_) => LESS | (nil, nil) => EQUAL | (_::_, nil) => GREATER | (x::xr, y::yr) => case compare(x,y) of EQUAL => lex compare (xr,yr) | s => s;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('lex')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('lex')).toEqualWithType(TODO);
        }],
       ['pisort (lex Int.compare) [[4,1], [], [4], [4,1,~8]];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
           expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
               createList([]),
               createList([new Val.Integer(4)]),
               createList([new Val.Integer(4),new Val.Integer(1)]),
               createList([new Val.Integer(4),new Val.Integer(1),new Val.Integer(-8)])
           ]));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }]
    ]);
});

it("5.4", () => {
    /*
fun split xs = foldl (fn (x, (ys,zs)) => (zs, x::ys))
                    (nil, nil) xs;
fun merge (nil , ys ) = ys
 | merge (xs , nil ) = xs
 | merge (x::xr, y::yr) = if x<=y then x::merge(xr,y::yr)
                            else y::merge(x::xr,yr);
fun msort [] = []
  | msort [x] = [x]
  | msort xs = let val (ys,zs) = split xs
                in merge(msort ys, msort zs) end;
     */
    //TODO test types
    run_test([
        ['fun split xs = foldl (fn (x, (ys,zs)) => (zs, x::ys)) (nil, nil) xs;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('split')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('split')).toEqualWithType(TODO);
        }],
        ['fun merge (nil , ys ) = ys | merge (xs , nil ) = xs | merge (x::xr, y::yr) = if x<=y then x::merge(xr,y::yr) else y::merge(x::xr,yr);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('merge')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('merge')).toEqualWithType(TODO);
        }],
        ['fun msort [] = [] | msort [x] = [x] | msort xs = let val (ys,zs) = split xs in merge(msort ys, msort zs) end;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('msort')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('msort')).toEqualWithType(TODO);
        }]
    ]);
});

it("5.6", () => {
    /*
fun pf'(k,n) = if k*k>n then [n] else
                if n mod k = 0 then k::pf'(k, n div k)
                else pf'(k+1,n);
fun pf n = pf'(2,n);
pf 1989;
     */
    //TODO test types
    run_test([
        ['fun pf\'(k,n) = if k*k>n then [n] else if n mod k = 0 then k::pf\'(k, n div k) else pf\'(k+1,n);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('pf\'')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('pf\'')).toEqualWithType(TODO);
        }],
        ['fun pf n = pf\'(2,n);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('pf')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('pf')).toEqualWithType(TODO);
        }],
        ['pf 1989;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.Integer(3),
                new Val.Integer(3),
                new Val.Integer(13),
                new Val.Integer(17)
            ]));
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.CustomType(
                    'list',
                    [
                        new Type.CustomType('int')
                    ]
                )
            , 0]);
        }]
    ]);
});

it("6.1", () => {
    /*
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
     */
    //TODO test types
    run_test([
        ['datatype shape = Circle of real | Square of real | Triangle of real * real * real;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('Circle')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('Circle')).toEqualWithType(TODO);
            expect(state.getDynamicValue('Square')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('Square')).toEqualWithType(TODO);
            expect(state.getDynamicValue('Triangle')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('Triangle')).toEqualWithType(TODO);
        }],
        ['Circle 4.0;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.ConstructedValue('Circle', new Val.Real(4)));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['Square 3.0;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.ConstructedValue('Square', new Val.Real(3)));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['Triangle (4.0, 3.0, 5.0);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.ConstructedValue('Triangle',
                new Val.RecordValue(new Map([
                    ['1', new Val.Real(4)],
                    ['2', new Val.Real(3)],
                    ['3', new Val.Real(5)]
                ]))
            ));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['fun area (Circle r) = Math.pi*r*r | area (Square a) = a*a | area (Triangle(a,b,c)) = let val s = (a+b+c)/2.0 in Math.sqrt(s*(s-a)*(s-b)*(s-c)) end;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('area')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('area')).toEqualWithType(TODO);
        }],
        ['area (Square 3.0);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Real(9));
            //expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('real'), 0]);
        }],
        ['area (Triangle(6.0, 6.0, Math.sqrt 72.0));', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Real(17.99999999999999));
            //expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('real'), 0]);
        }],
    ]);
});

it("6.2", () => {
    /*
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
     */
    //TODO test types
    //TODO maybe test the forbidden rebinding
    run_test([
        ['datatype day = Monday | Tuesday | Wednesday | Thursday | Friday | Saturday | Sunday;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('Monday')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('Monday')).toEqualWithType(TODO);
            expect(state.getDynamicValue('Tuesday')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('Tuesday')).toEqualWithType(TODO);
            expect(state.getDynamicValue('Wednesday')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('Wednesday')).toEqualWithType(TODO);
            expect(state.getDynamicValue('Thursday')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('Thursday')).toEqualWithType(TODO);
            expect(state.getDynamicValue('Friday')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('Friday')).toEqualWithType(TODO);
            expect(state.getDynamicValue('Saturday')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('Saturday')).toEqualWithType(TODO);
            expect(state.getDynamicValue('Sunday')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('Sunday')).toEqualWithType(TODO);
        }],
        ['fun weekend Saturday = true | weekend Sunday = true | weekend _ = false;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('weekend')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('weekend')).toEqualWithType(TODO);
        }],
        ['weekend Saturday;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.BoolValue(true));
            //expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('bool'), 0]);
        }],
        ['map weekend [Monday, Wednesday, Friday, Saturday, Sunday];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.BoolValue(false),
                new Val.BoolValue(false),
                new Val.BoolValue(false),
                new Val.BoolValue(true),
                new Val.BoolValue(true)
            ]));
            //expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('real'), 0]);
        }]
    ]);
});

it("6.3", () => {
    /*
type point = real * real;

datatype object = Circle of point * real
                | Triangle of point * point * point;

fun mirror ((x,y):point) = (x,~y);

datatype point = Point of real * real;

Point (2.0, 3.0);
fun mirror (Point(x,y)) = Point(x,~y);
     */
    //TODO test types
    run_test([
        ['type point = real * real;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            //TODO check type point is set
        }],
        ['datatype object = Circle of point * real | Triangle of point * point * point;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('Circle')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('Circle')).toEqualWithType(TODO);
            expect(state.getDynamicValue('Triangle')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('Triangle')).toEqualWithType(TODO);
        }],
        ['fun mirror ((x,y):point) = (x,~y);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('mirror')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('mirror')).toEqualWithType(TODO);
        }],
        ['datatype point = Point of real * real;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('Point')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('Point')).toEqualWithType(TODO);
        }],
        ['Point (2.0, 3.0);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.ConstructedValue('Point', new Val.RecordValue(new Map([
                ['1', new Val.Real(2)],
                ['2', new Val.Real(3)]
            ])), 0));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['fun mirror (Point(x,y)) = Point(x,~y);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('mirror')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('mirror')).toEqualWithType(TODO);
        }]
    ]);
});

it("6.4", () => {
    /*
type var = string;

datatype exp = C of int | V of var | A of exp * exp | M of exp * exp;

val e = M(A(M(C 2, V "x"), V "y"), A(V "x", C 3));
     */
    //TODO test types
    run_test([
        ['type var = string;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
        }],
        ['datatype exp = C of int | V of var | A of exp * exp | M of exp * exp;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('C')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('C')).toEqualWithType(TODO);
            expect(state.getDynamicValue('V')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('V')).toEqualWithType(TODO);
            expect(state.getDynamicValue('A')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('A')).toEqualWithType(TODO);
            expect(state.getDynamicValue('M')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('M')).toEqualWithType(TODO);
        }],
        ['val e = M(A(M(C 2, V "x"), V "y"), A(V "x", C 3));', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('e')[0]).toEqualWithType(new Val.ConstructedValue('M', new Val.RecordValue(new Map([
                ['1', new Val.ConstructedValue('A', new Val.RecordValue(new Map([
                    ['1', new Val.ConstructedValue('M', new Val.RecordValue(new Map([
                        ['1', new Val.ConstructedValue('C',
                            new Val.Integer(2),
                         0)],
                        ['2', new Val.ConstructedValue('V',
                            new Val.StringValue('x'),
                        0)]
                    ])), 0)],
                    ['2', new Val.ConstructedValue('V',
                        new Val.StringValue('y'),
                    0)]
                ])), 0)],
                ['2', new Val.ConstructedValue('A', new Val.RecordValue(new Map([
                    ['1', new Val.ConstructedValue('V',
                        new Val.StringValue('x'),
                    0)],
                    ['2', new Val.ConstructedValue('C',
                        new Val.Integer(3),
                    0)],
                ])), 0)]
            ])), 0));
            //expect(state.getStaticValue('e')).toEqualWithType(TODO);
        }]
    ]);
});

it("6.4.1", () => {
    /*
type var = string;
datatype exp = C of int | V of var | A of exp * exp | M of exp * exp;

fun components (A(e,e')) = [e, e']
  | components (M(e,e')) = [e, e']
  | components _ = nil;

components (A(C 3, V "z"));

fun subexps e = e::
    (case e of
        A(e1,e2) => subexps e1 @ subexps e2
      | M(e1,e2) => subexps e1 @ subexps e2
      | _ => nil);
     */
    //TODO test types
    run_test([
        ['type var = string;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            // copy from 6.4
        }],
        ['datatype exp = C of int | V of var | A of exp * exp | M of exp * exp;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            // copy from 6.4
        }],
        ['fun components (A(e,e\')) = [e, e\'] | components (M(e,e\')) = [e, e\'] | components _ = nil;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('components')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('components')).toEqualWithType(TODO);
        }],
        ['components (A(C 3, V "z"));', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.ConstructedValue('C', new Val.Integer(3)),
                new Val.ConstructedValue('V', new Val.StringValue('z')),
            ]));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['fun subexps e = e::(case e of A(e1,e2) => subexps e1 @ subexps e2 | M(e1,e2) => subexps e1 @ subexps e2 | _ => nil);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('subexps')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('subexps')).toEqualWithType(TODO);
        }]
    ]);
});

it("6.4.2", () => {
    /*
type var = string;
datatype exp = C of int | V of var | A of exp * exp | M of exp * exp;
val e = M(A(M(C 2, V "x"), V "y"), A(V "x", C 3));

type env = var -> int;

exception Unbound;

val env = fn "x" => 5 | "y" => 3 | _ => raise Unbound;

fun eval env (C c) = c
  | eval env (V v) = env v
  | eval env (A(e,e')) = eval env e + eval env e'
  | eval env (M(e,e')) = eval env e * eval env e';

eval env e;
     */
    //TODO test types
    run_test([
        ['type var = string;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            // copy from 6.4
        }],
        ['datatype exp = C of int | V of var | A of exp * exp | M of exp * exp;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            // copy from 6.4
        }],
        ['val e = M(A(M(C 2, V "x"), V "y"), A(V "x", C 3));', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            // copy from 6.4
        }],
        ['type env = var -> int;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            //TODO check if type env is set
        }],
        ['exception Unbound;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('Unbound')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('Unbound')).toEqualWithType(TODO);
        }],
        ['val env = fn "x" => 5 | "y" => 3 | _ => raise Unbound;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('env')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('env')).toEqualWithType(TODO);
        }],
        ['fun eval env (C c) = c | eval env (V v) = env v | eval env (A(e,e\')) = eval env e + eval env e\' | eval env (M(e,e\')) = eval env e * eval env e\';', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('eval')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('eval')).toEqualWithType(TODO);
        }],
        ['eval env e;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(104));
            //expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }]
    ]);
});

it("6.5", () => {
    /*
raise Empty;

Empty;

exception New;

exception Newer of int;

(Overflow, New, Newer);
fun test New = 0
  | test (Newer x) = x
  | test _ = ~1;
test Overflow;
test (Newer 13);
     */
    //TODO test types
    run_test([
        ['raise Empty;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(true);
            expect(exceptionValue).toEqualWithType(new Val.ExceptionValue('Empty', undefined));
        }],
        ['Empty;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.ExceptionValue('Empty', undefined));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['exception New;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('New')[0]).toEqualWithType(new Val.ExceptionConstructor('New', 0));
            //expect(state.getStaticValue('New')).toEqualWithType(TODO);
        }],
        ['exception Newer of int;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('Newer')[0]).toEqualWithType(new Val.ExceptionConstructor('Newer', 1));
            //expect(state.getStaticValue('Newer')).toEqualWithType(TODO);
        }],
        ['(Overflow, New, Newer);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createTuple([
                new Val.ExceptionValue('Overflow', undefined),
                new Val.ExceptionValue('New', undefined),
                new Val.ExceptionConstructor('Newer', 1)
            ]));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['fun test New = 0 | test (Newer x) = x | test _ = ~1;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('test')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('test')).toEqualWithType(TODO);
        }],
        ['test Overflow;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(-1));
            //expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['test (Newer 13);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(13));
            //expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }]
    ]);
});

it("6.5.1", () => {
    /*
exception New;

raise New;

fun f x y = if x then y else raise New;
     */
    //TODO test types
    run_test([
        ['exception New;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('New')[0]).toEqualWithType(new Val.ExceptionConstructor('New', 0));
            //expect(state.getStaticValue('New')).toEqualWithType(TODO);
        }],
        ['raise New;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(true);
            expect(exceptionValue).toEqualWithType(new Val.ExceptionValue('New', undefined));
        }],
        ['fun f x y = if x then y else raise New;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('f')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('f')).toEqualWithType(TODO);
        }]
    ]);
});

it("6.5.2", () => {
    /*
exception New;
exception Newer of int;

exception Unbound;

(raise New) handle New => ();
(raise Newer 7) handle Newer x => x;
fun test f = f() handle Newer x => x | Overflow => ~1;
test (fn () => raise Newer 6);
fun fac n = if n<1 then 1 else n*fac(n-1);
fac 15;
test (fn () => fac 15);

fun adjoin env env' x = env' x handle Unbound => env x;
     */
    //TODO test types
    run_test([
        ['exception New;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            // copy from 6.5
        }],
        ['exception Newer of int;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            // copy from 6.5
        }],
        ['exception Unbound;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('Unbound')[0]).toEqualWithType(new Val.ExceptionConstructor('Unbound', 0));
            //expect(state.getStaticValue('Unbound')).toEqualWithType(TODO);
        }],
        ['(raise New) handle New => ();', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createTuple([]));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['(raise Newer 7) handle Newer x => x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(7));
            //expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['fun test f = f() handle Newer x => x | Overflow => ~1;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('test')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('test')).toEqualWithType(TODO);
        }],
        ['test (fn () => raise Newer 6);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(6));
            //expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['fun fac n = if n<1 then 1 else n*fac(n-1);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('fac')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('fac')).toEqualWithType(TODO);
        }],
        ['fac 15;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(true);
            expect(exceptionValue).toEqualWithType(new Val.ExceptionValue('Overflow', undefined));
        }],
        ['test (fn () => fac 15);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(-1));
            //expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['fun adjoin env env\' x = env\' x handle Unbound => env x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(state.getDynamicValue('adjoin')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('adjoin')).toEqualWithType(TODO);
        }]
    ]);
});

it("6.5.3", () => {
    /*
exception New;

(raise Overflow, raise Subscript);

(5 ; 7);
(raise New ; 7);

fun testOverflow x y = (x*y ; false) handle Overflow => true;
testOverflow 2 3;
testOverflow 100000 100000;
     */
    //TODO test types
    run_test([
        ['exception New;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            // copy from 6.5
        }],
        ['(raise Overflow, raise Subscript);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(true);
            expect(exceptionValue).toEqualWithType(new Val.ExceptionValue('Overflow', undefined));
        }],
        ['(5 ; 7);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(7));
            //expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['fun testOverflow x y = (x*y ; false) handle Overflow => true;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('testOverflow')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('testOverflow')).toEqualWithType(TODO);
        }],
        ['testOverflow 2 3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.BoolValue(false));
            //expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('bool'), 0]);
        }],
        ['testOverflow 100000 100000;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.BoolValue(true));
            //expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('bool'), 0]);
        }]
    ]);
});

it("6.5.5", () => {
    /*
exception Double;
fun mask compare p = case compare p of
    EQUAL => raise Double | v => v;
fun testDouble compare xs =
    (List.sort (mask compare) xs ; false)
    handle Double => true;
     */
    //TODO test types
    //TODO maybe test that testDouble also works?
    run_test([
        ['exception Double;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('Double')[0]).toEqualWithType(new Val.ExceptionConstructor('Double', 0));
            //expect(state.getStaticValue('Double')).toEqualWithType(TODO);
        }],
        ['fun mask compare p = case compare p of EQUAL => raise Double | v => v;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('mask')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('mask')).toEqualWithType(TODO);
        }],
        ['fun testDouble compare xs = (List.sort (mask compare) xs ; false) handle Double => true;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('testDouble')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('testDouble')).toEqualWithType(TODO);
        }]
    ]);
});

it("6.6", () => {
    /*
datatype 'a mylist = Nil | Cons of 'a * 'a mylist;
     */
    //TODO test types
    //TODO maybe test that mylist is usable?
    run_test([
        ['datatype \'a mylist = Nil | Cons of \'a * \'a mylist;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('Nil')[0]).toEqualWithType(new Val.ValueConstructor('Nil', 0));
            //expect(state.getStaticValue('Nil')).toEqualWithType(TODO);
            expect(state.getDynamicValue('Cons')[0]).toEqualWithType(new Val.ValueConstructor('Cons', 1));
            //expect(state.getStaticValue('Cons')).toEqualWithType(TODO);
        }]
    ]);
});

it("6.7", () => {
    /*
(* should be predefined *)
datatype 'a option = NONE | SOME of 'a;

fun nth n xs = if n<0 orelse null xs then NONE
                else if n=0 then SOME (hd xs) else nth (n-1) (tl xs);
nth 2 [3,4,5];
nth 3 [3,4,5];

(* should be predefined *)
fun valOf (SOME x) = x
  | valOf NONE = raise Option.Option;

valOf (nth 2 [3,4,5]);

(* should be predefined *)
fun isSome NONE = false
  | isSome (SOME _) = true;

Int.minInt;

Int.maxInt;
valOf Int.minInt + valOf Int.maxInt;

fun findDouble compare xs = let
    exception Double of 'a
    fun compare' (x,y) = case compare (x,y) of
        EQUAL => raise Double x | v => v
in
    (List.sort compare' xs ; NONE)
    handle Double x => SOME x
end;
     */
    //TODO test types
    //TODO maybe test that findDouble is usable?
    run_test([
        ['datatype \'a option = NONE | SOME of \'a;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('NONE')[0]).toEqualWithType(new Val.ValueConstructor('NONE', 0, 1));
            //expect(state.getStaticValue('NONE')).toEqualWithType(TODO);
            expect(state.getDynamicValue('SOME')[0]).toEqualWithType(new Val.ValueConstructor('SOME', 1, 1));
            //expect(state.getStaticValue('SOME')).toEqualWithType(TODO);
        }],
        ['fun nth n xs = if n<0 orelse null xs then NONE else if n=0 then SOME (hd xs) else nth (n-1) (tl xs);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('nth')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('nth')).toEqualWithType(TODO);
        }],
        ['nth 2 [3,4,5];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.ConstructedValue('SOME', new Val.Integer(5), 1));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['nth 3 [3,4,5];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.ConstructedValue('NONE', undefined, 1), undefined, 1);
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['Int.minInt;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.ConstructedValue('SOME', new Val.Integer(-1073741824)));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['Int.maxInt;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.ConstructedValue('SOME', new Val.Integer(1073741823)));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['valOf Int.minInt + valOf Int.maxInt;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(-1));
            //expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['fun findDouble compare xs = let exception Double of \'a fun compare\' (x,y) = case compare (x,y) of EQUAL => raise Double x | v => v in (List.sort compare\' xs ; NONE) handle Double x => SOME x end;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('findDouble')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('findDouble')).toEqualWithType(TODO);
        }]
    ]);
});

it('7.1', () => {
    /*
datatype tree = T of tree list
val t1 = T[];
val t2 = T[t1, t1, t1];
val t3 = T[T[t2], t1, t2]; */
    let t1 = new Val.ConstructedValue('T', createList([]));
    let t2 = new Val.ConstructedValue('T', createList([t1, t1, t1]));
    let t3 = new Val.ConstructedValue('T', createList([new Val.ConstructedValue('T', createList([t2]), 0), t1, t2]));
    run_test([
        ['datatype tree = T of tree list;', (x) => { x(); }, (state: State.State, hasThrown: boolean, exceptionValue: Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('T')[0]).toEqualWithType(new Val.ValueConstructor('T', 1));
            // expect(state.getStaticValue('T')).toEqualWithType(TODO: tree);
            // TODO: check that state contains datatype tree
        }],
        ['val t1 = T[];', (x) => { x(); }, (state: State.State, hasThrown: boolean, exceptionValue: Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('t1')[0]).toEqualWithType(t1);
            // expect(state.getStaticValue('t1')).toEqualWithType(TODO: tree);
        }],
        ['val t2 = T[t1, t1, t1];', (x) => { x(); }, (state: State.State, hasThrown: boolean, exceptionValue: Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('t2')[0]).toEqualWithType(t2);
            // expect(state.getStaticValue('t2')).toEqualWithType(TODO: tree);
        }],
        ['val t3 = T[T[t2], t1, t2];', (x) => { x(); }, (state: State.State, hasThrown: boolean, exceptionValue: Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('t3')[0]).toEqualWithType(t3);
            // expect(state.getStaticValue('t3')).toEqualWithType(TODO: tree);
        }]
    ]);
});

it('7.1.1', () => {
    /*
datatype tree = T of tree list;

val t1 = T[];
val t2 = T[t1, t1, t1];
val t3 = T[T[t2], t1, t2];

fun arity (T ts) = length ts;
arity t3;
fun dst (T ts) k = List.nth(ts, k-1);
dst t3 3;
     */
    let t1 = new Val.ConstructedValue('T', createList([]));
    let t2 = new Val.ConstructedValue('T', createList([t1, t1, t1]));
    let t3 = new Val.ConstructedValue('T', createList([new Val.ConstructedValue('T', createList([t2]), 0), t1, t2]));
    run_test([
        ['datatype tree = T of tree list;', (x) => { x(); }, (state: State.State, hasThrown: boolean, exceptionValue: Val.Exception) => {
            // see 7.1
        }],
        ['val t1 = T[];', (x) => { x(); }, (state: State.State, hasThrown: boolean, exceptionValue: Val.Exception) => {
            // see 7.1
        }],
        ['val t2 = T[t1, t1, t1];', (x) => { x(); }, (state: State.State, hasThrown: boolean, exceptionValue: Val.Exception) => {
            // see 7.1
        }],
        ['val t3 = T[T[t2], t1, t2];', (x) => { x(); }, (state: State.State, hasThrown: boolean, exceptionValue: Val.Exception) => {
            // see 7.1
        }],
        ['fun arity (T ts) = length ts;', (x) => { x(); }, (state : State.State, hasThrown: boolean, exceptionValue: Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('arity')).not.toEqualWithType(undefined); // TODO exact value
            // expect(state.getStaticValue('arity')).toEqualWithType(TODO: tree -> int);
        }],
        ['arity t3;', (x) => { x(); }, (state: State.State, hasThrown: boolean, exceptionValue: Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(3));
            // expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['fun dst (T ts) k = List.nth(ts, k-1);', (x) => { x(); }, (state: State.State, hasThrown: boolean, exceptionValue: Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('dst')).not.toEqualWithType(undefined); // TODO exact value
            // expect(state.getStaticValue('dst')).toEqualWithType(TODO: tree -> int -> tree);
        }],
        ['dst t3 3;', (x) => { x(); }, (state: State.State, hasThrown: boolean, exceptionValue: Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(t2);
            // expect(state.getDynamicValue('it').toEqualWithType(TODO: tree));
        }],
    ]);
});

it("7.1.2", () => {
    /*
datatype tree = T of tree list;

datatype exp = C of int | V of string | A of exp*exp | M of exp*exp;

fun shape (C _) = T[]
  | shape (V _) = T[]
  | shape (A(e,e')) = T[shape e, shape e']
  | shape (M(e,e')) = T[shape e, shape e'];
     */
    //TODO test types
    //TODO maybe test that shape works
    run_test([
        ['datatype tree = T of tree list;', (x) => { x(); }, (state: State.State, hasThrown: boolean, exceptionValue: Val.Exception) => {
            // see 7.1
        }],
        ['datatype exp = C of int | V of string | A of exp*exp | M of exp*exp;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('C')[0]).toEqualWithType(new Val.ValueConstructor('C', 1));
            // expect(state.getStaticValue('C')).toEqualWithType(TODO);
            expect(state.getDynamicValue('V')[0]).toEqualWithType(new Val.ValueConstructor('V', 1));
            // expect(state.getStaticValue('V')).toEqualWithType(TODO);
            expect(state.getDynamicValue('A')[0]).toEqualWithType(new Val.ValueConstructor('A', 1));
            // expect(state.getStaticValue('A')).toEqualWithType(TODO);
            expect(state.getDynamicValue('M')[0]).toEqualWithType(new Val.ValueConstructor('M', 1));
            // expect(state.getStaticValue('M')).toEqualWithType(TODO);
        }],
        ['fun shape (C _) = T[] | shape (V _) = T[] | shape (A(e,e\')) = T[shape e, shape e\'] | shape (M(e,e\')) = T[shape e, shape e\'];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('shape')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('shape')).toEqualWithType(TODO);
        }]
    ]);
});

it("7.1.3", () => {
    /*
datatype tree = T of tree list;
val t1 = T[];
val t2 = T[t1, t1, t1];
val t3 = T[T[t2], t1, t2];

fun compareTree (T ts, T tr) = List.collate compareTree (ts,tr);
compareTree(t2,t3);
compareTree(T[T[T[T[T[]]]]], t3);
     */
    //TODO test types
    let t1 = new Val.ConstructedValue('T', createList([]));
    let t2 = new Val.ConstructedValue('T', createList([t1, t1, t1]));
    let t3 = new Val.ConstructedValue('T', createList([new Val.ConstructedValue('T', createList([t2]), 1), t1, t2]));
    run_test([
        ['datatype tree = T of tree list;', (x) => { x(); }, (state: State.State, hasThrown: boolean, exceptionValue: Val.Exception) => {
            // see 7.1
        }],
        ['val t1 = T[];', (x) => { x(); }, (state: State.State, hasThrown: boolean, exceptionValue: Val.Exception) => {
            // see 7.1
        }],
        ['val t2 = T[t1, t1, t1];', (x) => { x(); }, (state: State.State, hasThrown: boolean, exceptionValue: Val.Exception) => {
            // see 7.1
        }],
        ['val t3 = T[T[t2], t1, t2];', (x) => { x(); }, (state: State.State, hasThrown: boolean, exceptionValue: Val.Exception) => {
            // see 7.1
        }],
        ['fun compareTree (T ts, T tr) = List.collate compareTree (ts,tr);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('compareTree')[0]).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('compareTree')).toEqualWithType(TODO);
        }],
        ['compareTree(t2,t3);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.ConstructedValue('LESS', undefined));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['compareTree(T[T[T[T[T[]]]]], t3);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.ConstructedValue('GREATER', undefined));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }]
    ]);
});

it("7.2", () => {
    /*
datatype tree = T of tree list;
val t1 = T[];
val t2 = T[t1, t1, t1];
val t3 = T[T[t2], t1, t2];

fun subtree t (T ts) = (t = T ts) orelse
                        List.exists (subtree t) ts;
subtree (T[t2]) t3;
subtree t3 t2;

fun count t (T ts) = if (t = T ts) then 1
                    else foldl op+ 0 (map (count t) ts);
count t1 t3;

fun linear (T nil) = true
  | linear (T [t]) = linear t
  | linear _ = false;
     */
    //TODO test types
    let t1 = new Val.ConstructedValue('T', createList([]));
    let t2 = new Val.ConstructedValue('T', createList([t1, t1, t1]));
    let t3 = new Val.ConstructedValue('T', createList([new Val.ConstructedValue('T', createList([t2]), 1), t1, t2]));
    run_test([
        ['datatype tree = T of tree list;', (x) => { x(); }, (state: State.State, hasThrown: boolean, exceptionValue: Val.Exception) => {
            // see 7.1
        }],
        ['val t1 = T[];', (x) => { x(); }, (state: State.State, hasThrown: boolean, exceptionValue: Val.Exception) => {
            // see 7.1
        }],
        ['val t2 = T[t1, t1, t1];', (x) => { x(); }, (state: State.State, hasThrown: boolean, exceptionValue: Val.Exception) => {
            // see 7.1
        }],
        ['val t3 = T[T[t2], t1, t2];', (x) => { x(); }, (state: State.State, hasThrown: boolean, exceptionValue: Val.Exception) => {
            // see 7.1
        }],
        ['fun subtree t (T ts) = (t = T ts) orelse List.exists (subtree t) ts;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('subtree')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('subtree')).toEqualWithType(TODO);
        }],
        ['subtree (T[t2]) t3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.BoolValue(true));
            //expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('bool'), 0]);
        }],
        ['subtree t3 t2;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.BoolValue(false));
            //expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('bool'), 0]);
        }],
        ['fun count t (T ts) = if (t = T ts) then 1 else foldl op+ 0 (map (count t) ts);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('count')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('count')).toEqualWithType(TODO);
        }],
        ['count t1 t3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(7));
            //expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['fun linear (T nil) = true | linear (T [t]) = linear t | linear _ = false;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('linear')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('linear')).toEqualWithType(TODO);
        }]
    ]);
});

it("7.3", () => {
    /*
datatype tree = T of tree list;
val t1 = T[];
val t2 = T[t1, t1, t1];
val t3 = T[T[t2], t1, t2];
fun dst (T ts) k = List.nth(ts, k-1);

fun ast t nil = t
  | ast t (n::a) = ast (dst t n) a;
ast t3 [1,1,3];
ast t3 [1,1];

ast t3 [1,2];
     */
    //TODO test types
    let t1 = new Val.ConstructedValue('T', createList([]));
    let t2 = new Val.ConstructedValue('T', createList([t1, t1, t1]));
    let t3 = new Val.ConstructedValue('T', createList([new Val.ConstructedValue('T', createList([t2]), 1), t1, t2]));
    run_test([
        ['datatype tree = T of tree list;', (x) => { x(); }, (state: State.State, hasThrown: boolean, exceptionValue: Val.Exception) => {
            // see 7.1
        }],
        ['val t1 = T[];', (x) => { x(); }, (state: State.State, hasThrown: boolean, exceptionValue: Val.Exception) => {
            // see 7.1
        }],
        ['val t2 = T[t1, t1, t1];', (x) => { x(); }, (state: State.State, hasThrown: boolean, exceptionValue: Val.Exception) => {
            // see 7.1
        }],
        ['val t3 = T[T[t2], t1, t2];', (x) => { x(); }, (state: State.State, hasThrown: boolean, exceptionValue: Val.Exception) => {
            // see 7.1
        }],
        ['fun dst (T ts) k = List.nth(ts, k-1);', (x) => { x(); }, (state: State.State, hasThrown: boolean, exceptionValue: Val.Exception) => {
            // copy from 7.1.1
        }],
        ['fun ast t nil = t | ast t (n::a) = ast (dst t n) a;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('ast')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('ast')).toEqualWithType(TODO);
        }],
        ['ast t3 [1,1,3];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(t1);
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['ast t3 [1,1];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(t2);
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['ast t3 [1,2];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(true);
            expect(exceptionValue).toEqualWithType(new Val.ExceptionValue('Subscript', undefined));
        }]
    ]);
});

it("7.4", () => {
    /*
datatype tree = T of tree list;
val t1 = T[];
val t2 = T[t1, t1, t1];
val t3 = T[T[t2], t1, t2];

fun size (T ts) = foldl op+ 1 (map size ts);
size t3;

fun depth (T ts) = 1 + foldl Int.max ~1 (map depth ts);
depth t3;
     */
    //TODO test types
    let t1 = new Val.ConstructedValue('T', createList([]));
    let t2 = new Val.ConstructedValue('T', createList([t1, t1, t1]));
    let t3 = new Val.ConstructedValue('T', createList([new Val.ConstructedValue('T', createList([t2]), 1), t1, t2]));
    run_test([
        ['datatype tree = T of tree list;', (x) => { x(); }, (state: State.State, hasThrown: boolean, exceptionValue: Val.Exception) => {
            // see 7.1
        }],
        ['val t1 = T[];', (x) => { x(); }, (state: State.State, hasThrown: boolean, exceptionValue: Val.Exception) => {
            // see 7.1
        }],
        ['val t2 = T[t1, t1, t1];', (x) => { x(); }, (state: State.State, hasThrown: boolean, exceptionValue: Val.Exception) => {
            // see 7.1
        }],
        ['val t3 = T[T[t2], t1, t2];', (x) => { x(); }, (state: State.State, hasThrown: boolean, exceptionValue: Val.Exception) => {
            // see 7.1
        }],
        ['fun size (T ts) = foldl op+ 1 (map size ts);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('size')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('size')).toEqualWithType(TODO);
        }],
        ['size t3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(11));
            //expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['fun depth (T ts) = 1 + foldl Int.max ~1 (map depth ts);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('depth')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('depth')).toEqualWithType(TODO);
        }],
        ['depth t3;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.Integer(3));
            //expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('int'), 0]);
        }]
    ]);
});

it("7.5", () => {
    /*
datatype tree = T of tree list;

fun fold f (T ts) = f (map (fold f) ts);

val size = fold (foldl op+ 1);
     */
    //TODO test types
    //TODO maybe test size and fold work
    run_test([
        ['datatype tree = T of tree list;', (x) => { x(); }, (state: State.State, hasThrown: boolean, exceptionValue: Val.Exception) => {
            // see 7.1
        }],
        ['fun fold f (T ts) = f (map (fold f) ts);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('fold')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('fold')).toEqualWithType(TODO);
        }],
        ['val size = fold (foldl op+ 1);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('size')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('size')).toEqualWithType(TODO);
        }]
    ]);
});

it("7.6.3", () => {
    /*
datatype tree = T of tree list;

fun pre (T ts) = length ts :: List.concat (map pre ts);
fun post (T ts) = List.concat (map post ts) @ [length ts];
     */
    //TODO test types
    //TODO maybe test pre and post work
    run_test([
        ['datatype tree = T of tree list;', (x) => { x(); }, (state: State.State, hasThrown: boolean, exceptionValue: Val.Exception) => {
            // see 7.1
        }],
        ['fun pre (T ts) = length ts :: List.concat (map pre ts);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('pre')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('pre')).toEqualWithType(TODO);
        }],
        ['fun post (T ts) = List.concat (map post ts) @ [length ts];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('post')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('post')).toEqualWithType(TODO);
        }]
    ]);
});

it("7.7", () => {
    /*
datatype tree = T of tree list;

fun depth' (T nil) = 0
  | depth' (T(t::tr)) = 1+foldl Int.max (depth' t) (map depth' tr);

exception Unbalanced;
fun check (n,m) = if n=m then n else raise Unbalanced;
fun depthb (T nil) = 0
  | depthb (T(t::tr)) = 1+foldl check (depthb t) (map depthb tr);

fun balanced t = (depthb t ; true) handle Unbalanced => false;
     */
    //TODO test types
    //TODO maybe check if the functions work
    run_test([
        ['datatype tree = T of tree list;', (x) => { x(); }, (state: State.State, hasThrown: boolean, exceptionValue: Val.Exception) => {
            // see 7.1
        }],
        ['fun depth\' (T nil) = 0 | depth\' (T(t::tr)) = 1+foldl Int.max (depth\' t) (map depth\' tr);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('depth\'')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('depth\'')).toEqualWithType(TODO);
        }],
        ['exception Unbalanced;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('Unbalanced')[0]).toEqualWithType(new Val.ExceptionConstructor('Unbalanced', 0));
            //expect(state.getStaticValue('Unbalanced')).toEqualWithType(TODO);
        }],
        ['fun check (n,m) = if n=m then n else raise Unbalanced;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('check')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('check')).toEqualWithType(TODO);
        }],
        ['fun depthb (T nil) = 0 | depthb (T(t::tr)) = 1+foldl check (depthb t) (map depthb tr);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('depthb')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('depthb')).toEqualWithType(TODO);
        }],
        ['fun balanced t = (depthb t ; true) handle Unbalanced => false;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('balanced')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('balanced')).toEqualWithType(TODO);
        }]
    ]);
});

it("7.8", () => {
    /*
datatype tree = T of tree list;
fun compareTree (T ts, T tr) = List.collate compareTree (ts,tr);

fun strict(t::t'::tr) = compareTree(t,t')=LESS andalso strict(t'::tr)
  | strict _ = true;
fun directed (T ts) = strict ts andalso List.all directed ts;

fun eqset x y = subset x y andalso subset y x
and subset (T xs) y = List.all (fn x => member x y) xs
and member x (T ys) = List.exists (eqset x) ys;
     */
    //TODO test types
    //TODO maybe check if the functions work
    run_test([
        ['datatype tree = T of tree list;', (x) => { x(); }, (state: State.State, hasThrown: boolean, exceptionValue: Val.Exception) => {
            // see 7.1
        }],
        ['fun compareTree (T ts, T tr) = List.collate compareTree (ts,tr);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            // copy from 7.1.3
        }],
        ['fun strict(t::t\'::tr) = compareTree(t,t\')=LESS andalso strict(t\'::tr) | strict _ = true;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('strict')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('strict')).toEqualWithType(TODO);
        }],
        ['fun directed (T ts) = strict ts andalso List.all directed ts;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('directed')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('directed')).toEqualWithType(TODO);
        }],
        ['fun eqset x y = subset x y andalso subset y x and subset (T xs) y = List.all (fn x => member x y) xs and member x (T ys) = List.exists (eqset x) ys;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('eqset')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('eqset')).toEqualWithType(TODO);
            expect(state.getDynamicValue('subset')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('subset')).toEqualWithType(TODO);
            expect(state.getDynamicValue('member')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('member')).toEqualWithType(TODO);
        }]
    ]);
});

it("7.9", () => {
    /*
datatype tree = T of tree list;

datatype 'a ltr = L of 'a * 'a ltr list;

val t1 = L(7,[]);
val t2 = L(1, [L(2,[]), t1, t1]);
val t3 = L(3, [L(0,[t2]), L(4,[]), t2]);

fun head (L(x,_)) = x;

fun shape (L(_,ts)) = T(map shape ts);
shape t2;

fun sameshape t t' = shape t = shape t';

sameshape t2 (L(1, [L(2,[]), L(7,[]), L(7,[])]));
     */
    //TODO test types
    let t1 = new Val.ConstructedValue('L', createTuple([
        new Val.Integer(7),
        createList([])
    ]), 0);
    let t2 = new Val.ConstructedValue('L', createTuple([
        new Val.Integer(1),
        createList([
            new Val.ConstructedValue('L', createTuple([
                new Val.Integer(2),
                createList([])
            ]), 0),
            t1,
            t1
        ])
    ]), 0);
    let t3 = new Val.ConstructedValue('L', createTuple([
        new Val.Integer(3),
        createList([
            new Val.ConstructedValue('L', createTuple([
                new Val.Integer(0),
                createList([
                    t2
                ])
            ]), 0),
            new Val.ConstructedValue('L', createTuple([
                new Val.Integer(4),
                createList([])
            ]), 0),
            t2
        ])
    ]), 0);
    run_test([
        ['datatype tree = T of tree list;', (x) => { x(); }, (state: State.State, hasThrown: boolean, exceptionValue: Val.Exception) => {
            // see 7.1
        }],
        ['datatype \'a ltr = L of \'a * \'a ltr list;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('L')[0]).toEqualWithType(new Val.ValueConstructor('L', 1));
            //expect(state.getStaticValue('L')).toEqualWithType(TODO);
        }],
        ['val t1 = L(7,[]);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('t1')[0]).toEqualWithType(t1);
            //expect(state.getStaticValue('t1')).toEqualWithType(TODO);
        }],
        ['val t2 = L(1, [L(2,[]), t1, t1]);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('t2')[0]).toEqualWithType(t2);
            //expect(state.getStaticValue('t2')).toEqualWithType(TODO);
        }],
        ['val t3 = L(3, [L(0,[t2]), L(4,[]), t2]);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('t3')[0]).toEqualWithType(t3);
            //expect(state.getStaticValue('t3')).toEqualWithType(TODO);
        }],
        ['fun head (L(x,_)) = x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('head')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('head')).toEqualWithType(TODO);
        }],
        ['fun shape (L(_,ts)) = T(map shape ts);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('shape')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('shape')).toEqualWithType(TODO);
        }],
        ['shape t2;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.ConstructedValue('T', createList([
                new Val.ConstructedValue('T', createList([]), 0),
                new Val.ConstructedValue('T', createList([]), 0),
                new Val.ConstructedValue('T', createList([]), 0)
            ]), 0));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['fun sameshape t t\' = shape t = shape t\';', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('sameshape')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('sameshape')).toEqualWithType(TODO);
        }],
        ['sameshape t2 (L(1, [L(2,[]), L(7,[]), L(7,[])]));', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.BoolValue(true));
            //expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('bool'), 0]);
        }],
    ]);
});

it("12.1", () => {
    /*
datatype con = False | True | IC of int (* constants *)
type id = string (* identifiers *)
datatype opr = Add | Sub | Mul | Leq (* operators *)
datatype ty = (* types *)
    Bool
  | Int
  | Arrow of ty * ty (* procedure type *)
datatype exp = (* expressions *)
    Con of con (* constant *)
  | Id of id (* identifier *)
  | Opr of opr * exp * exp (* operator application *)
  | If of exp * exp * exp (* conditional *)
  | Abs of id * ty * exp (* abstraction *)
  | App of exp * exp (* procedure application *)
;

val e1 = Opr(Leq, Id"n", Con(IC 0));
     */
    //TODO test types
    run_test([
        ['datatype con = False | True | IC of int (* constants *) ' +
            'type id = string (* identifiers *) ' +
            'datatype opr = Add | Sub | Mul | Leq (* operators *) ' +
            'datatype ty = (* types *) ' +
            '    Bool ' +
            '  | Int ' +
            '  | Arrow of ty * ty (* procedure type *) ' +
            'datatype exp = (* expressions *) ' +
            '    Con of con (* constant *) ' +
            '  | Id of id (* identifier *) ' +
            '  | Opr of opr * exp * exp (* operator application *) ' +
            '  | If of exp * exp * exp (* conditional *) ' +
            '  | Abs of id * ty * exp (* abstraction *) ' +
            '  | App of exp * exp (* procedure application *) ' +
            ';', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('False')[0]).toEqualWithType(new Val.ValueConstructor('False', 0));
            //expect(state.getStaticValue('False')).toEqualWithType(TODO);
            expect(state.getDynamicValue('True')[0]).toEqualWithType(new Val.ValueConstructor('True', 0));
            //expect(state.getStaticValue('True')).toEqualWithType(TODO);
            expect(state.getDynamicValue('IC')[0]).toEqualWithType(new Val.ValueConstructor('IC', 1));
            //expect(state.getStaticValue('IC')).toEqualWithType(TODO);
            expect(state.getDynamicValue('Add')[0]).toEqualWithType(new Val.ValueConstructor('Add', 0));
            //expect(state.getStaticValue('Add')).toEqualWithType(TODO);
            expect(state.getDynamicValue('Sub')[0]).toEqualWithType(new Val.ValueConstructor('Sub', 0));
            //expect(state.getStaticValue('Sub')).toEqualWithType(TODO);
            expect(state.getDynamicValue('Mul')[0]).toEqualWithType(new Val.ValueConstructor('Mul', 0));
            //expect(state.getStaticValue('Mul')).toEqualWithType(TODO);
            expect(state.getDynamicValue('Leq')[0]).toEqualWithType(new Val.ValueConstructor('Leq', 0));
            //expect(state.getStaticValue('Leq')).toEqualWithType(TODO);
            expect(state.getDynamicValue('Bool')[0]).toEqualWithType(new Val.ValueConstructor('Bool', 0));
            //expect(state.getStaticValue('Bool')).toEqualWithType(TODO);
            expect(state.getDynamicValue('Int')[0]).toEqualWithType(new Val.ValueConstructor('Int', 0));
            //expect(state.getStaticValue('Int')).toEqualWithType(TODO);
            expect(state.getDynamicValue('Arrow')[0]).toEqualWithType(new Val.ValueConstructor('Arrow', 1));
            //expect(state.getStaticValue('Arrow')).toEqualWithType(TODO);
            expect(state.getDynamicValue('Con')[0]).toEqualWithType(new Val.ValueConstructor('Con', 1));
            //expect(state.getStaticValue('Con')).toEqualWithType(TODO);
            expect(state.getDynamicValue('Id')[0]).toEqualWithType(new Val.ValueConstructor('Id', 1));
            //expect(state.getStaticValue('Id')).toEqualWithType(TODO);
            expect(state.getDynamicValue('Opr')[0]).toEqualWithType(new Val.ValueConstructor('Opr', 1));
            //expect(state.getStaticValue('Opr')).toEqualWithType(TODO);
            expect(state.getDynamicValue('If')[0]).toEqualWithType(new Val.ValueConstructor('If', 1));
            //expect(state.getStaticValue('If')).toEqualWithType(TODO);
            expect(state.getDynamicValue('Abs')[0]).toEqualWithType(new Val.ValueConstructor('Abs', 1));
            //expect(state.getStaticValue('Abs')).toEqualWithType(TODO);
            expect(state.getDynamicValue('App')[0]).toEqualWithType(new Val.ValueConstructor('App', 1));
            //expect(state.getStaticValue('App')).toEqualWithType(TODO);
        }],
        ['val e1 = Opr(Leq, Id"n", Con(IC 0));', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('e1')[0]).toEqualWithType(new Val.ConstructedValue('Opr', createTuple([
                new Val.ConstructedValue('Leq', undefined, 0),
                new Val.ConstructedValue('Id', new Val.StringValue('n'), 0),
                new Val.ConstructedValue('Con', new Val.ConstructedValue('IC', new Val.Integer(0), 0), 0)
            ]), 0));
            //expect(state.getStaticValue('e1')).toEqualWithType(TODO);
        }]
    ]);
});

it("12.4", () => {
    /*
datatype con = False | True | IC of int (* constants *)
type id = string (* identifiers *)
datatype opr = Add | Sub | Mul | Leq (* operators *)
datatype ty = (* types *)
    Bool
  | Int
  | Arrow of ty * ty (* procedure type *)
datatype exp = (* expressions *)
    Con of con (* constant *)
  | Id of id (* identifier *)
  | Opr of opr * exp * exp (* operator application *)
  | If of exp * exp * exp (* conditional *)
  | Abs of id * ty * exp (* abstraction *)
  | App of exp * exp (* procedure application *)
;

type 'a env = id -> 'a (* environments *)
exception Unbound of id
fun empty x = raise Unbound x
fun update env x a y = if y=x then a else env y
exception Error of string
fun elabCon True = Bool
  | elabCon False = Bool
  | elabCon (IC _) = Int
fun elabOpr Add Int Int = Int
  | elabOpr Sub Int Int = Int
  | elabOpr Mul Int Int = Int
  | elabOpr Leq Int Int = Bool
  | elabOpr ___= raise Error "T Opr"
fun elab f (Con c) = elabCon c
  | elab f (Id x) = f x
  | elab f (Opr(opr,e1,e2)) = elabOpr opr (elab f e1) (elab f e2)
  | elab f (If(e1,e2,e3)) =
            (case (elab f e1, elab f e2, elab f e3) of
            (Bool, t2, t3) => if t2=t3 then t2
                              else raise Error "T If1"
            | _ => raise Error "T If2")
  | elab f (Abs(x,t,e)) = Arrow(t, elab (update f x t) e)
  | elab f (App(e1,e2)) = (case elab f e1 of
                          Arrow(t,t') => if t = elab f e2 then t'
                                          else raise Error "T App1"
                          | _ => raise Error "T App2")
;

val f = update (update empty "x" Int) "y" Bool;

f "y";
f "z";

val f = update (update empty "x" Int) "y" Bool;
val e = Abs("y", Int, Opr(Leq, Id"x", Id"y"));
elab f e;

datatype elab = T of ty | SE of string;
fun elab' f e = T(elab f e) handle
    Unbound s => SE("Unbound "^s)
  | Error s => SE("Error "^s);
elab' f e;
elab' f (App(Id"x", Id"x"));
elab' empty (Id "x");
     */
    //TODO test types
    run_test([
        ['datatype con = False | True | IC of int (* constants *) ' +
            'type id = string (* identifiers *) ' +
            'datatype opr = Add | Sub | Mul | Leq (* operators *) ' +
            'datatype ty = (* types *) ' +
            '    Bool ' +
            '  | Int ' +
            '  | Arrow of ty * ty (* procedure type *) ' +
            'datatype exp = (* expressions *) ' +
            '    Con of con (* constant *) ' +
            '  | Id of id (* identifier *) ' +
            '  | Opr of opr * exp * exp (* operator application *) ' +
            '  | If of exp * exp * exp (* conditional *) ' +
            '  | Abs of id * ty * exp (* abstraction *) ' +
            '  | App of exp * exp (* procedure application *) ' +
            ';', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
                // copy from 12.1
        }],
        ['type \'a env = id -> \'a (* environments *) ' +
            'exception Unbound of id ' +
            'fun empty x = raise Unbound x ' +
            'fun update env x a y = if y=x then a else env y ' +
            'exception Error of string ' +
            'fun elabCon True = Bool ' +
            '  | elabCon False = Bool ' +
            '  | elabCon (IC _) = Int ' +
            'fun elabOpr Add Int Int = Int ' +
            '  | elabOpr Sub Int Int = Int ' +
            '  | elabOpr Mul Int Int = Int ' +
            '  | elabOpr Leq Int Int = Bool ' +
            '  | elabOpr ___= raise Error "T Opr" ' +
            'fun elab f (Con c) = elabCon c ' +
            '  | elab f (Id x) = f x ' +
            '  | elab f (Opr(opr,e1,e2)) = elabOpr opr (elab f e1) (elab f e2) ' +
            '  | elab f (If(e1,e2,e3)) = ' +
            '            (case (elab f e1, elab f e2, elab f e3) of ' +
            '            (Bool, t2, t3) => if t2=t3 then t2 ' +
            '                              else raise Error "T If1" ' +
            '            | _ => raise Error "T If2") ' +
            '  | elab f (Abs(x,t,e)) = Arrow(t, elab (update f x t) e) ' +
            '  | elab f (App(e1,e2)) = (case elab f e1 of ' +
            '                          Arrow(t,t\') => if t = elab f e2 then t\' ' +
            '                                          else raise Error "T App1" ' +
            '                          | _ => raise Error "T App2") ' +
            '; ' +
            '', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('Unbound')[0]).toEqualWithType(new Val.ExceptionConstructor('Unbound', 1));
            //expect(state.getStaticValue('Unbound')).toEqualWithType(TODO);
            expect(state.getDynamicValue('empty')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('empty')).toEqualWithType(TODO);
            expect(state.getDynamicValue('update')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('update')).toEqualWithType(TODO);
            expect(state.getDynamicValue('Error')[0]).toEqualWithType(new Val.ExceptionConstructor('Error', 1));
            //expect(state.getStaticValue('Error')).toEqualWithType(TODO);
            expect(state.getDynamicValue('elabCon')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('elabCon')).toEqualWithType(TODO);
            expect(state.getDynamicValue('elabOpr')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('elabOpr')).toEqualWithType(TODO);
            expect(state.getDynamicValue('elab')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('elab')).toEqualWithType(TODO);
        }],
        ['val f = update (update empty "x" Int) "y" Bool;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('f')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('f')).toEqualWithType(TODO);
        }],
        ['f "y";', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.ConstructedValue('Bool', undefined, 0));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['f "z";', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(true);
            expect(exceptionValue).toEqualWithType(new Val.ExceptionValue('Unbound', new Val.StringValue('z')));
        }],
        ['val f = update (update empty "x" Int) "y" Bool;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('f')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('f')).toEqualWithType(TODO);
        }],
        ['val e = Abs("y", Int, Opr(Leq, Id"x", Id"y"));', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('e')[0]).toEqualWithType(new Val.ConstructedValue('Abs', createTuple([
                new Val.StringValue('y'),
                new Val.ConstructedValue('Int', undefined),
                new Val.ConstructedValue('Opr', createTuple([
                    new Val.ConstructedValue('Leq', undefined, 0),
                    new Val.ConstructedValue('Id', new Val.StringValue('x'), 0),
                    new Val.ConstructedValue('Id', new Val.StringValue('y'), 0)
                ]), 0)
            ]) 0));
            //expect(state.getStaticValue('e')).toEqualWithType(TODO);
        }],
        ['elab f e;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.ConstructedValue('Arrow', createTuple([
                new Val.ConstructedValue('Int', undefined, 0),
                new Val.ConstructedValue('Bool', undefined, 0)
            ]), 0));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['datatype elab = T of ty | SE of string;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('T')[0]).toEqualWithType(new Val.ValueConstructor('T', 1));
            //expect(state.getStaticValue('T')).toEqualWithType(TODO);
            expect(state.getDynamicValue('SE')[0]).toEqualWithType(new Val.ValueConstructor('SE', 1));
            //expect(state.getStaticValue('SE')).toEqualWithType(TODO);
        }],
        ['fun elab\' f e = T(elab f e) handle Unbound s => SE("Unbound "^s) | Error s => SE("Error "^s);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('elab\'')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('elab\'')).toEqualWithType(TODO);
        }],
        ['elab\' f e;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.ConstructedValue('T',
                new Val.ConstructedValue('Arrow', createTuple([
                    new Val.ConstructedValue('Int', undefined, 0),
                    new Val.ConstructedValue('Bool', undefined, 0)
                ]), 0),
            0));
        }],
        ['elab\' f (App(Id"x", Id"x"));', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.ConstructedValue('SE', new Val.StringValue("Error T App2"), 0));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['elab\' empty (Id "x");', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.ConstructedValue('SE', new Val.StringValue("Unbound x"), 0));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
    ]);
});

it("12.5", () => {
    /*
datatype con = False | True | IC of int (* constants *)
type id = string (* identifiers *)
datatype opr = Add | Sub | Mul | Leq (* operators *)
datatype ty = (* types *)
    Bool
  | Int
  | Arrow of ty * ty (* procedure type *)
datatype exp = (* expressions *)
    Con of con (* constant *)
  | Id of id (* identifier *)
  | Opr of opr * exp * exp (* operator application *)
  | If of exp * exp * exp (* conditional *)
  | Abs of id * ty * exp (* abstraction *)
  | App of exp * exp (* procedure application *)
;

type 'a env = id -> 'a (* environments *)
exception Unbound of id
fun empty x = raise Unbound x
fun update env x a y = if y=x then a else env y
;

datatype value =
    IV of int
  | Proc of id * exp * value env
fun evalCon False = IV 0
  | evalCon True = IV 1
  | evalCon (IC x) = IV x
fun evalOpr Add (IV x1) (IV x2) = IV(x1+x2)
  | evalOpr Sub (IV x1) (IV x2) = IV(x1-x2)
  | evalOpr Mul (IV x1) (IV x2) = IV(x1*x2)
  | evalOpr Leq (IV x1) (IV x2) = IV(if x1<=x2 then 1 else 0)
  | evalOpr _ _ _ = raise Error "R Opr"
fun eval f (Con c) = evalCon c
  | eval f (Id x) = f x
  | eval f (Opr(opr,e1,e2)) = evalOpr opr (eval f e1) (eval f e2)
  | eval f (If(e1,e2,e3)) = (case eval f e1 of
                              IV 1 => eval f e2
                            | IV 0 => eval f e3
                            | _ => raise Error "R If")
  | eval f (Abs(x,t,e)) = Proc(x, e, f)
  | eval f (App(e1,e2)) = (case (eval f e1, eval f e2) of
                          (Proc(x,e,f'), v) => eval (update f' x v) e
                            | _ => raise Error "R App")
;

val f = update empty "x" (IV 5);
val e = Opr(Leq, Id"x", Con(IC 7));
eval f e;
     */
    //TODO test types
    run_test([
        ['datatype con = False | True | IC of int (* constants *) ' +
            'type id = string (* identifiers *) ' +
            'datatype opr = Add | Sub | Mul | Leq (* operators *) ' +
            'datatype ty = (* types *) ' +
            '    Bool ' +
            '  | Int ' +
            '  | Arrow of ty * ty (* procedure type *) ' +
            'datatype exp = (* expressions *) ' +
            '    Con of con (* constant *) ' +
            '  | Id of id (* identifier *) ' +
            '  | Opr of opr * exp * exp (* operator application *) ' +
            '  | If of exp * exp * exp (* conditional *) ' +
            '  | Abs of id * ty * exp (* abstraction *) ' +
            '  | App of exp * exp (* procedure application *) ' +
            ';', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
                // copy from 12.1
            }],
        ['type \'a env = id -> \'a (* environments *) ' +
            'exception Unbound of id ' +
            'fun empty x = raise Unbound x ' +
            'fun update env x a y = if y=x then a else env y ' +
            'exception Error of string ' +
            ';', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
                // copy from 12.4
        }],
        ['datatype value = ' +
            '    IV of int ' +
            '  | Proc of id * exp * value env ' +
            'fun evalCon False = IV 0 ' +
            '  | evalCon True = IV 1 ' +
            '  | evalCon (IC x) = IV x ' +
            'fun evalOpr Add (IV x1) (IV x2) = IV(x1+x2) ' +
            '  | evalOpr Sub (IV x1) (IV x2) = IV(x1-x2) ' +
            '  | evalOpr Mul (IV x1) (IV x2) = IV(x1*x2) ' +
            '  | evalOpr Leq (IV x1) (IV x2) = IV(if x1<=x2 then 1 else 0) ' +
            '  | evalOpr _ _ _ = raise Error "R Opr" ' +
            'fun eval f (Con c) = evalCon c ' +
            '  | eval f (Id x) = f x ' +
            '  | eval f (Opr(opr,e1,e2)) = evalOpr opr (eval f e1) (eval f e2) ' +
            '  | eval f (If(e1,e2,e3)) = (case eval f e1 of ' +
            '                             IV 1 => eval f e2 ' +
            '                           | IV 0 => eval f e3 ' +
            '                           | _ => raise Error "R If") ' +
            '  | eval f (Abs(x,t,e)) = Proc(x, e, f) ' +
            '  | eval f (App(e1,e2)) = (case (eval f e1, eval f e2) of ' +
            '                          (Proc(x,e,f\'), v) => eval (update f\' x v) e ' +
            '                           | _ => raise Error "R App") ' +
            ';', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('IV')[0]).toEqualWithType(new Val.ValueConstructor('IV', 1));
            //expect(state.getStaticValue('IV')).toEqualWithType(TODO);
            expect(state.getDynamicValue('Proc')[0]).toEqualWithType(new Val.ValueConstructor('Proc', 1));
            //expect(state.getStaticValue('Proc')).toEqualWithType(TODO);
            expect(state.getDynamicValue('evalCon')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('evalCon')).toEqualWithType(TODO);
            expect(state.getDynamicValue('evalOpr')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('evalOpr')).toEqualWithType(TODO);
            expect(state.getDynamicValue('eval')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('eval')).toEqualWithType(TODO);
        }],
        ['val f = update empty "x" (IV 5);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('f')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('f')).toEqualWithType(TODO);
        }],
        ['val e = Opr(Leq, Id"x", Con(IC 7));', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('e')[0]).toEqualWithType(new Val.ConstructedValue('Opr', createTuple([
                new Val.ConstructedValue('Leq', undefined, 0),
                new Val.ConstructedValue('Id', new Val.StringValue('x'), 0),
                new Val.ConstructedValue('Con', new Val.ConstructedValue('IC', new Val.Integer(7), 0), 0),
            ]), 0));
            //expect(state.getStaticValue('e')).toEqualWithType(TODO);
        }],
        ['eval f e;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.ConstructedValue('IV', new Val.Integer(1), 0));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }]
    ]);
});

it("13.1", () => {
    /*
exception Error of string
datatype token = BOOL | INT | ARROW | LPAR | RPAR
fun lex nil = nil
  | lex (#" ":: cr) = lex cr
  | lex (#"\t":: cr) = lex cr
  | lex (#"\n":: cr) = lex cr
  | lex (#"b":: #"o":: #"o":: #"l":: cr) = BOOL:: lex cr
  | lex (#"i":: #"n":: #"t":: cr) = INT:: lex cr
  | lex (#"-":: #">":: cr) = ARROW:: lex cr
  | lex (#"(":: cr) = LPAR:: lex cr
  | lex (#")":: cr) = RPAR:: lex cr
  | lex _ = raise Error "lex"
;

lex (explode "(int->bool)->int");
lex (explode " intbool->int ");
     */
    //TODO test types
    run_test([
        ['exception Error of string ' +
            'datatype token = BOOL | INT | ARROW | LPAR | RPAR ' +
            'fun lex nil = nil ' +
            '  | lex (#" ":: cr) = lex cr ' +
            '  | lex (#"\\t":: cr) = lex cr ' +
            '  | lex (#"\\n":: cr) = lex cr ' +
            '  | lex (#"b":: #"o":: #"o":: #"l":: cr) = BOOL:: lex cr ' +
            '  | lex (#"i":: #"n":: #"t":: cr) = INT:: lex cr ' +
            '  | lex (#"-":: #">":: cr) = ARROW:: lex cr ' +
            '  | lex (#"(":: cr) = LPAR:: lex cr ' +
            '  | lex (#")":: cr) = RPAR:: lex cr ' +
            '  | lex _ = raise Error "lex" ' +
            ';', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('Error')[0]).toEqualWithType(new Val.ExceptionConstructor('Error', 1));
            //expect(state.getStaticValue('Error')).toEqualWithType(TODO);
            expect(state.getDynamicValue('BOOL')[0]).toEqualWithType(new Val.ValueConstructor('BOOL', 0));
            //expect(state.getStaticValue('BOOL')).toEqualWithType(TODO);
            expect(state.getDynamicValue('INT')[0]).toEqualWithType(new Val.ValueConstructor('INT', 0));
            //expect(state.getStaticValue('INT')).toEqualWithType(TODO);
            expect(state.getDynamicValue('ARROW')[0]).toEqualWithType(new Val.ValueConstructor('ARROW', 0));
            //expect(state.getStaticValue('ARROW')).toEqualWithType(TODO);
            expect(state.getDynamicValue('LPAR')[0]).toEqualWithType(new Val.ValueConstructor('LPAR', 0));
            //expect(state.getStaticValue('LPAR')).toEqualWithType(TODO);
            expect(state.getDynamicValue('RPAR')[0]).toEqualWithType(new Val.ValueConstructor('RPAR', 0));
            //expect(state.getStaticValue('RPAR')).toEqualWithType(TODO);
            expect(state.getDynamicValue('lex')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('lex')).toEqualWithType(TODO);
        }],
        ['lex (explode "(int->bool)->int");', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.ConstructedValue('LPAR', undefined, 0),
                new Val.ConstructedValue('INT', undefined, 0),
                new Val.ConstructedValue('ARROW', undefined, 0),
                new Val.ConstructedValue('BOOL', undefined, 0),
                new Val.ConstructedValue('RPAR', undefined, 0),
                new Val.ConstructedValue('ARROW', undefined, 0),
                new Val.ConstructedValue('INT', undefined, 0)
            ]));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['lex (explode " intbool->int ");', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.ConstructedValue('INT', undefined, 0),
                new Val.ConstructedValue('BOOL', undefined, 0),
                new Val.ConstructedValue('ARROW', undefined, 0),
                new Val.ConstructedValue('INT', undefined, 0)
            ]));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }]
    ]);
});

it("13.3", () => {
    /*
exception Error of string;

fun test (0::tr) = tr
| test (1::tr) = test tr
| test (2::tr) = test (test tr)
| test _ = raise Error "test";

test [2,0,1,0];
test [2,0,1,0,7];
test [2,0,1];

datatype tree = A | B of tree | C of tree * tree;

fun rep A = [0]
  | rep (B t) = 1 :: rep t
  | rep (C(t,t')) = 2 :: rep t @ rep t';

rep (C(B A, C(A, A)));

fun parse (0::tr) = (A, tr)
  | parse (1::tr) = let val (s,ts) = parse tr in (B s, ts) end
  | parse (2::tr) = let val (s,ts) = parse tr
                        val (s', ts') = parse ts
                    in (C(s,s'), ts') end
  | parse _ = raise Error "parse";

parse [2,0,1,0,7];
parse (rep (C(B A, C(A, A))));
     */
    //TODO test types
    run_test([
        ['exception Error of string;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('Error')[0]).toEqualWithType(new Val.ExceptionConstructor('Error', 1));
            //expect(state.getStaticValue('Error')).toEqualWithType(TODO);
        }],
        ['fun test (0::tr) = tr | test (1::tr) = test tr | test (2::tr) = test (test tr) | test _ = raise Error "test";', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('test')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('test')).toEqualWithType(TODO);
        }],
        ['test [2,0,1,0];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([]));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['test [2,0,1,0,7];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.Integer(7)
            ]));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['test [2,0,1];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(true);
            expect(exceptionValue).toEqualWithType(new Val.ExceptionValue('Error', new Val.StringValue('test')));
        }],
        ['datatype tree = A | B of tree | C of tree * tree;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('A')[0]).toEqualWithType(new Val.ValueConstructor('A', 0));
            //expect(state.getStaticValue('A')).toEqualWithType(TODO);
            expect(state.getDynamicValue('B')[0]).toEqualWithType(new Val.ValueConstructor('B', 1));
            //expect(state.getStaticValue('B')).toEqualWithType(TODO);
            expect(state.getDynamicValue('C')[0]).toEqualWithType(new Val.ValueConstructor('C', 1));
            //expect(state.getStaticValue('C')).toEqualWithType(TODO);
        }],
        ['fun rep A = [0] | rep (B t) = 1 :: rep t | rep (C(t,t\')) = 2 :: rep t @ rep t\';', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('rep')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('rep')).toEqualWithType(TODO);
        }],
        ['rep (C(B A, C(A, A)));', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.Integer(2),
                new Val.Integer(1),
                new Val.Integer(0),
                new Val.Integer(2),
                new Val.Integer(0),
                new Val.Integer(0)
            ]));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['fun parse (0::tr) = (A, tr) | parse (1::tr) = let val (s,ts) = parse tr in (B s, ts) end | parse (2::tr) = let val (s,ts) = parse tr val (s\', ts\') = parse ts in (C(s,s\'), ts\') end | parse _ = raise Error "parse";', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('parse')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('parse')).toEqualWithType(TODO);
        }],
        ['parse [2,0,1,0,7];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createTuple([
                new Val.ConstructedValue('C', createTuple([
                    new Val.ConstructedValue('A', undefined, 0),
                    new Val.ConstructedValue('B', new Val.ConstructedValue('A', undefined), 0)
                ]), 0),
                createList([new Val.Integer(7)])
            ]);
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['parse (rep (C(B A, C(A, A))));', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createTuple([
                new Val.ConstructedValue('C', createTuple([
                    new Val.ConstructedValue('B', new Val.ConstructedValue('A', undefined), 0)
                    new Val.ConstructedValue('C', createTuple([
                        new Val.ConstructedValue('A', undefined, 0),
                        new Val.ConstructedValue('A', undefined, 0)
                    ]), 0)
                ]), 0),
                createList([])
            ]);
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
    ]);
});

it("13.4", () => {
    /*
datatype con = False | True | IC of int (* constants *)
type id = string (* identifiers *)
datatype opr = Add | Sub | Mul | Leq (* operators *)
datatype ty = (* types *)
    Bool
  | Int
  | Arrow of ty * ty (* procedure type *)
datatype exp = (* expressions *)
    Con of con (* constant *)
  | Id of id (* identifier *)
  | Opr of opr * exp * exp (* operator application *)
  | If of exp * exp * exp (* conditional *)
  | Abs of id * ty * exp (* abstraction *)
  | App of exp * exp (* procedure application *)
;
exception Error of string
datatype token = BOOL | INT | ARROW | LPAR | RPAR
fun lex nil = nil
  | lex (#" ":: cr) = lex cr
  | lex (#"\t":: cr) = lex cr
  | lex (#"\n":: cr) = lex cr
  | lex (#"b":: #"o":: #"o":: #"l":: cr) = BOOL:: lex cr
  | lex (#"i":: #"n":: #"t":: cr) = INT:: lex cr
  | lex (#"-":: #">":: cr) = ARROW:: lex cr
  | lex (#"(":: cr) = LPAR:: lex cr
  | lex (#")":: cr) = RPAR:: lex cr
  | lex _ = raise Error "lex"
;

fun ty ts = case pty ts of ARROW::tr => ty tr | tr => tr
and pty (BOOL::tr) = tr
  | pty (INT::tr) = tr
  | pty (LPAR::tr) = (case ty tr of RPAR::tr => tr
                      | _ => raise Error "RPAR")
  | pty _ = raise Error "pty";

ty [INT, ARROW, BOOL, RPAR];
ty [INT, ARROW, BOOL, ARROW];
ty [LPAR, BOOL];

fun ty ts = (case pty ts of
            (t, ARROW::tr) => let val (t',tr') = ty tr
                              in (Arrow(t,t'), tr') end
            | s => s)
and pty (BOOL::tr) = (Bool,tr)
  | pty (INT::tr) = (Int,tr)
  | pty (LPAR::tr) = (case ty tr of
                    (t,RPAR::tr') => (t,tr')
                    | _ => raise Error "pty")
  | pty _ = raise Error "pty";

fun match (a,ts) t = if null ts orelse hd ts <> t
                      then raise Error "match"
                      else (a, tl ts)
fun extend (a,ts) p f = let val (a',tr) = p ts in (f(a,a'),tr) end
fun parse p ts = case p ts of
                  (a,nil) => a
                  | _ => raise Error "parse"
;

ty [INT, ARROW, BOOL, RPAR];
parse ty [INT, ARROW, BOOL, RPAR];
parse ty [INT, ARROW, BOOL, ARROW, INT];
parse ty (lex (explode "int->bool->int"));

fun ty ts = case pty ts of
            (t, ARROW::tr) => extend (t,tr) ty Arrow
            | s => s
and pty (BOOL::tr) = (Bool,tr)
  | pty (INT::tr) = (Int,tr)
  | pty (LPAR::tr) = match (ty tr) RPAR
  | pty _ = raise Error "pty"
;
     */
    //TODO test types
    run_test([
        ['datatype con = False | True | IC of int (* constants *) ' +
            'type id = string (* identifiers *) ' +
            'datatype opr = Add | Sub | Mul | Leq (* operators *) ' +
            'datatype ty = (* types *) ' +
            '    Bool ' +
            '  | Int ' +
            '  | Arrow of ty * ty (* procedure type *) ' +
            'datatype exp = (* expressions *) ' +
            '    Con of con (* constant *) ' +
            '  | Id of id (* identifier *) ' +
            '  | Opr of opr * exp * exp (* operator application *) ' +
            '  | If of exp * exp * exp (* conditional *) ' +
            '  | Abs of id * ty * exp (* abstraction *) ' +
            '  | App of exp * exp (* procedure application *) ' +
            ';', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
                // copy from 12.1
        }],
        ['exception Error of string ' +
            'datatype token = BOOL | INT | ARROW | LPAR | RPAR ' +
            'fun lex nil = nil ' +
            '  | lex (#" ":: cr) = lex cr ' +
            '  | lex (#"\\t":: cr) = lex cr ' +
            '  | lex (#"\\n":: cr) = lex cr ' +
            '  | lex (#"b":: #"o":: #"o":: #"l":: cr) = BOOL:: lex cr ' +
            '  | lex (#"i":: #"n":: #"t":: cr) = INT:: lex cr ' +
            '  | lex (#"-":: #">":: cr) = ARROW:: lex cr ' +
            '  | lex (#"(":: cr) = LPAR:: lex cr ' +
            '  | lex (#")":: cr) = RPAR:: lex cr ' +
            '  | lex _ = raise Error "lex" ' +
            ';', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
                // copy from 13.1
        }],
        ['fun ty ts = case pty ts of ARROW::tr => ty tr | tr => tr ' +
            'and pty (BOOL::tr) = tr ' +
            '  | pty (INT::tr) = tr ' +
            '  | pty (LPAR::tr) = (case ty tr of RPAR::tr => tr ' +
            '                      | _ => raise Error "RPAR") ' +
            '  | pty _ = raise Error "pty";', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('ty')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('ty')).toEqualWithType(TODO);
            expect(state.getDynamicValue('pty')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('pty')).toEqualWithType(TODO);
        }],
        ['ty [INT, ARROW, BOOL, RPAR];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.ConstructedValue('RPAR', undefined, 0)
            ]));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['ty [INT, ARROW, BOOL, ARROW];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(true);
            expect(exceptionValue).toEqualWithType(new Val.ExceptionValue('Error', new Val.StringValue('pty')));
        }],
        ['ty [LPAR, BOOL];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(true);
            expect(exceptionValue).toEqualWithType(new Val.ExceptionValue('Error', new Val.StringValue('RPAR')));
        }],
        ['fun ty ts = (case pty ts of ' +
            '            (t, ARROW::tr) => let val (t\',tr\') = ty tr ' +
            '                              in (Arrow(t,t\'), tr\') end ' +
            '            | s => s) ' +
            'and pty (BOOL::tr) = (Bool,tr) ' +
            '  | pty (INT::tr) = (Int,tr) ' +
            '  | pty (LPAR::tr) = (case ty tr of ' +
            '                    (t,RPAR::tr\') => (t,tr\') ' +
            '                    | _ => raise Error "pty") ' +
            '  | pty _ = raise Error "pty";', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('ty')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('ty')).toEqualWithType(TODO);
            expect(state.getDynamicValue('pty')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('pty')).toEqualWithType(TODO);
        }],
        ['fun match (a,ts) t = if null ts orelse hd ts <> t ' +
            '                      then raise Error "match" ' +
            '                      else (a, tl ts) ' +
            'fun extend (a,ts) p f = let val (a\',tr) = p ts in (f(a,a\'),tr) end ' +
            'fun parse p ts = case p ts of ' +
            '                  (a,nil) => a ' +
            '                  | _ => raise Error "parse" ' +
            ';', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('match')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('match')).toEqualWithType(TODO);
            expect(state.getDynamicValue('extend')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('extend')).toEqualWithType(TODO);
            expect(state.getDynamicValue('parse')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('parse')).toEqualWithType(TODO);
        }],
        ['ty [INT, ARROW, BOOL, RPAR];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createTuple([
                new Val.ConstructedValue('Arrow', createTuple([
                    new Val.ConstructedValue('Int', undefined, 0),
                    new Val.ConstructedValue('Bool', undefined, 0)
                ]), 0),
                createList([
                    new Val.ConstructedValue('RPAR', undefined, 0)
                ])
            );
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['parse ty [INT, ARROW, BOOL, RPAR];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(true);
            expect(exceptionValue).toEqualWithType(new Val.ExceptionValue('Error', new Val.StringValue('parse')));
        }],
        ['parse ty [INT, ARROW, BOOL, ARROW, INT];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.ConstructedValue('Arrow', createTuple([
                new Val.ConstructedValue('Int', undefined, 0),
                new Val.ConstructedValue('Arrow', createTuple([
                    new Val.ConstructedValue('Bool', undefined, 0),
                    new Val.ConstructedValue('Int', undefined, 0)
                ]), 0),
            ]), 0));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['parse ty (lex (explode "int->bool->int"));', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.ConstructedValue('Arrow', createTuple([
                new Val.ConstructedValue('Int', undefined, 0),
                new Val.ConstructedValue('Arrow', createTuple([
                    new Val.ConstructedValue('Bool', undefined, 0),
                    new Val.ConstructedValue('Int', undefined, 0)
                ]), 0),
            ]), 0));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['fun ty ts = case pty ts of ' +
            '            (t, ARROW::tr) => extend (t,tr) ty Arrow ' +
            '            | s => s ' +
            'and pty (BOOL::tr) = (Bool,tr) ' +
            '  | pty (INT::tr) = (Int,tr) ' +
            '  | pty (LPAR::tr) = match (ty tr) RPAR ' +
            '  | pty _ = raise Error "pty" ' +
            ';', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('ty')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('ty')).toEqualWithType(TODO);
            expect(state.getDynamicValue('pty')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('pty')).toEqualWithType(TODO);
        }],
    ]);
});

it("13.5.1", () => {
    /*
exception Error of string
datatype token = ADD | MUL | LPAR | RPAR | ICON of int | ID of string
fun lex nil = nil
  | lex (#" ":: cr) = lex cr
  | lex (#"\t":: cr) = lex cr
  | lex (#"\n":: cr) = lex cr
  | lex (#"+":: cr) = ADD:: lex cr
  | lex (#"*":: cr) = MUL:: lex cr
  | lex (#"(":: cr) = LPAR:: lex cr
  | lex (#")":: cr) = RPAR:: lex cr
  | lex (#"~":: c:: cr) = if Char.isDigit c then lexInt ~1 0 (c::cr)
                          else raise Error "~"
  | lex (c::cr) = if Char.isDigit c then lexInt 1 0 (c::cr)
                  else if Char.isAlpha c then lexId [c] cr
                  else raise Error "lex"
and lexInt s v cs = if null cs orelse not(Char.isDigit (hd cs))
                    then ICON(s*v) :: lex cs
                    else lexInt s (10*v+(ord(hd cs)-ord#"0")) (tl cs)
and lexId cs cs' = if null cs' orelse not(Char.isAlpha (hd cs'))
                    then ID(implode(rev cs)) :: lex cs'
                    else lexId (hd cs' ::cs) (tl cs')
;

lex (explode "x1");
lex (explode "one two");
lex (explode "onetwo");

lexId [] (explode "Aufgabe 5");
lexId [#"f", #"u", #"A"] (explode "gabe 5");

lex (explode "~3472 Katzen");
lexInt ~1 34 (explode "72 Katzen");
     */
    //TODO test types
    run_test([
        ['exception Error of string ' +
            'datatype token = ADD | MUL | LPAR | RPAR | ICON of int | ID of string ' +
            'fun lex nil = nil ' +
            '  | lex (#" ":: cr) = lex cr ' +
            '  | lex (#"\\t":: cr) = lex cr ' +
            '  | lex (#"\\n":: cr) = lex cr ' +
            '  | lex (#"+":: cr) = ADD:: lex cr ' +
            '  | lex (#"*":: cr) = MUL:: lex cr ' +
            '  | lex (#"(":: cr) = LPAR:: lex cr ' +
            '  | lex (#")":: cr) = RPAR:: lex cr ' +
            '  | lex (#"~":: c:: cr) = if Char.isDigit c then lexInt ~1 0 (c::cr) ' +
            '                          else raise Error "~" ' +
            '  | lex (c::cr) = if Char.isDigit c then lexInt 1 0 (c::cr) ' +
            '                  else if Char.isAlpha c then lexId [c] cr ' +
            '                  else raise Error "lex" ' +
            'and lexInt s v cs = if null cs orelse not(Char.isDigit (hd cs)) ' +
            '                    then ICON(s*v) :: lex cs ' +
            '                    else lexInt s (10*v+(ord(hd cs)-ord#"0")) (tl cs) ' +
            'and lexId cs cs\' = if null cs\' orelse not(Char.isAlpha (hd cs\')) ' +
            '                    then ID(implode(rev cs)) :: lex cs\' ' +
            '                    else lexId (hd cs\' ::cs) (tl cs\') ' +
            ';', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('Error')[0]).toEqualWithType(new Val.ExceptionConstructor('Error', 1));
            //expect(state.getStaticValue('Error')).toEqualWithType(TODO);
            expect(state.getDynamicValue('ADD')[0]).toEqualWithType(new Val.ValueConstructor('ADD', 0));
            //expect(state.getStaticValue('ADD')).toEqualWithType(TODO);
            expect(state.getDynamicValue('MUL')[0]).toEqualWithType(new Val.ValueConstructor('MUL', 0));
            //expect(state.getStaticValue('MUL')).toEqualWithType(TODO);
            expect(state.getDynamicValue('LPAR')[0]).toEqualWithType(new Val.ValueConstructor('LPAR', 0));
            //expect(state.getStaticValue('LPAR')).toEqualWithType(TODO);
            expect(state.getDynamicValue('RPAR')[0]).toEqualWithType(new Val.ValueConstructor('RPAR', 0));
            //expect(state.getStaticValue('RPAR')).toEqualWithType(TODO);
            expect(state.getDynamicValue('ICON')[0]).toEqualWithType(new Val.ValueConstructor('ICON', 1));
            //expect(state.getStaticValue('ICON')).toEqualWithType(TODO);
            expect(state.getDynamicValue('ID')[0]).toEqualWithType(new Val.ValueConstructor('ID', 1));
            //expect(state.getStaticValue('ID')).toEqualWithType(TODO);
            expect(state.getDynamicValue('lex')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('lex')).toEqualWithType(TODO);
            expect(state.getDynamicValue('lexInt')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('lexInt')).toEqualWithType(TODO);
            expect(state.getDynamicValue('lexId')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('lexId')).toEqualWithType(TODO);
        }],
        ['lex (explode "x1");', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.ConstructedValue('ID', new Val.StringValue('x'), 0),
                new Val.ConstructedValue('ICON', new Val.Integer(1), 0)
            ]));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['lex (explode "one two");', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.ConstructedValue('ID', new Val.StringValue('one'), 0),
                new Val.ConstructedValue('ID', new Val.StringValue('two'), 0)
            ]));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['lex (explode "onetwo");', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.ConstructedValue('ID', new Val.StringValue('onetwo'), 0),
            ]));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['lexId [] (explode "Aufgabe 5");', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.ConstructedValue('ID', new Val.StringValue('Aufgabe'), 0),
                new Val.ConstructedValue('ICON', new Val.Integer(5), 0)
            ]));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['lexId [#"f", #"u", #"A"] (explode "gabe 5");', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.ConstructedValue('ID', new Val.StringValue('Aufgabe'), 0),
                new Val.ConstructedValue('ICON', new Val.Integer(5), 0)
            ]));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['lex (explode "~3472 Katzen");', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.ConstructedValue('ICON', new Val.Integer(-3472), 0),
                new Val.ConstructedValue('ID', new Val.StringValue('Katzen'), 0)
            ]));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['lexInt ~1 34 (explode "72 Katzen");', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createList([
                new Val.ConstructedValue('ICON', new Val.Integer(-3472), 0),
                new Val.ConstructedValue('ID', new Val.StringValue('Katzen'), 0)
            ]));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }]
    ]);
});

it("13.5.2", () => {
    /*
exception Error of string
datatype token = ADD | MUL | LPAR | RPAR | ICON of int | ID of string
fun lex nil = nil
  | lex (#" ":: cr) = lex cr
  | lex (#"\t":: cr) = lex cr
  | lex (#"\n":: cr) = lex cr
  | lex (#"+":: cr) = ADD:: lex cr
  | lex (#"*":: cr) = MUL:: lex cr
  | lex (#"(":: cr) = LPAR:: lex cr
  | lex (#")":: cr) = RPAR:: lex cr
  | lex (#"~":: c:: cr) = if Char.isDigit c then lexInt ~1 0 (c::cr)
                          else raise Error "~"
  | lex (c::cr) = if Char.isDigit c then lexInt 1 0 (c::cr)
                  else if Char.isAlpha c then lexId [c] cr
                  else raise Error "lex"
and lexInt s v cs = if null cs orelse not(Char.isDigit (hd cs))
                    then ICON(s*v) :: lex cs
                    else lexInt s (10*v+(ord(hd cs)-ord#"0")) (tl cs)
and lexId cs cs' = if null cs' orelse not(Char.isAlpha (hd cs'))
                    then ID(implode(rev cs)) :: lex cs'
                    else lexId (hd cs' ::cs) (tl cs')
;

fun match (a,ts) t = if null ts orelse hd ts <> t
                      then raise Error "match"
                      else (a, tl ts)
fun extend (a,ts) p f = let val (a',tr) = p ts in (f(a,a'),tr) end
fun parse p ts = case p ts of
                  (a,nil) => a
                  | _ => raise Error "parse"
;


datatype exp = Con of int | Id of string | Sum of exp * exp
  | Pro of exp * exp
fun exp ts = exp' (mexp ts)
and exp' (e, ADD::tr) = exp' (extend (e,tr) mexp Sum)
  | exp' s = s
and mexp ts = mexp' (pexp ts)
and mexp' (e, MUL::tr) = mexp' (extend (e,tr) pexp Pro)
  | mexp' s = s
and pexp (ICON z :: tr) = (Con z, tr)
  | pexp (ID x :: tr) = (Id x, tr)
  | pexp (LPAR :: tr) = match (exp tr) RPAR
  | pexp _ = raise Error "pexp"
;

mexp' (Id "x", lex (explode "*y*z+u"));
parse exp (lex (explode "2*x+y+(z+u)"));

     */
    //TODO test types
    run_test([
        ['exception Error of string ' +
            'datatype token = ADD | MUL | LPAR | RPAR | ICON of int | ID of string ' +
            'fun lex nil = nil ' +
            '  | lex (#" ":: cr) = lex cr ' +
            '  | lex (#"\\t":: cr) = lex cr ' +
            '  | lex (#"\\n":: cr) = lex cr ' +
            '  | lex (#"+":: cr) = ADD:: lex cr ' +
            '  | lex (#"*":: cr) = MUL:: lex cr ' +
            '  | lex (#"(":: cr) = LPAR:: lex cr ' +
            '  | lex (#")":: cr) = RPAR:: lex cr ' +
            '  | lex (#"~":: c:: cr) = if Char.isDigit c then lexInt ~1 0 (c::cr) ' +
            '                          else raise Error "~" ' +
            '  | lex (c::cr) = if Char.isDigit c then lexInt 1 0 (c::cr) ' +
            '                  else if Char.isAlpha c then lexId [c] cr ' +
            '                  else raise Error "lex" ' +
            'and lexInt s v cs = if null cs orelse not(Char.isDigit (hd cs)) ' +
            '                    then ICON(s*v) :: lex cs ' +
            '                    else lexInt s (10*v+(ord(hd cs)-ord#"0")) (tl cs) ' +
            'and lexId cs cs\' = if null cs\' orelse not(Char.isAlpha (hd cs\')) ' +
            '                    then ID(implode(rev cs)) :: lex cs\' ' +
            '                    else lexId (hd cs\' ::cs) (tl cs\') ' +
            ';', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
                // copy from 13.5.1
        }],
        ['fun match (a,ts) t = if null ts orelse hd ts <> t ' +
            '                      then raise Error "match" ' +
            '                      else (a, tl ts) ' +
            'fun extend (a,ts) p f = let val (a\',tr) = p ts in (f(a,a\'),tr) end ' +
            'fun parse p ts = case p ts of ' +
            '                  (a,nil) => a ' +
            '                  | _ => raise Error "parse" ' +
            ';', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
                // copy from 13.4
        }],
        ['datatype exp = Con of int | Id of string | Sum of exp * exp ' +
            '  | Pro of exp * exp ' +
            'fun exp ts = exp\' (mexp ts) ' +
            'and exp\' (e, ADD::tr) = exp\' (extend (e,tr) mexp Sum) ' +
            '  | exp\' s = s ' +
            'and mexp ts = mexp\' (pexp ts) ' +
            'and mexp\' (e, MUL::tr) = mexp\' (extend (e,tr) pexp Pro) ' +
            '  | mexp\' s = s ' +
            'and pexp (ICON z :: tr) = (Con z, tr) ' +
            '  | pexp (ID x :: tr) = (Id x, tr) ' +
            '  | pexp (LPAR :: tr) = match (exp tr) RPAR ' +
            '  | pexp _ = raise Error "pexp" ' +
            ';', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('Con')[0]).toEqualWithType(new Val.ValueConstructor('Con', 1));
            //expect(state.getStaticValue('Con')).toEqualWithType(TODO);
            expect(state.getDynamicValue('Id')[0]).toEqualWithType(new Val.ValueConstructor('Id', 1));
            //expect(state.getStaticValue('Id')).toEqualWithType(TODO);
            expect(state.getDynamicValue('Sum')[0]).toEqualWithType(new Val.ValueConstructor('Sum', 1));
            //expect(state.getStaticValue('Sum')).toEqualWithType(TODO);
            expect(state.getDynamicValue('Pro')[0]).toEqualWithType(new Val.ValueConstructor('Pro', 1));
            //expect(state.getStaticValue('Pro')).toEqualWithType(TODO);
            expect(state.getDynamicValue('exp')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('exp')).toEqualWithType(TODO);
            expect(state.getDynamicValue('mexp')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('mexp')).toEqualWithType(TODO);
            expect(state.getDynamicValue('pexp')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('pexp')).toEqualWithType(TODO);
        }],
        ['mexp\' (Id "x", lex (explode "*y*z+u"));', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(createTuple([
                new Val.ConstructedValue('Pro', createTuple([
                    new Val.ConstructedValue('Pro', createTuple([
                        new Val.ConstructedValue('Id', new Val.StringValue('x'), 0),
                        new Val.ConstructedValue('Id', new Val.StringValue('y'), 0)
                    ]), 0),
                    new Val.ConstructedValue('Id', new Val.StringValue('z'), 0)
                ]), 0),
                createList([
                    new Val.ConstructedValue('ADD', undefined, 0),
                    new Val.ConstructedValue('ID', new Val.StringValue('u'), 0)
                ])
            ]));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }],
        ['parse exp (lex (explode "2*x+y+(z+u)"));', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')[0]).toEqualWithType(new Val.ConstructedValue('Sum', createTuple([
                new Val.ConstructedValue('Sum', createTuple([
                    new Val.ConstructedValue('Pro', createTuple([
                        new Val.ConstructedValue('Con', new Val.Integer(2), 0),
                        new Val.ConstructedValue('Id', new Val.StringValue('x'), 0)
                    ]), 0),
                    new Val.ConstructedValue('Id', new Val.StringValue('y'), 0)
                ]), 0),
                new Val.ConstructedValue('Sum', createTuple([
                    new Val.ConstructedValue('Id', new Val.StringValue('z'), 0),
                    new Val.ConstructedValue('Id', new Val.StringValue('u'), 0)
                ]), 0)
            ]), 0));
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }]
    ]);
});

it("13.6", () => {
    /*
datatype token = ARROW | LPAR | RPAR | COLON (* : *)
  | DARROW (* => *) | LEQ | ADD | SUB | MUL
  | BOOL | INT | IF | THEN | ELSE | FN | FALSE | TRUE
  | ICON of int | ID of string;
     */
    //TODO test types
    run_test([
        ['datatype token = ARROW | LPAR | RPAR | COLON (* : *) | DARROW (* => *) | LEQ | ADD | SUB | MUL | BOOL | INT | IF | THEN | ELSE | FN | FALSE | TRUE | ICON of int | ID of string;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('ARROW')[0]).toEqualWithType(new Val.ValueConstructor('ARROW', 0));
            //expect(state.getStaticValue('ARROW')).toEqualWithType(TODO);
            expect(state.getDynamicValue('LPAR')[0]).toEqualWithType(new Val.ValueConstructor('LPAR', 0));
            //expect(state.getStaticValue('LPAR')).toEqualWithType(TODO);
            expect(state.getDynamicValue('RPAR')[0]).toEqualWithType(new Val.ValueConstructor('RPAR', 0));
            //expect(state.getStaticValue('RPAR')).toEqualWithType(TODO);
            expect(state.getDynamicValue('COLON')[0]).toEqualWithType(new Val.ValueConstructor('COLON', 0));
            //expect(state.getStaticValue('COLON')).toEqualWithType(TODO);
            expect(state.getDynamicValue('DARROW')[0]).toEqualWithType(new Val.ValueConstructor('DARROW', 0));
            //expect(state.getStaticValue('DARROW')).toEqualWithType(TODO);
            expect(state.getDynamicValue('LEQ')[0]).toEqualWithType(new Val.ValueConstructor('LEQ', 0));
            //expect(state.getStaticValue('LEQ')).toEqualWithType(TODO);
            expect(state.getDynamicValue('ADD')[0]).toEqualWithType(new Val.ValueConstructor('ADD', 0));
            //expect(state.getStaticValue('ADD')).toEqualWithType(TODO);
            expect(state.getDynamicValue('SUB')[0]).toEqualWithType(new Val.ValueConstructor('SUB', 0));
            //expect(state.getStaticValue('SUB')).toEqualWithType(TODO);
            expect(state.getDynamicValue('MUL')[0]).toEqualWithType(new Val.ValueConstructor('MUL', 0));
            //expect(state.getStaticValue('MUL')).toEqualWithType(TODO);
            expect(state.getDynamicValue('BOOL')[0]).toEqualWithType(new Val.ValueConstructor('BOOL', 0));
            //expect(state.getStaticValue('BOOL')).toEqualWithType(TODO);
            expect(state.getDynamicValue('INT')[0]).toEqualWithType(new Val.ValueConstructor('INT', 0));
            //expect(state.getStaticValue('INT')).toEqualWithType(TODO);
            expect(state.getDynamicValue('IF')[0]).toEqualWithType(new Val.ValueConstructor('IF', 0));
            //expect(state.getStaticValue('IF')).toEqualWithType(TODO);
            expect(state.getDynamicValue('THEN')[0]).toEqualWithType(new Val.ValueConstructor('THEN', 0));
            //expect(state.getStaticValue('THEN')).toEqualWithType(TODO);
            expect(state.getDynamicValue('ELSE')[0]).toEqualWithType(new Val.ValueConstructor('ELSE', 0));
            //expect(state.getStaticValue('ELSE')).toEqualWithType(TODO);
            expect(state.getDynamicValue('FN')[0]).toEqualWithType(new Val.ValueConstructor('FN', 0));
            //expect(state.getStaticValue('FN')).toEqualWithType(TODO);
            expect(state.getDynamicValue('FALSE')[0]).toEqualWithType(new Val.ValueConstructor('FALSE', 0));
            //expect(state.getStaticValue('FALSE')).toEqualWithType(TODO);
            expect(state.getDynamicValue('TRUE')[0]).toEqualWithType(new Val.ValueConstructor('TRUE', 0));
            //expect(state.getStaticValue('TRUE')).toEqualWithType(TODO);
            expect(state.getDynamicValue('ICON')[0]).toEqualWithType(new Val.ValueConstructor('ICON', 1));
            //expect(state.getStaticValue('ICON')).toEqualWithType(TODO);
            expect(state.getDynamicValue('ID')[0]).toEqualWithType(new Val.ValueConstructor('ID', 1));
            //expect(state.getStaticValue('ID')).toEqualWithType(TODO);
        }]
    ]);
});

//TODO Chapter 14
//We can't check this until the module language is implemented

it("aufg1.12", () => {
    /*
fun f(n:int, a:int) : int = if n=0 then a else f(n-1, a*n);
     */
    //TODO test types
    run_test([
        ['fun f(n:int, a:int) : int = if n=0 then a else f(n-1, a*n);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('f')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('f')).toEqualWithType(TODO);
        }]
    ]);
});

it("aufg1.25", () => {
    /*
fun ifi (b:bool, x:int, y:int) = if b then x else y;

fun p (n:int) : int = if n=0 then p(n-1) else n;
fun q (n:int) : int = ifi(n=0, q(n-1), n);
     */
    //TODO test types
    run_test([
        ['fun ifi (b:bool, x:int, y:int) = if b then x else y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('ifi')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('ifi')).toEqualWithType(TODO);
        }],
        ['fun p (n:int) : int = if n=0 then p(n-1) else n;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('p')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('p')).toEqualWithType(TODO);
        }]
        // TODO We can't execute divergging code yet
        /*['fun q (n:int) : int = ifi(n=0, q(n-1), n);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Real(2));
            //expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType('real'), 0]);
        }]*/
    ]);
});

it("aufg2.4", () => {
    /*
fun f (x:bool) = if x then 1 else 0;
val x = 5*7;
fun g (z:int) = f(z<x)<x;
val x = g 5;
     */
    //TODO test types
    run_test([
        ['fun f (x:bool) = if x then 1 else 0;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('f')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('f')).toEqualWithType(TODO);
        }],
        ['val x = 5*7;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('x')[0]).toEqualWithType(new Val.Integer(35));
            //expect(state.getStaticValue('x')).toEqualWithType(new Type.PrimititveType('int'));
        }],
        ['fun g (z:int) = f(z<x)<x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('g')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('g')).toEqualWithType(TODO);
        }],
        ['val x = g 5;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('x')[0]).toEqualWithType(new Val.BoolValue(true));
            //expect(state.getStaticValue('x')).toEqualWithType([new Type.CustomType('bool'), 0]);
        }]
    ]);
});

it("aufg2.6", () => {
    /*
val x = 3+2;
fun f (y:int) = x+y;
fun g (y:int) : int = if y<x then 0 else y+g(y-1);
     */
    //TODO test types
    run_test([
        ['val x = 3+2;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('x')[0]).toEqualWithType(new Val.Integer(5));
            //expect(state.getStaticValue('x')).toEqualWithType(new Type.PrimititveType('int'));
        }],
        ['fun f (y:int) = x+y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('f')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('f')).toEqualWithType(TODO);
        }],
        ['fun g (y:int) : int = if y<x then 0 else y+g(y-1);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('g')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('g')).toEqualWithType(TODO);
        }]
    ]);
});

it("aufg3.6", () => {
    /*
(fn (x:int) => fn (b:bool) => if b then x else 7) (2+3);
     */
    //TODO test types
    run_test([
        ['(fn (x:int) => fn (b:bool) => if b then x else 7) (2+3);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }]
    ]);
});

it("aufg3.7", () => {
    /*
let val a = 7
    fun f (x:int) = a + x
    fun g (x:int) (y:int) : int = g (f x) y
in
    g (f 5)
end;
     */
    //TODO test types
    run_test([
        ['let val a = 7 fun f (x:int) = a + x fun g (x:int) (y:int) : int = g (f x) y in g (f 5) end;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('it')).toEqualWithType(TODO);
        }]
    ]);
});

it("aufg 3.20", () => {
    /*
fun 'a pif (x:bool, y:'a, z:'a) = if x then y else z;
     */
    //TODO test types
    run_test([
        ['fun \'a pif (x:bool, y:\'a, z:\'a) = if x then y else z;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('pif')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('pif')).toEqualWithType(TODO);
        }]
    ]);
});

it("aufg3.25", () => {
    /*
fun p f (x,y) = f x y;
fun q f g x = g (f x);
     */
    //TODO test types
    run_test([
        ['fun p f (x,y) = f x y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('p')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('p')).toEqualWithType(TODO);
        }],
        ['fun q f g x = g (f x);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('q')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('q')).toEqualWithType(TODO);
        }]
    ]);
});

it("aufg3.29", () => {
    /*
(fn x => (fn y => (fn x => y) x) y) x;
     */
    //TODO test types
    run_test([
        ['(fn x => (fn y => (fn x => y) x) y) x;', (x) => { expect(x).toThrow(Errors.ElaborationError); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
        }]
    ]);
});

it("aufg3.30", () => {
    /*
val (x, y) = (2, 3);
fun f x = fn x => #1(x,y);
val y = x*y;
fun g g = f x g;
     */
    //TODO test types
    run_test([
        ['val (x, y) = (2, 3);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('x')[0]).toEqualWithType(new Val.Integer(2));
            //expect(state.getStaticValue('x')).toEqualWithType([new Type.CustomType('int'), 0]);
            expect(state.getDynamicValue('y')[0]).toEqualWithType(new Val.Integer(3));
            //expect(state.getStaticValue('y')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['fun f x = fn x => #1(x,y);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('f')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('f')).toEqualWithType(TODO);
        }],
        ['val y = x*y;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('y')[0]).toEqualWithType(new Val.Integer(6));
            //expect(state.getStaticValue('y')).toEqualWithType([new Type.CustomType('int'), 0]);
        }],
        ['fun g g = f x g;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('g')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('g')).toEqualWithType(TODO);
        }]
    ]);
});

it("aufg3.31", () => {
    /*
fun f (x, y) = (fn z => (fn u => (fn v => u) z) y) x;
     */
    //TODO test types
    run_test([
        ['fun f (x, y) = (fn z => (fn u => (fn v => u) z) y) x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('f')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('f')).toEqualWithType(TODO);
        }]
    ]);
});

it("aufg3.33", () => {
    /*
fun andalso' x y = if x then y else false;
     */
    //TODO test types
    run_test([
        ['fun andalso\' x y = if x then y else false;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('andalso\'')).not.toEqualWithType(undefined); // TODO exact value
            //expect(state.getStaticValue('andalso\'')).toEqualWithType(TODO);
        }]
    ]);
});

it("aufg5.11", () => {
    /*
val xs = List.tabulate(5000, fn x => x);
val ys = rev xs;
     */
    //TODO test types
    run_test([
        ['val xs = List.tabulate(5000, fn x => x);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            let res = [];
            for (let i = 0; i < 5000; ++i) {
                res.push(new Val.Integer(i));
            }
            expect(state.getDynamicValue('xs')[0]).toEqualWithType(createList(res));
            //expect(state.getStaticValue('xs')).toEqualWithType(TODO);
        }],
        ['val ys = rev xs;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            let res = [];
            for (let i = 5000-1; i >= 0; --i) {
                res.push(new Val.Integer(i));
            }
            expect(state.getDynamicValue('ys')[0]).toEqualWithType(createList(res));
            //expect(state.getStaticValue('ys')).toEqualWithType(TODO);
        }]
    ]);
});

it("aufg6.10", () => {
    /*
datatype nat = O | S of nat;
     */
    //TODO test types
    run_test([
        ['datatype nat = O | S of nat;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('O')[0]).toEqualWithType(new Val.ValueConstructor('O', 0));
            //expect(state.getStaticValue('O')).toEqualWithType(TODO);
            expect(state.getDynamicValue('S')[0]).toEqualWithType(new Val.ValueConstructor('S', 1));
            //expect(state.getStaticValue('S')).toEqualWithType(TODO);
        }]
    ]);
});

it("aufg6.11", () => {
    /*
datatype integer = N of nat | P of nat;
     */
    //TODO test types
    run_test([
        ['datatype nat = O | S of nat;' +
            'datatype integer = N of nat | P of nat;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('N')[0]).toEqualWithType(new Val.ValueConstructor('N', 1));
            //expect(state.getStaticValue('N')).toEqualWithType(TODO);
            expect(state.getDynamicValue('P')[0]).toEqualWithType(new Val.ValueConstructor('P', 1));
            //expect(state.getStaticValue('P')).toEqualWithType(TODO);
        }]
    ]);
});

it("aufg7.32", () => {
    /*
datatype 'a entry = I of 'a | F of 'a;
     */
    //TODO test types
    run_test([
        ['datatype \'a entry = I of \'a | F of \'a;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('I')[0]).toEqualWithType(new Val.ValueConstructor('I', 1));
            //expect(state.getStaticValue('I')).toEqualWithType(TODO);
            expect(state.getDynamicValue('F')[0]).toEqualWithType(new Val.ValueConstructor('F', 1));
            //expect(state.getStaticValue('F')).toEqualWithType(TODO);
        }]
    ]);
});
