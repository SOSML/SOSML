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

function run_test(commands, loadStdlib: boolean = true): void {
    let oldTests = [];
    let state = API.getFirstState();
    let exception;
    let value;
    let opts = {
        'allowUnicodeInStrings': false,
        'allowSuccessorML': false,
        'disableElaboration': false,
        'disableEvaluation': false,
        'allowLongFunctionNames': false,
        'strictMode': true
    };
    for(let step of commands) {
        step[1](() => {
            let res = API.interpret(step[0], state, opts);
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

function gc(code: string, expect_error: any = undefined, expect_result: string[] = [], expect_value: any[] = [], expect_type: any[] = []): any {
    return [code, (x) => { x(); },  (state: State.State, hasThrown: boolean,
        exceptionValue: Val.Exception) => {
            let log = code + '\n';
            if (expect_error !== undefined) {
                expect(hasThrown).toEqual(true);
                expect(expect_error).toEqualWithType(exceptionValue);
            } else {
                expect(hasThrown).toEqual(false);
                expect(undefined).toEqualWithType(exceptionValue);
                for (let i = 0; i < expect_result.length; ++i) {
                    let result_val = (expect_result[i][0] === '_')
                        ? state.getDynamicType(expect_result[i].substring(1))
                        : state.getDynamicValue(expect_result[i]);
                    let result_type = (expect_result[i][0] === '_')
                        ? state.getStaticType(expect_result[i].substring(1))
                        : state.getStaticValue(expect_result[i]);

                    log += ('\nChecking ' + expect_result[i] + ':\n'
                        + 'found val: ' + result_val
                        + '\nfound type: ' + result_type + '\n');
                    if (expect_value[i] !== undefined) {
                        expect(expect_value[i]).toEqualWithType(result_val);
                    } else {
                        expect(undefined).not.toEqualWithType(result_val);
                    }
                    if (expect_type[i] !== undefined) {
                        expect(expect_type[i]).toEqualWithType(result_type);
                    } else {
                        expect(undefined).not.toEqualWithType(result_type);
                    }
                }
            }
            //            console.log(log);
        }
}

function ge(code: string, expect_error_type: any): any {
    return [code, (x) => expect(x).toThrow(expect_error_type),
        (state: State.State, hasThrown: boolean, exceptionValue: Val.Exception) => { }
}



let INT = new Type.CustomType('int');
let BOOL = new Type.CustomType('bool');
let WORD = new Type.CustomType('word');
let STRING = new Type.CustomType('string');
let CHAR = new Type.CustomType('char');
let VAR = new Type.TypeVariable('\'a');
let FREE = new Type.TypeVariable('\'~A');
let VARB = new Type.TypeVariable('\'b');

function FUNC (t1: Type.Type, t2: Type.Type): Type.Type {
    return new Type.FunctionType(t1, t2);
}
function BND (t: Type.Type): Type.Type {
    return new Type.TypeVariableBind('\'a', t);
}
function BNDB (t: Type.Type): Type.Type {
    return new Type.TypeVariableBind('\'b', t);
}
function FBND (t: Type.Type): Type.Type {
    let res = new Type.TypeVariableBind('\'~A', t);
    res.isFree = true;
    return res;
}
function PAIR (t1: Type.Type, t2: Type.Type): Type.Type {
    return new Type.TupleType([t1, t2]).simplify();
}

let MATCH = new Val.ExceptionConstructor('Match', 0, 0, 0);
let BIND = new Val.ExceptionConstructor('Bind', 0, 0, 1);
let DIV = new Val.ExceptionConstructor('Div', 0, 0, 2);
let OVERFLOW = new Val.ExceptionConstructor('Overflow', 0, 0, 3);

function TI (t: string, cons: string[], arity: number, allowsEquality: boolean = true) {
    return new State.TypeInformation(new Type.CustomType(t, [], -1), cons, arity, allowsEquality);
}

// Here be Tooru

it("recursive val", () => {
    run_test([
        gc('fun f x = x - 1;', undefined, ['f'], [undefined], [[FUNC(INT, INT), 0]]),
        gc('val f = fn x => x and rec g = fn x => f x;', undefined, ['f', 'g'], [undefined, undefined], [[BND(FUNC(VAR,VAR)), 0], [FUNC(INT,INT), 0]])
    ]);
    run_test([
        gc('fun f x = x;', undefined, ['f'], [undefined], [[BND(FUNC(VAR,VAR)), 0]]),
        gc('val f = fn 0 => 1 | x => 2 * f (x-1);', undefined, ['f'], [undefined], [[FUNC(INT,INT),0]]),
        gc('f 3;', undefined, ['it'], [[new Val.Integer(4), 0]], [[INT, 0]])
    ]);
    run_test([
        gc('fun f x = x;', undefined, ['f'], [undefined], [[BND(FUNC(VAR,VAR)), 0]]),
        gc('val f = fn (0, 0) => 1 | (x, _) => 2 * f (x-1);', undefined, ['f'], [undefined], [[FUNC(PAIR(INT,INT),INT),0]]),
        gc('f (3, 5);', undefined, ['it'], [[new Val.Integer(4), 0]], [[INT, 0]])
    ]);
});

it("constructor redefinition", () => {
    run_test([
        gc('datatype x = f of int;', undefined, ['_x', 'f'], [['f', undefined], [new Val.ValueConstructor('f', 1), 1 ]], [TI('x', ['f'], 0, true), [FUNC(INT, new Type.CustomType('x')), 1]]),
        gc('fun f x = 3;', undefined, ['f'], [undefined], [[BND(FUNC(VAR, INT)), 0]])
    ]);
    run_test([ge('datatype x = f of iaeiae;', Errors.ElaborationError)]);
    run_test([
        gc('datatype tree = Z | T of tree * tree ;', undefined, ['_tree', 'Z', 'T'],
            [['Z', 'T'], [new Val.ValueConstructor('Z',0),1],[new Val.ValueConstructor('T',1),1]],
            [TI('tree', ['Z', 'T'], 0, true), [new Type.CustomType('tree'), 1],
                [FUNC(PAIR(new Type.CustomType('tree'),new Type.CustomType('tree')),
                    new Type.CustomType('tree')), 1]]),
        gc("datatype 'a tree = Z of 'a | T of 'a * 'a tree * 'a tree ;", undefined,
            ['_tree', 'Z', 'T'], [['Z', 'T'], [new Val.ValueConstructor('Z',1, 1),1],
                [new Val.ValueConstructor('T',1, 1),1]],
            [new State.TypeInformation(new Type.CustomType('tree',[new Type.TypeVariable('\'a', 9)],
                -1, undefined, false, 1), ['Z', 'T'], 1, true),
                [BND(FUNC(VAR, new Type.CustomType('tree',[VAR],0,undefined,false,1))),1],
                [BND(FUNC(new Type.TupleType([VAR,new Type.CustomType('tree',[VAR],0,
                    undefined,false,1),
                new Type.CustomType('tree',[VAR],0,undefined,false,1)]).simplify(),
                    new Type.CustomType('tree',[VAR],0,undefined,false,1))), 1]]),
    ]);
});

it("Duplicate tyvar", () => {
    run_test([ge("val ('a, 'a) x = 5;", Errors.ElaborationError)]);
    run_test([ge("datatype ('a, 'a) FAIL = A;", Errors.ElaborationError)]);
});

it("Non-linear pattern", () => {
    run_test([ge('val (x,x) = (1, 2);', Errors.ParserError)]);
    run_test([ge('val [x,x] = [1, 2];', Errors.ParserError)]);
    run_test([ge('fun test (x,x) = true | test _ = false;', Errors.ParserError)]);
    run_test([ge('fun test x x = true | test _ = false;', Errors.ParserError)]);
});

it("Operator redefinition", () => {
    run_test([
        gc('fun a*b=3;', undefined, ['*'], [undefined], [[BND(BNDB(FUNC(PAIR(VAR,VARB), INT))),0]]),
        gc('4 * 5;', undefined, ['it'], [[new Val.Integer(3), 0]], [[INT, 0]])
    ]);
    run_test([
        gc('fun (a*b) 3=3;', undefined, ['*'], [undefined], [[BND(BNDB(FUNC(PAIR(VAR,VARB), FUNC(INT,INT)))),0]]),
        gc('(4 * 5) 3;', undefined, ['it'], [[new Val.Integer(3), 0]], [[INT, 0]])
    ]);
    run_test([
        gc('fun(a*b)=3;',undefined, ['*'], [undefined], [[BND(BNDB(FUNC(PAIR(VAR,VARB), INT))),0]]),
        gc('4 * 5;', undefined, ['it'], [[new Val.Integer(3), 0]], [[INT, 0]])
    ]);
    run_test([
        gc('fun a+b=3;', undefined, ['+'], [undefined], [[BND(BNDB(FUNC(PAIR(VAR,VARB), INT))),0]]),
        gc('4 + 5;', undefined, ['it'], [[new Val.Integer(3), 0]], [[INT, 0]])
    ]);
    run_test([
        gc('fun a-b=3;', undefined, ['-'], [undefined], [[BND(BNDB(FUNC(PAIR(VAR,VARB), INT))),0]]),
        gc('4 - 5;', undefined, ['it'], [[new Val.Integer(3), 0]], [[INT, 0]])
    ]);
    run_test([
        gc('fun a o b=3;',undefined,['o'], [undefined], [[BND(BNDB(FUNC(PAIR(VAR,VARB), INT))),0]]),
        gc('4 o 5;', undefined, ['it'], [[new Val.Integer(3), 0]], [[INT, 0]])
    ]);
    run_test([
        gc('fun (a o b)=3;',undefined,['o'],[undefined],[[BND(BNDB(FUNC(PAIR(VAR,VARB), INT))),0]]),
        gc('4 o 5;', undefined, ['it'], [[new Val.Integer(3), 0]], [[INT, 0]])
    ]);
    run_test([ge('fun a = b = 3;', Errors.ParserError)]);
    run_test([ge('fun (a = b) = 3;', Errors.FeatureDisabledError)]);
    run_test([
        gc('fun ! x = 5;', undefined, ['!'], [undefined], [[BND(FUNC(VAR, INT)), 0]]),
        gc('! 10;', undefined, ['it'], [[new Val.Integer(5), 0]], [[INT, 0]])
    ]);
    run_test([
        gc('fun (! x) = 5;', undefined, ['!'], [undefined], [[BND(FUNC(VAR, INT)), 0]]),
        gc('! 10;', undefined, ['it'], [[new Val.Integer(5), 0]], [[INT, 0]])
    ]);
});

it("Free type variables", () => {
    run_test([
        gc("val r: 'a option ref = ref NONE;", undefined, ['r'], [[new Val.ReferenceValue(0), 0]], [[FBND(new Type.CustomType('ref', [new Type.CustomType('option', [FREE])])), 0]]),
        gc("val r1: string option ref = r;", undefined, ['r1'], [[new Val.ReferenceValue(0), 0]], [[new Type.CustomType('ref', [new Type.CustomType('option', [STRING])]), 0]]),
        ge("val r2: int option ref = r;", Errors.ElaborationError)
    ]);
});

it("let expressions", () => {
    run_test([
        gc('(fn (x:bool) => let val x = 8 in x end) true;', undefined, ['it'], [[new Val.Integer(8), 0]], [[INT, 0]])
    ]);
    run_test([
        gc('fun t x = let datatype L = B; val l = case B of _ => true in l end;', undefined,
            ['t'], [undefined], [[BND(FUNC(VAR,BOOL)), 0]])
    ]);
});

it("datatypes", () => {
    run_test([
        gc('datatype ty1 = at1 | con1 of ty2 and ty2 = at2 | con2 of ty1;', undefined,
            ['_ty1', 'at1', 'con1', '_ty2', 'at2', 'con2'],
        [['at1','con1'],[new Val.ValueConstructor('at1',0),1],
            [new Val.ValueConstructor('con1',1),1],['at2','con2'],
            [new Val.ValueConstructor('at2',0),1],[new Val.ValueConstructor('con2',1),1]],
            [TI('ty1', ['at1', 'con1'], 0, true), [new Type.CustomType('ty1'), 1],
                [FUNC(new Type.CustomType('ty2'), new Type.CustomType('ty1')), 1],
                TI('ty2', ['at2', 'con2'], 0, true), [new Type.CustomType('ty2'), 1],
                [FUNC(new Type.CustomType('ty1'), new Type.CustomType('ty2')), 1]]),
        gc('con1 (con2 at1);', undefined, ['it'], [[new Val.ConstructedValue('con1',
            new Val.ConstructedValue('con2',new Val.ConstructedValue('at1'))),0]],
            [[new Type.CustomType('ty1'), 0]])
    ]);
});

