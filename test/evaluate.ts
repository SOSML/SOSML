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

function run_test(commands, loadStdlib: boolean = true, disableElab: boolean = false): void {
    let oldTests = [];
    let state = API.getFirstState();
    let exception;
    let value;
    let opts = {
        'allowUnicodeInStrings': false,
        'allowSuccessorML': false,
        'disableElaboration': disableElab,
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

it("basic", () => {
    run_test([
        ['42;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType([new Val.Integer(42), 0]);
        }]
    ]);
    run_test([
        ['0w42;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType([new Val.Word(42), 0]);
        }]
    ]);
    run_test([
        ['fun f x = 42;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
        }],
        ['f 10;', (x) => { x(); }, (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType([new Val.Integer(42), 0]);
        }],
        [`fun pot [] = [[]]
    | pot (x::xs) = let
      val p = pot xs
    in
      p @ (List.map (fn a => x :: a) p)
    end;`, (x) => { x(); }, (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
        }],
        [`fun pot [] = [[]]
  | pot (x::xs) = let
    val p = pot xs
  in
    (List.map (fn a => x :: a) p) @ p
  end;`, (x) => { x(); }, (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
        }]
    ], true);
});

it("exp", () => {
    run_test([
        ['42; 10.0;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType([new Val.Real(10), 0]);
        }],
        ['val it = 42;', (x) => { x(); }, (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType([new Val.Integer(42), 0]);
        }],
        [';;42;', (x) => { x(); }, (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType([new Val.Integer(42), 0]);
        }]
    ]);
});

it("local", () => {
    run_test([
        ['local val x = 1 in val y = x end;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('y')).toEqualWithType([new Val.Integer(1), 0]);
        }],
        ['x;', (x) => { expect(x).toThrow(Errors.ElaborationError); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
        }],
    ]);

    run_test([
        [' val x = 2 ; local val x = 1 in val y = x end;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('y')).toEqualWithType([new Val.Integer(1), 0]);
        }],
        ['x;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType([new Val.Integer(2), 0])
        }],
    ]);

    run_test([
        ['fun avg (x,y) = (x+y)/2.0; local infix avg in val x = 1.0 avg 1.0 end;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('x')).toEqualWithType([new Val.Real(1), 0]);
        }],
        ['1.0 avg 1.0;', (x) => { expect(x).toThrow(Errors.ElaborationError); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
        }],
    ]);

    run_test([
        ['fun avg (x,y) = (x+y)/2.0; infix avg;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
        }],
        ['local nonfix avg in val x = avg(1.0, 1.0) end;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('x')).toEqualWithType([new Val.Real(1), 0]);
        }],
        ['1.0 avg 1.0;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
        }],
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
            expect(exceptionValue).toEqualWithType(new Val.ExceptionValue('Match', undefined, 0, 0));
        }]
    ]);
    run_test([
        ['exception Div;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
        }],
        ['(1 div 0) handle Div => 42;', (x) => { x(); }, (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(true);
            expect(exceptionValue).toEqualWithType(new Val.ExceptionValue('Div', undefined, 0, 2));
        }]
    ]);
    run_test([
        ['exception Bind;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
        }],
        ['let val 1 = 2; in true end handle Bind => false;', (x) => { x(); }, (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(true);
            expect(exceptionValue).toEqualWithType(new Val.ExceptionValue('Bind', undefined, 0, 1));
        }]
    ]);
    run_test([
        ['exception Blob; fun f x = raise Blob; exception Blob;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
        }],
        ['f 42 handle Blob => false;', (x) => { x(); }, (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(true);
            expect(exceptionValue).toEqualWithType(new Val.ExceptionValue('Blob', undefined, 0, 11));
        }]
    ]);
});

it("signature", () => {
    run_test([
        ['signature a = sig end;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
        }],
        ['structure b : a = struct end;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
        }],
        ['structure ba : a = struct val x = 1; end;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
        }],
        ['structure bb : a = struct fun f x = 29 end;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
        }],
        ['structure bc : a = struct type z=int end;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
        }],
        ['structure bd : a = struct type z=blu end;', (x) => { expect(x).toThrow(Errors.ElaborationError); },
            (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {}
        ],
        ['structure c :> a = struct end;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
        }],
        ['structure ca :> a = struct val x = 1; end;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
        }],
        ['structure cb :> a = struct fun f x = 29 end;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
        }],
        ['structure cc :> a = struct type z=int end;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
        }],
        ['structure cd :> a = struct type z=blu end;', (x) => { expect(x).toThrow(Errors.ElaborationError); },
            (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {}
        ],
        ['ba.x;', (x) => { expect(x).toThrow(Errors.ElaborationError); },
            (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {}
        ],
        ['bb.f;', (x) => { expect(x).toThrow(Errors.ElaborationError); },
            (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {}
        ],
        ['bc.z;', (x) => { expect(x).toThrow(Errors.ElaborationError); },
            (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {}
        ],
        ['bd.z;', (x) => { expect(x).toThrow(Errors.ElaborationError); },
            (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {}
        ],
        ['ca.x;', (x) => { expect(x).toThrow(Errors.ElaborationError); },
            (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {}
        ],
        ['cb.f;', (x) => { expect(x).toThrow(Errors.ElaborationError); },
            (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {}
        ],
        ['cc.z;', (x) => { expect(x).toThrow(Errors.ElaborationError); },
            (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {}
        ],
        ['cd.z;', (x) => { expect(x).toThrow(Errors.ElaborationError); },
            (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {}
        ],
    ]);
    run_test([
        ['signature a = sig type z end;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
        }],
        ['structure b :> a = struct type z=int end;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false); //TODO
        }],
        ['structure c : a = struct type z=int end;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false); //TODO
        }],
    ]);
});

it("no elab - basic", () => {
    run_test([
        ['42;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType([new Val.Integer(42), 0]);
        }]
    ], true, true);
    run_test([
        ['0w42;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType([new Val.Word(42), 0]);
        }]
    ], true, true);
    run_test([
        ['fun f x = 42;', (x) => { x(); },  (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
        }],
        ['f 10;', (x) => { x(); }, (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
            expect(state.getDynamicValue('it')).toEqualWithType([new Val.Integer(42), 0]);
        }],
        [`fun pot [] = [[]]
    | pot (x::xs) = let
      val p = pot xs
    in
      p @ (List.map (fn a => x :: a) p)
    end;`, (x) => { x(); }, (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
        }],
        [`fun pot [] = [[]]
  | pot (x::xs) = let
    val p = pot xs
  in
    (List.map (fn a => x :: a) p) @ p
  end;`, (x) => { x(); }, (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
        }]
    ], true, true);
});


it("no elab - incorrect types", () => {
    run_test([
        ['["1", #"1"];', (x) => { x(); },
            (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
        }],
        ['["1", 1.0];', (x) => { x(); },
            (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
        }],
        ['["1", #"1"] : char list;', (x) => { x(); },
            (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {
            expect(hasThrown).toEqual(false);
        }]
    ], true, true);
    run_test([
        ['(fn x => (fn y => (fn x => y) x) y) x;',
            (x) => { expect(x).toThrow(Errors.EvaluationError); },
            (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {}
        ]
    ], true, true);
    run_test([
        ['vall x = 10;',
            (x) => { expect(x).toThrow(Errors.EvaluationError); },
            (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {}
        ]
    ], true, true);
    run_test([
        ['2 * 5.5;',
            (x) => { expect(x).toThrow(Errors.InternalInterpreterError); },
            (state : State.State, hasThrown : bool, exceptionValue : Val.Exception) => {}
        ]
    ], true, true);

});
