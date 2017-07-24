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

it("basic", () => {
    run_test([
        ['42;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(42));
        }]
    ]);
    run_test([
        ['fun f x = 42;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
        }],
        ['f 10;', (x) => { x(); }, (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(42));
        }]
    ]);
});

it("exp", () => {
    run_test([
        ['42; 10.0;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Real(10));
        }],
        ['val it = 42;', (x) => { x(); }, (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType(new Val.Integer(42));
        }]
    ]);
});

it("match", () => {
});

it("dec", () => {
});

it("pattern", () => {
});

it("datatype", () => {
});

it("exception shadowing", () => {
    run_test([
        ['exception Match;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
        }],
        ['(case 2 of 1 => true) handle Match => false;', (x) => { x(); }, (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(true);
            expect(exceptionValue).toEqualWithType(new Val.ExceptionValue('Match'));
        }]
    ]);
});
