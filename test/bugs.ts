import * as Errors from '../src/errors';

import * as API from '../src/main';

import * as State from '../src/state';
import * as Type from '../src/types';
import * as Val from '../src/values';

import * as TestHelper from './test_helper';
TestHelper.init();

function run_test(commands: any, loadStdlib: boolean = true): void {
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
    return [code, (x: any) => { x(); },  (state: State.State, hasThrown: boolean,
        exceptionValue: Val.ExceptionValue) => {
            // let log = code + '\n';
            if (expect_error !== undefined) {
                expect(hasThrown).toEqual(true);
                expect(exceptionValue).toEqualWithType(expect_error);
            } else {
                expect(hasThrown).toEqual(false);
                expect(exceptionValue).toEqualWithType(undefined);
                for (let i = 0; i < expect_result.length; ++i) {
                    let result_val = (expect_result[i][0] === '_')
                        ? state.getDynamicType(expect_result[i].substring(1))
                        : state.getDynamicValue(expect_result[i]);
                    let result_type = (expect_result[i][0] === '_')
                        ? state.getStaticType(expect_result[i].substring(1))
                        : state.getStaticValue(expect_result[i]);

                   // log += ('\nChecking ' + expect_result[i] + ':\n'
                   //     + 'found val: ' + result_val
                   //     + '\nfound type: ' + result_type + '\n');
                    if (expect_value[i] !== undefined) {
                        expect(result_val).toEqualWithType(expect_value[i]);
                    } else {
                        expect(result_val).not.toEqualWithType(undefined);
                    }
                    if (expect_type[i] !== undefined) {
                        expect(result_type).toEqualWithType(expect_type[i]);
                    } else {
                        expect(result_type).not.toEqualWithType(undefined);
                    }
                }
            }
            //            console.log(log);
        }];
}

function ge(code: string, expect_error_type: any): any {
    return [code, (x: any) => expect(x).toThrow(expect_error_type),
        (state: State.State, hasThrown: boolean, exceptionValue: Val.ExceptionValue) => { }
    ];
}



let UNIT = new Type.TupleType([]).simplify();
let INT = new Type.CustomType('int');
let REAL = new Type.CustomType('real');
let BOOL = new Type.CustomType('bool');
// let WORD = new Type.CustomType('word');
let STRING = new Type.CustomType('string');
// let CHAR = new Type.CustomType('char');
let EXN = new Type.CustomType('exn');
let VAR = new Type.TypeVariable('\'a');
let EQVAR = new Type.TypeVariable('\'\'a');
let FREE = new Type.TypeVariable('\'~A');
let FREE2 = new Type.TypeVariable('\'~A');
FREE2.isFree = true;
let VARB = new Type.TypeVariable('\'b');

function LIST (t: Type.Type): Type.Type {
    return new Type.CustomType('list', [t]);
}
function FUNC (t1: Type.Type, t2: Type.Type): Type.Type {
    return new Type.FunctionType(t1, t2);
}
function BND (t: Type.Type): Type.Type {
    return new Type.TypeVariableBind('\'a', t);
}
function EQBND (t: Type.Type): Type.Type {
    return new Type.TypeVariableBind('\'\'a', t);
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

// let MATCH = new Val.ExceptionValue('Match', undefined, 0, 0);
// let BIND = new Val.ExceptionValue('Bind', undefined, 0, 1);
// let DIV = new Val.ExceptionValue('Div', undefined, 0, 2);
let OVERFLOW = new Val.ExceptionValue('Overflow', undefined, 0, 3);

function TI (t: string, cons: string[], arity: number, allowsEquality: boolean = true) {
    return new State.TypeInformation(new Type.CustomType(t, []), cons, arity, allowsEquality);
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
            [new State.TypeInformation(new Type.CustomType('tree',[new Type.TypeVariable('\'a')],
                undefined, false, 1), ['Z', 'T'], 1, true),
                [BND(FUNC(VAR, new Type.CustomType('tree',[VAR],undefined,false,1))),1],
                [BND(FUNC(new Type.TupleType([VAR,new Type.CustomType('tree',[VAR],
                    undefined,false,1),
                new Type.CustomType('tree',[VAR],undefined,false,1)]).simplify(),
                    new Type.CustomType('tree',[VAR],undefined,false,1))), 1]]),
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
    run_test([ge('case (3, 4) of (x, x) => x;', Errors.ParserError)]);

    run_test([
        gc(`datatype nat = O | S of nat
        fun less O O = false | less (S m) O = false
        | less O (S n) = true | less (S m) (S n) = less(m)(n);`, undefined,
            ['_nat', 'O', 'S', 'less'],
            [['O', 'S'], [new Val.ValueConstructor('O'),1], [new Val.ValueConstructor('S', 1), 1],
                undefined], [TI('nat', ['O', 'S'], 0, true),
                [new Type.CustomType('nat'),1], [FUNC(new Type.CustomType('nat'),
                new Type.CustomType('nat')),1], [FUNC(new Type.CustomType('nat'),
                    FUNC(new Type.CustomType('nat'), BOOL)), 0]]),
        gc('fun f O O = 5;', undefined, ['f'], [undefined], [[FUNC(new Type.CustomType('nat'),
            FUNC(new Type.CustomType('nat'),INT)), 0]])
    ]);
    run_test([
        gc(`datatype nat = O | S of nat
        fun less O O = false | less (S m) O = false
        | less O (S n) = true | less (S m) (S n) = less(m)(n); fun f O O = 5;`, undefined,
            ['_nat', 'O', 'S', 'less', 'f'],
            [['O', 'S'], [new Val.ValueConstructor('O'),1], [new Val.ValueConstructor('S', 1), 1],
                undefined, undefined], [TI('nat', ['O', 'S'], 0, true),
                [new Type.CustomType('nat'),1], [FUNC(new Type.CustomType('nat'),
                new Type.CustomType('nat')),1], [FUNC(new Type.CustomType('nat'),
                    FUNC(new Type.CustomType('nat'), BOOL)), 0],
                [FUNC(new Type.CustomType('nat'), FUNC(new Type.CustomType('nat'),INT)), 0]])
    ]);

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
    run_test([
        gc('fun (a o b) 3=3;',undefined,['o'],[undefined],[[BND(BNDB(FUNC(PAIR(VAR,VARB), FUNC(INT, INT)))),0]]),
        gc('(4 o 5) 3;', undefined, ['it'], [[new Val.Integer(3), 0]], [[INT, 0]])
    ]);
    run_test([
        gc('fun (a o b) 3=3;',undefined,['o'],[undefined],[[BND(BNDB(FUNC(PAIR(VAR,VARB), FUNC(INT, INT)))),0]]),
        ge('4 o 5 3;', Errors.ElaborationError)
    ]);
    run_test([ge('fun (a o b 4) = 3;', Errors.ElaborationError)]);
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
    run_test([
        gc('fun pisort compare = let fun insert (x, nil) = [x] | insert (x, y::yr) = case compare(x,y) of GREATER => y::insert(x,yr) | _ => x::y::yr in foldl insert nil end;', undefined,
            ['pisort'], [undefined], [[BND(FUNC(FUNC(PAIR(VAR,VAR), new Type.CustomType('order')),
                FUNC(new Type.CustomType('list', [VAR]),
                new Type.CustomType('list', [VAR])))),0]])
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

it("real equality", () => {
    run_test([
        ge('val 3.00 = 3.0;', Errors.ParserError)
    ]);
    run_test([
        gc('datatype D = E of real;', undefined, ['_D', 'E'],
            [['E', undefined], [new Val.ValueConstructor('E',1),1],
            [TI('D', ['E'], 1, false), 1], [new Val.ValueConstructor('E',1),1]]),
        ge('E 5.0 = E 4.0;', Errors.ElaborationError)
    ]);
    run_test([
        gc('SOME 2 = SOME 5;', undefined, ['it'], [[new Val.BoolValue(false), 0]], [[BOOL, 0]])
    ]);
    run_test([
        gc('datatype D = D of int * real;', undefined, ['_D', 'D'],
            [['D', undefined], [new Val.ValueConstructor('D', 1), 1]],
            [TI('D', ['D'], 0, true), [FUNC(PAIR(INT, REAL), new
                Type.CustomType('D')), 1]]),
        ge('D (1, 3.5) = D (2, 3.5);', Errors.ElaborationError)
    ]);
    run_test([
        gc('datatype tree = T of tree list;', undefined, ['_tree', 'T'],
            [['T', undefined], [new Val.ValueConstructor('T', 1), 1]],
            [TI('tree', ['T'], 0, true), [FUNC(new Type.CustomType('list',
                [new Type.CustomType('tree')]), new Type.CustomType('tree')), 1]]),
        gc('T [] = T [];', undefined, ['it'], [[new Val.BoolValue(true), 0]], [[BOOL, 0]])
    ]);
});

it("unresolved records", () => {
    run_test([
        ge('fn x => #1 x;', Errors.ElaborationError)
    ]);
    run_test([
        ge('fun unzip1 xs = map #1;', Errors.ElaborationError)
    ]);
    run_test([
        gc('fn (x : (int * int)) => #1 x;', undefined, ['it'], [undefined],
            [[FUNC(PAIR(INT,INT), INT), 0]])
    ]);
    run_test([
        gc('val g: (int * int -> int) = #1;', undefined, ['g'], [undefined],
            [[FUNC(PAIR(INT,INT), INT), 0]])
    ]);
    run_test([
        ge('val g: int*int->int = #3;', Errors.ElaborationError)
    ]);
});

it("let expression circularity", () => {
    run_test([
        gc('let fun foo f = cas (fn(a,b)=>a+b)   and cas f a b = f(a,b) in foo end;',
            undefined, ['it'], [undefined], [[FBND(FUNC(FREE, FUNC(INT, FUNC(INT, INT)))), 0]])
    ]);
});

it("let expression polymorphism", () => {
    run_test([
        gc('val (a, b) = let val x = fn y => y in (x 5, x 9.0) end;', undefined,
            ['a', 'b'], [[new Val.Integer(5), 0], [new Val.Real(9.0), 0]],
            [[INT, 0], [REAL, 0]])
    ]);
    run_test([
        ge('fun pisort compare = let fun insert (x, y::yr) = case compare(x,y) of GREATER => x::y::yr in (insert(3,[3]); insert("x", ["x"])) end;', Errors.ElaborationError)
    ]);
    run_test([
        gc('(fn (x:bool) => let val x = [] in (3::x, "x"::x) end);', undefined,
            ['it'], [undefined],
            [[FUNC(BOOL, PAIR(LIST(INT), LIST(STRING))), 0]])
    ]);
    run_test([
        ge('(fn x => let val y = x in (3::y, "x"::y) end);', Errors.ElaborationError)
    ]);
    run_test([
        gc('(fn (x:bool) => let val x = 8 in x end) true;', undefined,
           ['it'], [[new Val.Integer(8), 0]], [[INT, 0]])
    ]);
});

it("let expressions records", () => {
    run_test([
        gc('fun f a = let val x = #2 a val (c,d) = a in 42 end;', undefined,
            ['f'], [undefined], [[BND(BNDB(FUNC(PAIR(VAR,VARB), INT))), 0]]),
        ge('f (1, 2, 3);', Errors.ElaborationError)
    ]);
    run_test([
        gc('fun f a = let val x = #2 a; val (c,d) = (fn () => a)() in a end;', undefined,
            ['f'], [undefined], [[BND(BNDB(FUNC(PAIR(VAR,VARB), PAIR(VAR,VARB)))), 0]])
    ]);
    run_test([
        gc('fun f a = let val x = #2 a; val (c,d) = a in a end;', undefined,
            ['f'], [undefined], [[BND(BNDB(FUNC(PAIR(VAR,VARB), PAIR(VAR,VARB)))), 0]])
    ]);
    run_test([
        gc('fun f a = let val {2=x, ...} = a; val (c,d) = a in a end;', undefined,
            ['f'], [undefined], [[BND(BNDB(FUNC(PAIR(VAR,VARB), PAIR(VAR,VARB)))), 0]])
    ]);
    run_test([
        gc('fun f a = let val (c,d) = a; val x = #2 a in a end;', undefined,
            ['f'], [undefined], [[BND(BNDB(FUNC(PAIR(VAR,VARB), PAIR(VAR,VARB)))), 0]])
    ]);
    run_test([
        ge('fun f a = let val b = #1 a + 1; fun c a = a / 1.0; in a end;', Errors.ElaborationError)
    ]);
    run_test([
        ge('fun f a = let val {3=x, ...} = a; val (c::cs,d) = a in cs end;',
           Errors.ElaborationError)
    ]);
    run_test([
        ge('fun f a = let val (c::cs,d) = a val {3=x, ...} = a in cs end;', Errors.ElaborationError)
    ]);
    run_test([
        ge('fun f a = let val {2=x, ...} = a; val {1=y,...} = a in a end;', Errors.ElaborationError)
    ]);
    run_test([
        ge('fun f a = let val {1=x, ...} = a; val {2=y,...} = a in a end;', Errors.ElaborationError)
    ]);
    run_test([
        ge('fun f a = let val {2=x, ...} = a in a end;', Errors.ElaborationError)
    ]);
});

it("polymorphic exceptions", () => {
    run_test([
        gc("val findDouble = fn (x: 'a) => ((let exception Double of 'a in Double end));",
            undefined, ['findDouble'], [undefined],
            [[BND(FUNC(VAR, FUNC(VAR, new Type.CustomType('exn')))), 0]])
    ]);
    run_test([
        gc('fun f x = let fun f (y:\'a) = y in let exception C of \'a; in  (raise C x) handle C a => a end end;',
            undefined, ['f'], [undefined], [[BND(FUNC(VAR, VAR)), 0]])
    ]);
    run_test([
        gc("val findDouble = fn x => ((let exception Double of 'a in Double end));",
            undefined, ['findDouble'], [undefined],
            [[BND(FBND(FUNC(VAR, FUNC(FREE2, new Type.CustomType('exn'))))), 0]])
    ]);
});

it("assign to record", () => {
    run_test([
        ge('val {3: int} = 3;', Errors.ParserError)
    ]);
});

it("nameless function", () => {
    run_test([
        ge('fun f = fn fish => case (fish) of (x) => 1;', Errors.ParserError)
    ]);
});

it("qualified exception names", () => {
    run_test([
        gc('structure S = struct exception SExc fun raiseExc v = raise SExc end;', undefined),
        gc('val v = S.raiseExc () handle S.SExc => 5;', undefined, ['v'],
            [[new Val.Integer(5), 0]], [[INT, 0]])
    ]);
    run_test([
        gc('structure S = struct exception SExc of unit fun raiseExc v = raise SExc v end;',
           undefined),
        gc('val v = S.raiseExc () handle S.SExc () => 5;', undefined, ['v'],
            [[new Val.Integer(5), 0]], [[INT, 0]])
    ]);
});

it("signature structure", () => {
    run_test([
        gc('structure Store :> sig type address = int end = struct type address = int end;',
            undefined)
    ]);
});

it("circularity", () => {
    run_test([
        ge('fun test (a, b) = a + test b;', Errors.ElaborationError)
    ]);
});

it("free type variables", () => {
    run_test([
        gc(`fun pot [] = [[]] | pot (x::xs) = let
        val p = pot xs in  p @ (List.map (fn a => x :: a) p) end;`, undefined,
            ['pot'], [undefined], [[BND(FUNC(new Type.CustomType('list', [VAR]),
            new Type.CustomType('list', [new Type.CustomType('list', [VAR])]))), 0]])
    ]);
});

it("junk after declaration", () => {
    run_test([
        ge('fun f x = x);', Errors.ParserError)
    ]);
});

it("structures datatype shadowing", () => {
    run_test([
        gc('structure S1 = struct datatype D = con; end;', undefined),
        gc('structure S2 = struct datatype D = con; end;', undefined),
        gc('open S1;', undefined), // TODO
        gc('val x1 = con;', undefined), // TODO
        gc('open S2;', undefined), // TODO
        gc('val x2 = con;', undefined), // TODO
        ge('x1 = x2;', Errors.ElaborationError)
    ]);
});

it("recursion", () => {
    run_test([
        gc('fun g x y = g x y and f x y = g x x;', undefined, ['f', 'g'],
            [undefined, undefined],
            [[BND(BNDB(new Type.TypeVariableBind('\'c', FUNC(VAR, FUNC(VARB,
                new Type.TypeVariable('\'c')))))),
                0], [BND(BNDB(new Type.TypeVariableBind('\'c', FUNC(VAR, FUNC(VARB,
                    new Type.TypeVariable('\'c')))))),
                0]])
    ]);
});

it("real", () => {
    run_test([
        gc('fun plus x y : real = x+y;', undefined, ['plus'],
            [undefined], [[FUNC(REAL, FUNC(REAL, REAL)), 0]])
    ]);
});

it("incomplete while loop", () => {
    run_test([
        gc('val r = ref 0;', undefined), // TODO
        gc('while true do ((fn x => (r := x * !r)) ((r := !r + 1; !r)));', OVERFLOW)
    ]);
    run_test([
        gc('val r = ref 0;', undefined), // TODO
        ge('while true do ((fn x => (r := x * !r)) ((r := !r + 1;', Errors.IncompleteError)
    ]);
});

it("Unguarded type variables", () => {
    run_test([
        ge("datatype L = n | c of 'a * L;", Errors.ElaborationError)
    ]);
    run_test([
        ge("type ''a foo = 'a -> int;", Errors.ElaborationError)
    ]);
    run_test([
        ge("type 'b foo = 'a -> 'b -> 'c -> int;", Errors.ElaborationError)
    ]);
});

it("type alias", () => {
    run_test([
        gc("type 'a foo = 'a -> int;", undefined),
        gc("fn x : 'a foo foo => ();", undefined, ['it'], [undefined],
           [[BND(FUNC(FUNC(FUNC(VAR, INT), INT), UNIT)), 0]]),
        gc("fn x : 'a foo foo foo => ();", undefined, ['it'], [undefined],
           [[BND(FUNC(FUNC(FUNC( FUNC(VAR, INT), INT), INT), UNIT)), 0]]),
        gc("val a = fn x : 'a foo foo => () val b = fn x : 'a foo foo => ();",
           undefined, ['a', 'b'], [undefined, undefined],
           [[BND(FUNC(FUNC(FUNC(VAR, INT), INT), UNIT)), 0],
            [BND(FUNC(FUNC(FUNC(VAR, INT), INT), UNIT)), 0]])
    ]);
});

it("polymorphic signature type", () => {
    run_test([
        gc("signature ENV = sig val e : 'a end;", undefined),
        ge("structure Env :> ENV = struct val e = 5 end;", Errors.ElaborationError)
    ]);
    run_test([
        gc("signature ENV = sig val e : 'a end;", undefined),
        ge("structure Env : ENV = struct val e = 5 end;", Errors.ElaborationError)
    ]);
});

it("functors", () => {
    run_test([
        gc("signature EXAMPLE = sig type 'a thing val example : 'a -> 'a thing end;", undefined),
        gc("signature MOREEXAMPLE  = sig type 'a more val more : 'a -> 'b -> ('a * 'b) more end;",
           undefined),
        gc("functor EXTEND (BASE : EXAMPLE) : MOREEXAMPLE = struct type 'a more = "
           + "'a BASE.thing fun more a b = BASE.example (a,b) end;", undefined),
        gc("structure LIST_THING : EXAMPLE = struct type 'a thing = 'a list fun example a = [a] end;", undefined),
        gc("structure LOL = EXTEND (LIST_THING);", undefined)
    ]);
});

it("tuple typeVar propagation", () => {
    run_test([
        ge('{1 = fn x=>(), 2 = fn () => x };', Errors.ElaborationError)
    ]);
});

it("free type variables 2", () => {
    run_test([
        gc('val s = ref [];', undefined),
        gc('fun push a x = a := (x::(!a));', undefined),
        gc('push s 1;', undefined),
        ge('push s true;', Errors.ElaborationError)
    ]);
});

it("incomplete records", () => {
    run_test([
        gc('fun myiter f s 0 = s | myiter f s n = myiter f (f s) (n-1);', undefined),
        gc('fun listulate (f,n) = (myiter (fn a => (#1 a+1,f (#1 a)::(#2 a))) (1,nil) n);',
           undefined, ['listulate'], [undefined], [[BND(FUNC(PAIR(FUNC(INT, VAR), INT),
                                                             PAIR(INT, LIST(VAR)))), 0]])
    ]);
    run_test([
        gc('val c = case (0, 0)::nil of a => (#1(hd a), #2(hd a));', undefined,
           ['c'], [undefined], [[PAIR(INT, INT), 0]])
    ]);
});

it("let expressions 2", () => {
    run_test([
        gc('fun f a = let val b = a val c = b in c end;', undefined, ['f'], [undefined],
           [[BND(FUNC(VAR, VAR)), 0]]),
        gc('fun f a = let val b = a val c = b val d = c in d end;', undefined, ['f'], [undefined],
           [[BND(FUNC(VAR, VAR)), 0]]),
    ]);
});

it("eq types", () => {
    run_test([
        gc("fun f (x: ''a)  = false;", undefined, ['f'], [undefined],
           [[EQBND(FUNC(EQVAR, BOOL)), 0]]),
        gc('fun g x = f (x,x);', undefined, ['g'], [undefined],
           [[EQBND(FUNC(EQVAR, BOOL)), 0]]),
    ]);
});

it("star token", () => {
    run_test([
        gc('datatype A = * of int;', undefined)
    ]);
    run_test([
        gc('fun op* (a, b) = 0;', undefined)
    ]);
    run_test([
        ge('datatype * = A of int;', Errors.ParserError)
    ]);
});

it("nested exception type", () => {
    run_test([
        gc('fun something x = (raise Empty; x);', undefined, ['something'],
          [undefined], [[BND(FUNC(VAR, VAR)), 0]]),
        gc('val foo = fn x => raise (something Empty) handle Empty => x;', undefined,
           ['foo'], [undefined], [[BND(FUNC(EXN, VAR)), 0]]),
        ge('foo 3;', Errors.ElaborationError)
    ]);
});
