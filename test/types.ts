import * as Errors from '../src/errors';
import * as API from '../src/main';
import * as State from '../src/state';
import * as InitialState from '../src/initialState';
import * as Type from '../src/types';
import * as Val from '../src/values';

import * as TestHelper from './test_helper';
TestHelper.init();

function run_test(commands: any[]): void {
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
        ['42;', (x: any) => { x(); },  (state : State.State, hasThrown : boolean, exceptionValue : Val.ExceptionValue) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType("int"), 0]);
        }]
    ]);
    run_test([
        ['42.0;', (x: any) => { x(); },  (state : State.State, hasThrown : boolean, exceptionValue : Val.ExceptionValue) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType("real"), 0]);
        }]
    ]);
    run_test([
        ['#"1";', (x: any) => { x(); },  (state : State.State, hasThrown : boolean, exceptionValue : Val.ExceptionValue) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType("char"), 0]);
        }]
    ]);
    run_test([
        ['"1";', (x: any) => { x(); },  (state : State.State, hasThrown : boolean, exceptionValue : Val.ExceptionValue) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType("string"), 0]);
        }]
    ]);
    run_test([
        ['"13";', (x: any) => { x(); },  (state : State.State, hasThrown : boolean, exceptionValue : Val.ExceptionValue) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType("string"), 0]);
        }]
    ]);
    run_test([
        ['[1];', (x: any) => { x(); },  (state : State.State, hasThrown : boolean, exceptionValue : Val.ExceptionValue) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType("list", [new Type.CustomType("int")]), 0]);
        }]
    ]);
    run_test([
        ['[1.0];', (x: any) => { x(); },  (state : State.State, hasThrown : boolean, exceptionValue : Val.ExceptionValue) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType("list", [new Type.CustomType("real")]), 0]);
        }],
        ['fun f true = false | f false = true;', (x: any) => { x(); },  (state : State.State, hasThrown : boolean, exceptionValue : Val.ExceptionValue) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('f')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('bool', []),
                    new Type.CustomType('bool', [])
                )
            , 0]);
        }],
        ['fun f true = false;', (x: any) => { x(); },  (state : State.State, hasThrown : boolean, exceptionValue : Val.ExceptionValue) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('f')).toEqualWithType([
                new Type.FunctionType(
                    new Type.CustomType('bool', []),
                    new Type.CustomType('bool', [])
                )
            , 0]);
            //TODO test non-exaustive warning
        }],
        ['op+;', (x: any) => { x(); },  (state : State.State, hasThrown : boolean, exceptionValue : Val.ExceptionValue) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.FunctionType(
                    new Type.RecordType(new Map([
                        ['1', new Type.CustomType('int', [])],
                        ['2', new Type.CustomType('int', [])]
                    ])),
                    new Type.CustomType('int', [])
                )
            , 0]);
        }],
        ['op+(1,2);', (x: any) => { x(); },  (state : State.State, hasThrown : boolean, exceptionValue : Val.ExceptionValue) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.CustomType('int', [])
            , 0]);
        }],
        ['op+(1.0,2.0);', (x: any) => { x(); },  (state : State.State, hasThrown : boolean, exceptionValue : Val.ExceptionValue) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('it')).toEqualWithType([
                new Type.CustomType('real', [])
            , 0]);
        }],
    ]);
    run_test([
        ['[1, 1.0];', (x: any) => { expect(x).toThrow(Errors.ElaborationError); },
        (state : State.State, hasThrown : boolean, exceptionValue : Val.ExceptionValue) => {
        }],
    ]);

    run_test([
        ['["1", #"1"];', (x: any) => { expect(x).toThrow(Errors.ElaborationError); },
        (state : State.State, hasThrown : boolean, exceptionValue : Val.ExceptionValue) => {
        }],
    ]);
});

it("basic with annotation", () => {
    run_test([
        ['42:int;', (x: any) => { x(); },  (state : State.State, hasThrown : boolean, exceptionValue : Val.ExceptionValue) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType("int"), 0]);
        }]
    ]);
    run_test([
        ['42:real;', (x: any) => { expect(x).toThrow(Errors.ElaborationError); },
        (state : State.State, hasThrown : boolean, exceptionValue : Val.ExceptionValue) => {
        }],
    ]);
    run_test([
        ['42.0:real;', (x: any) => { x(); },  (state : State.State, hasThrown : boolean, exceptionValue : Val.ExceptionValue) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType("real"), 0]);
        }],

    ]);
    run_test([
        ['42.0:int;', (x: any) => { expect(x).toThrow(Errors.ElaborationError); },
        (state : State.State, hasThrown : boolean, exceptionValue : Val.ExceptionValue) => {
        }],
    ]);
    run_test([
        ['#"1":char;', (x: any) => { x(); },  (state : State.State, hasThrown : boolean, exceptionValue : Val.ExceptionValue) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType("char"), 0]);
        }]
    ]);
    run_test([
        ['#"4":string;', (x: any) => { expect(x).toThrow(Errors.ElaborationError); },
        (state : State.State, hasThrown : boolean, exceptionValue : Val.ExceptionValue) => {
        }],
    ]);
    run_test([
        ['"1":string;', (x: any) => { x(); },  (state : State.State, hasThrown : boolean, exceptionValue : Val.ExceptionValue) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType("string"), 0]);
        }]
    ]);
    run_test([
        ['"4":char;', (x: any) => { expect(x).toThrow(Errors.ElaborationError); },
        (state : State.State, hasThrown : boolean, exceptionValue : Val.ExceptionValue) => {
        }],
    ]);
    run_test([
        ['"13":string;', (x: any) => { x(); },  (state : State.State, hasThrown : boolean, exceptionValue : Val.ExceptionValue) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType("string"), 0]);
        }]
    ]);
    run_test([
        ['[1]:int list;', (x: any) => { x(); },  (state : State.State, hasThrown : boolean, exceptionValue : Val.ExceptionValue) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType("list", [new Type.CustomType("int")]), 0]);
        }]
    ]);
    run_test([
        ['[1]:real list;', (x: any) => { expect(x).toThrow(Errors.ElaborationError); },
        (state : State.State, hasThrown : boolean, exceptionValue : Val.ExceptionValue) => {
        }],
    ]);
    run_test([
        ['[1.0]:real list;', (x: any) => { x(); },  (state : State.State, hasThrown : boolean, exceptionValue : Val.ExceptionValue) => {
            expect(hasThrown).toEqual(false);
            expect(state.getStaticValue('it')).toEqualWithType([new Type.CustomType("list", [new Type.CustomType("real")]), 0]);
        }]
    ]);
    run_test([
        ['[1.0]:int list;', (x: any) => { expect(x).toThrow(Errors.ElaborationError); },
        (state : State.State, hasThrown : boolean, exceptionValue : Val.ExceptionValue) => {
        }],
    ]);
    run_test([
        ['[1, 1.0];', (x: any) => { expect(x).toThrow(Errors.ElaborationError); },
        (state : State.State, hasThrown : boolean, exceptionValue : Val.ExceptionValue) => {
        }],
    ]);

    run_test([
        ['["1", #"1"];', (x: any) => { expect(x).toThrow(Errors.ElaborationError); },
        (state : State.State, hasThrown : boolean, exceptionValue : Val.ExceptionValue) => {
        }],
    ]);
});
