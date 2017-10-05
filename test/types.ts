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
        step[1](() => {
            let res = API.interpret(step[0], state);
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

it("basic", () => {
    run_test([
        ['42;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType("int"), 0]);
        }]
    ]);
    run_test([
        ['42.0;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType("real"), 0]);
        }]
    ]);
    run_test([
        ['#"1";', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType("char"), 0]);
        }]
    ]);
    run_test([
        ['"1";', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType("string"), 0]);
        }]
    ]);
    run_test([
        ['"13";', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType("string"), 0]);
        }]
    ]);
    run_test([
        ['[1];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType("list", [new Type.CustomType("int")]), 0]);
        }]
    ]);
    run_test([
        ['[1.0];', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType("list", [new Type.CustomType("real")]), 0]);
        }],
        ['fun f true = false | f false = true;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('f')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('bool', [], 0),
                    new Type.CustomType('bool', [], 0)
                )
            , 0]);
        }],
        ['fun f true = false;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('f')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('bool', [], 0),
                    new Type.CustomType('bool', [], 0)
                )
            , 0]);
            //TODO test non-exaustive warning
        }],
        ['op+;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.FunctionType(
                    new Type.RecordType(new Map([
                        ['1', new Type.CustomType('int', [], 0)],
                        ['2', new Type.CustomType('int', [], 0)]
                    ])),
                    new Type.CustomType('int', [], 0)
                )
            , 0]);
        }],
        ['op+(1,2);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.CustomType('int', [], 0)
            , 0]);
        }],
        ['op+(1.0,2.0);', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.CustomType('real', [], 0)
            , 0]);
        }],
    ]);
    run_test([
        ['[1, 1.0];', (x) => { expect(x).toThrow(Errors.ElaborationError); },
        (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
        }],
    ]);

    run_test([
        ['["1", #"1"];', (x) => { expect(x).toThrow(Errors.ElaborationError); },
        (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
        }],
    ]);
});

it("basic with annotation", () => {
    run_test([
        ['42:int;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType("int"), 0]);
        }]
    ]);
    run_test([
        ['42:real;', (x) => { expect(x).toThrow(Errors.ElaborationError); },
        (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
        }],
    ]);
    run_test([
        ['42.0:real;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType("real"), 0]);
        }],
        
    ]);
    run_test([
        ['42.0:int;', (x) => { expect(x).toThrow(Errors.ElaborationError); },
        (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
        }],
    ]);
    run_test([
        ['#"1":char;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType("char"), 0]);
        }]
    ]);
    run_test([
        ['#"4":string;', (x) => { expect(x).toThrow(Errors.ElaborationError); },
        (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
        }],
    ]);
    run_test([
        ['"1":string;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType("string"), 0]);
        }]
    ]);
    run_test([
        ['"4":char;', (x) => { expect(x).toThrow(Errors.ElaborationError); },
        (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
        }],
    ]);
    run_test([
        ['"13":string;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType("string"), 0]);
        }]
    ]);
    run_test([
        ['[1]:int list;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType("list", [new Type.CustomType("int")]), 0]);
        }]
    ]);
    run_test([
        ['[1]:real list;', (x) => { expect(x).toThrow(Errors.ElaborationError); },
        (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
        }],
    ]);
    run_test([
        ['[1.0]:real list;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType("list", [new Type.CustomType("real")]), 0]);
        }]
    ]);
    run_test([
        ['[1.0]:int list;', (x) => { expect(x).toThrow(Errors.ElaborationError); },
        (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
        }],
    ]);
    run_test([
        ['[1, 1.0];', (x) => { expect(x).toThrow(Errors.ElaborationError); },
        (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
        }],
    ]);

    run_test([
        ['["1", #"1"];', (x) => { expect(x).toThrow(Errors.ElaborationError); },
        (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
        }],
    ]);
});

/*
import {
    FunctionType, CustomType, CustomTypes, RecordType, TupleType, Type, TypeUnificationError,
    TypeVariable
} from '../src/types';
import { State } from '../src/state';

const diff = require('jest-diff');
const chalk = require('chalk');

const NO_DIFF_MESSAGE = chalk.dim(
    'Compared values have no visual difference.',
);

expect.extend({
    toEqualWithType(received, expected) {
        // we assume that diff prints the types as well, so if there is no diff, we assume that recieved == expected
        const diffString = diff(expected, received, {
            expand: this.expand,
        });

        const pass = diffString == NO_DIFF_MESSAGE;

        const message = pass
            ? () => this.utils.matcherHint('.not.toEqualWithType') + '\n\n' +
            `Expected value to not equal with type:\n` +
            `  ${this.utils.printExpected(expected)}\n` +
            `Received:\n` +
            `  ${this.utils.printReceived(received)}`
            : () => {
                return this.utils.matcherHint('.toEqualWithType') + '\n\n' +
                    `Expected value to equal with type:\n` +
                    `  ${this.utils.printExpected(expected)}\n` +
                    `Received:\n` +
                    `  ${this.utils.printReceived(received)}` +
                    (diffString ? `\n\nDifference:\n\n${diffString}` : '');
            };

        return {actual: received, message, pass};
    },
});

let state: State = undefined as State; // TODO

function check(a: Type, b: Type, result: Type): void {
    // unify is symmetrical
    expect(a.unify(b, state)).toEqualWithType(result);
    expect(b.unify(a, state)).toEqualWithType(result);

    // unify is reflexive
    expect(a.unify(a, state)).toEqualWithType(a);
    expect(b.unify(b, state)).toEqualWithType(b);

    if (b !== result) {
        check(a, result, result);
        check(b, result, result);
    }
}

function checkThrow(a: Type, b: Type): void {
    expect(() => { a.unify(b, state); }).toThrow(TypeUnificationError);
    expect(() => { b.unify(a, state); }).toThrow(TypeUnificationError);
}

it("very basic test", () => {

    let int = new CustomType(CustomTypes.int);
    let bool = new CustomType(CustomTypes.bool);
    let a = new TypeVariable("'a", false);
    let b = new TypeVariable("'b", false);
    let int_int = new FunctionType(int, int);
    let empty_record = new RecordType(new Map<string, Type>(), true);
    let incomplete_record = new RecordType(new Map<string, Type>(), false);
    let int_record = new TupleType([int, int]).simplify();
    let a_a = new FunctionType(a, a);
    let int_bool = new FunctionType(int, bool);

    check(int, a, int);
    check(int_int, a, int_int);
    check(incomplete_record, empty_record, empty_record);
    check(a_a, int_int, int_int);

    checkThrow(int_bool, a_a);
});
*/
