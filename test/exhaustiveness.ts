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
    let warning;
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
            warning = res['warnings'];
            if (warning === undefined) {
                warning = [];
            }
        });

        step[2](state, warning);

        for(let test of oldTests)
            test[1](test[0][0], test[0][1]);

        oldTests.push([[state, warning], step[2]]);
    }
}

function ok(code: string): any {
    return [code, (x) => { x(); },  (state: State.State, warning: Errors.Warning[]) => {
        expect(warning.length).toEqual(0);
    }
}

function ne(code: string, type: number = -1,
            message: string = 'Pattern matching is not exhaustive.\n'): any {
    return [code, (x) => { x(); },  (state: State.State, warning: Errors.Warning[]) => {
        expect(warning.length).toEqual(1);
        expect(warning[0].type).toEqual(type);
        expect(warning[0].message).toEqual(message);
    }
}

function uu(code: string, duplicate: string, hasne: boolean = false, type: number = 0): any {
    return [code, (x) => { x(); },  (state: State.State, warning: Errors.Warning[]) => {
        let message = 'Rules after "' + duplicate + '" unused in pattern matching.\n';
        let nem = 'Pattern matching is not exhaustive.\n';
        expect(warning.length).toEqual(hasne ? 2 : 1);
        if (hasne) {
            if (warning[0].message === message) {
                expect(warning[0].type).toEqual(type);
                expect(warning[1].type).toEqual(-1);
                expect(warning[1].message).toEqual(nem);
            } else {
                expect(warning[0].type).toEqual(-1);
                expect(warning[0].message).toEqual(nem);
                expect(warning[1].type).toEqual(type);
                expect(warning[1].message).toEqual(message);
            }
        } else {
            expect(warning[0].type).toEqual(type);
            expect(warning[0].message).toEqual(message);
        }
    }
}

function dp(code: string, duplicate: string, hasne: boolean = false, type: number = 0): any {
    return [code, (x) => { x(); },  (state: State.State, warning: Errors.Warning[]) => {
        let message = 'Duplicate rule for "' + duplicate + '" in pattern matching.\n';
        let nem = 'Pattern matching is not exhaustive.\n';
        expect(warning.length).toEqual(hasne ? 2 : 1);
        if (hasne) {
            if (warning[0].message === message) {
                expect(warning[0].type).toEqual(type);
                expect(warning[1].type).toEqual(-1);
                expect(warning[1].message).toEqual(nem);
            } else {
                expect(warning[0].type).toEqual(-1);
                expect(warning[0].message).toEqual(nem);
                expect(warning[1].type).toEqual(type);
                expect(warning[1].message).toEqual(message);
            }
        } else {
            expect(warning[0].type).toEqual(type);
            expect(warning[0].message).toEqual(message);
        }

    }
}

// Exhaustiveness tests

it('basic', () => {
    run_test([
        ok('fun f 1 = 2 | f x = 10;'),
    ]);
    run_test([
        ne('fun f 1 = 2 | f 2 = 10;')
    ]);
    run_test([
        ok('fun f () = 5;');
    ]);
});

it('lists', () => {
    run_test([
        ok('fun f (a::b::c) = 10 | f _ = 4;'),
    ]);
    run_test([
        ok('fun f (a: int list) = 10;'),
    ]);
    run_test([
        ne('fun f [] = 1 | f (x::y::xs) = 2;'),
    ]);
    run_test([
        ok('fun f [] = 2 | f (1::xs) = 3 | f (x::xs) = 10;'),
    ]);
    run_test([
        ne('fun f [] = 2 | f (1::xs) = 3;'),
    ]);
});

it('tuple - simple', () => {
    run_test([
        ne('fun f (1,1) = 2 | f (2, 1) = 10;')
    ]);
});
it('tuple - list', () => {
    run_test([
        ok('fun f (x::xs, y::ys) = [] | f ([], []) = [] | f (_, []) = [] | f ([], _) = [];')
    ]);
    run_test([
        ne('fun f (1::xs, 3::ys) = [] | f ([], []) = [] | f (_, []) = [] | f ([], _) = [];')
    ]);
});
it('tuple - incomplete', () => {
    run_test([
        ne('fun f (10, 5) = 3 | f (10, _) = 1 | f (_, 10) = 2;')
    ]);
    run_test([
        ne('fun f {1 = 10, 2 = 5} = 3 | f {1 = 10 ...} = 1 | f {2 = 10 ...} = 2;')
    ]);
    run_test([
        ok('fun f {1 = 10, 2 = 5} = 3 | f {1 = 10 ...} = 1 | f (a, _) = 2;')
    ]);
});
it('tuple - nested', () => {
    run_test([
        ne('fun f ([],_) = 12 | f (_,[]) = 1;')
    ]);
    run_test([
        ne('fun f ([],_) = 12 | f (_,[]) = 1 | f ([], a::bs) = 6;')
    ]);
    run_test([
        ne('fun f (([],_),_) = 12 | f ((_,[]),_) = 1 | f (([],a::bs), _) = 6;')
    ]);
    run_test([
        ne('fun f ((([],_),_),_) = 12 | f (((_,[]),_),_) = 1 | f ((([],a::bs), _), _) = 6;')
    ]);
    run_test([
        ok('fun f ((([],_),_),_) = 12 | f (((_,[]),_),_) = 1 | f (((c::cs,a::bs), _), _) = 6;')
    ]);
    run_test([
        ok('fun f ((a::bs, _),_) = 2 | f (([], _),_) = 10;')
    ]);
    run_test([
        ok('fun h (s,c) (x::xs) = 1 | h (s,c) nil = 2;')
    ]);
});
it('tuple - nested 2', () => {
    run_test([
        ne('fun f ((1,2),_) = 12 | f ((1,_),_) = 1 | f ((_,_), 5) = 6;')
    ]);
    run_test([
        ok('fun f ([],c::d::cs) = 1 | f (a::bs, _) = 2 | f ([], _) = 10;')
    ]);
    run_test([
        ok('fun f (([],c::d::cs),_) = 1 | f ((a::bs, _),_) = 2 | f (([], _),_) = 10;')
    ]);
    run_test([
        ok('fun f (([],c::d::cs),_) = 1 | f ((a::bs, c::cs),_) = 2 | f ((_,[]),_) = 3 | f (([], _),_) = 10;')
    ]);
});

it('custom type - simple', () => {
    run_test([
        ok('datatype D = A | B;'),
        ok('fun f A = 2 | f B = 3;'),
        ne('fun g A = 13;')
    ]);
});
it('custom type - param', () => {
    run_test([
        ok('datatype D = A | B of int;'),
        ok('fun f A = 2 | f (B x) = x;'),
        ne('fun g A = 10 | g (B 5) = 13;')
    ]);
    run_test([
        ok('datatype D = A of D * D | B of int;'),
        ne('fun f (B 1) = 2 | f (B 2) = 10 | f (A (B 1,x)) = 13;')
    ]);
    run_test([
        ok('datatype D = A of D * D | B of int;'),
        ne('fun f (B x) = 2 | f (A (B 1,x)) = 13;')
    ]);
});
it('custom type - tuple', () => {
    run_test([
        ok('datatype D = A | B;'),
        ne('fun f ([A], [A]) = 1 | f ([B], x::xs) = 2 | f (x::y::xs, [A]) = 3 | f ([], [A]) = 4;')
    ]);
});

// Duplicate tests
it('basic duplicate', () => {
    run_test([
        uu('fun f _ = 2 | f 1 = 2 | f x = 10;', '_')
    ]);
    run_test([
        dp('fun f 1 = 2 | f 1 = 3 | f 2 = 10;', '1', true)
    ]);
    run_test([
        dp('fun f ([], []) = 10 | f ([], []) = 20 | f _ = 30;', '(nil, nil)')
    ]);
});

it('tuple duplicate', () => {
    run_test([
        uu('fun f {1 = 10, 2 = 5} = 3 | f (a, _) = 2 | f (1, _) = 20;', '(a, _)')
    ]);
});

/*
it('lists', () => {
    run_test([
    ]);
});
*/
