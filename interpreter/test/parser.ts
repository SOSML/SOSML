const Lexer = require("../src/lexer");
const Parser = require("../src/parser");
const Errors = require("../src/errors");

const Expr = require("../src/expressions.ts");
const Decl = require("../src/declarations.ts");
const Type = require("../src/types.ts");

const TestHelper = require("./test_helper.ts");
TestHelper.init();

function createItExpression(exp: Expr.Expression): void {
    return new Decl.SequentialDeclaration(0, [
        new Decl.ValueDeclaration(0, [], [
            new Decl.ValueBinding(0, false,
                new Expr.ValueIdentifier(-1, new Lexer.AlphanumericIdentifierToken('it', -1)),
                exp
            )
        ])
    ]);
}

function prefixWithOp(tok: Lexer.IdentifierToken): Lexer.IdentifierToken {
    tok.opPrefixed = true;
    return tok;
}

function get42(pos: Errors.Position): Expr.Expresion {
    return new Expr.Constant(pos, new Lexer.NumericToken('42', pos, 42));
}

const sampleExpression: string = 'if 5 then 9 else 7';
function createSampleExpression(pos: Errors.Position): Expr.Expression {
    return new Expr.Conditional(pos,
            new Expr.Constant(pos, new Lexer.NumericToken('5', pos+3, 5)),
            new Expr.Constant(pos, new Lexer.NumericToken('9', pos+10, 9)),
            new Expr.Constant(pos, new Lexer.NumericToken('7', pos+17, 7))
        );
    );
}

it("basic", () => {
    let testcase_empty: string = ';';
    let testcase_simple1: string = 'val x = 42;';
    let testcase_sample_expr: string = sampleExpression + ';';

    expect(Parser.parse(Lexer.lex(testcase_empty))).toEqualWithType(
        new Decl.SequentialDeclaration(0, [])
    );
    expect(Parser.parse(Lexer.lex(testcase_simple1))).toEqualWithType(
        new Decl.SequentialDeclaration(0, [
            new Decl.ValueDeclaration(0, [], [
                new Decl.ValueBinding(4, false,
                    new Expr.ValueIdentifier(4, new Lexer.AlphanumericIdentifierToken('x', 4)),
                    get42(8)
                )
            ])
        ])
    );
    expect(Parser.parse(Lexer.lex(testcase_sample_expr))).toEqualWithType(createItExpression(
        createSampleExpression(0)
    ));
});

it("atomic expression - special constant", () => {
    let testcase_special_zero: string = '0;';
    let testcase_special_int: string = '42;';
    let testcase_special_real: string = '42.0;';
    let testcase_special_word: string = '0w42;';
    let testcase_special_char: string = '#"c";';
    let testcase_special_string: string = '"str";';

    expect(Parser.parse(Lexer.lex(testcase_special_zero))).toEqualWithType(createItExpression(
        new Expr.Constant(0, new Lexer.IntegerConstantToken('0', 0, 0))
    ));
    expect(Parser.parse(Lexer.lex(testcase_special_int))).toEqualWithType(createItExpression(
        get42(0)
    ));
    expect(Parser.parse(Lexer.lex(testcase_special_real))).toEqualWithType(createItExpression(
        new Expr.Constant(0, new Lexer.RealConstantToken('42.0', 0, 42.0))
    ));
    expect(Parser.parse(Lexer.lex(testcase_special_word))).toEqualWithType(createItExpression(
        new Expr.Constant(0, new Lexer.WordConstantToken('0w42', 0, 42))
    ));
    expect(Parser.parse(Lexer.lex(testcase_special_char))).toEqualWithType(createItExpression(
        new Expr.Constant(0, new Lexer.CharacterConstantToken('#"c"', 0, 'c'))
    ));
    expect(Parser.parse(Lexer.lex(testcase_special_string))).toEqualWithType(createItExpression(
        new Expr.Constant(0, new Lexer.StringConstantToken('"str"', 0, 'str'))
    ));
});

it("atomic expression - value identifier", () => {
    let testcase_vid_with_op: string = 'op +;';
    let testcase_vid_with_op_long: string = 'op Math.pow;';
    let testcase_vid_without_op: string = 'blub;';
    let testcase_vid_without_op_long: string = 'Reals.nan;';

    expect(Parser.parse(Lexer.lex(testcase_vid_with_op))).toEqualWithType(createItExpression(
        new Expr.ValueIdentifier(0,
            prefixWithOp(new Lexer.IdentifierToken('+', 3))
        )
    ));
    expect(Parser.parse(Lexer.lex(testcase_vid_with_op_long))).toEqualWithType(createItExpression(
        new Expr.ValueIdentifier(0,
            prefixWithOp(new Lexer.LongIdentifierToken('Math.pow', 3, [
                    new Lexer.AlphanumericIdentifierToken('Math', 3)
                ],
                new Lexer.AlphanumericIdentifierToken('pow', 8)
            ))
        )
    ));

    //TODO last 2 testcases
});

it("atomic expression - records", () => {
    let testcase_rec_empty: string = '{}';
    let testcase_rec_single: string = '{ 0 = hello }';
    let testcase_rec_multiple: string = '{ 0 = hello, world = 42, what = ever}';

    //TODO test the testcases
});


it("atomic expression - record selector", () => {
    //TODO tests
});

it("atomic expression - 0 tuple", () => {
    //TODO tests
});

it("atomic expression - n tuple", () => {
    //TODO tests
});

it("atomic expression - list", () => {
    //TODO tests
});

it("atomic expression - sequence", () => {
    //TODO tests
});

it("atomic expression - local declaration", () => {
    //TODO tests
});

it("atomic expression - bracketed expression", () => {
    //TODO tests
});

it("expression row", () => {
    //TODO tests
});

it("application expression", () => {
    //TODO tests
});

it("infix expression", () => {
    //TODO tests
});

it("expression - passthrough", () => {
    //TODO tests
});

it("expression - typed expression", () => {
    //TODO tests
});

it("expression - conjunction", () => {
    //TODO tests
});

it("expression - disjunction", () => {
    //TODO tests
});

it("expression - handle exception", () => {
    //TODO tests
});

it("expression - raise exception", () => {
    //TODO tests
});

it("expression - conditional", () => {
    //TODO tests
});

it("expression - iteration", () => {
    //TODO tests
});

it("expression - case analysis", () => {
    //TODO tests
});

it("expression - function", () => {
    //TODO tests
});

it("matches", () => {
    //TODO tests
});

it("declaration - value declaration", () => {
    //TODO tests
});

it("declaration - function declaration", () => {
    //TODO tests
});

it("declaration - type declaration", () => {
    //TODO tests
});

it("declaration - datatype declaration", () => {
    //TODO tests
});

it("declaration - datatype replication", () => {
    //TODO tests
});

it("declaration - abstype declaration", () => {
    //TODO tests
});

it("declaration - exception declaration", () => {
    //TODO tests
});

it("declaration - local declaration", () => {
    //TODO tests
});

it("declaration - open declaration", () => {
    //TODO tests
});

it("declaration - empty declaration", () => {
    //TODO tests
});

it("declaration - sequential declaration", () => {
    //TODO tests
});

it("declaration - infix (L) directive", () => {
    //TODO tests
});

it("declaration - infix (R) directive", () => {
    //TODO tests
});

it("declaration - nonfix directive", () => {
    //TODO tests
});

it("value bindings - non recursive", () => {
    //TODO tests
});

it("value bindings - recursive", () => {
    //TODO tests
});

it("function value bindings", () => {
    //TODO tests
});

it("type bindings", () => {
    //TODO tests
});

it("datatype bindings", () => {
    //TODO tests
});

it("constructor bindings", () => {
    //TODO tests
});

it("exception bindings", () => {
    //TODO tests
});

it("constructor bindings", () => {
    //TODO tests
});

it("atomic pattern - wildcard", () => {
    //TODO tests
});

it("atomic pattern - special constant", () => {
    //TODO tests
});

it("atomic pattern - value identifier", () => {
    //TODO tests
});

it("atomic pattern - record", () => {
    //TODO tests
});

it("atomic pattern - 0-tuple", () => {
    //TODO tests
});

it("atomic pattern - n-tuple", () => {
    //TODO tests
});

it("atomic pattern - list", () => {
    //TODO tests
});

it("atomic pattern - bracketed", () => {
    //TODO tests
});

it("pattern row - wildcard", () => {
    //TODO tests
});

it("pattern row - pattern row", () => {
    //TODO tests
});

it("pattern row - label as variable", () => {
    //TODO tests
});

it("pattern - atomic", () => {
    //TODO tests
});

it("pattern - constructed value", () => {
    //TODO tests
});

it("pattern - constructed value (infix)", () => {
    //TODO tests
});

it("pattern - typed", () => {
    //TODO tests
});

it("pattern - layered", () => {
    //TODO tests
});

it("type - type variable", () => {
    let testcase_tyvar: string = '42: \'a;';
    let testcase_etyvar: string = '42: \'\'meaningoflive;';

    expect(Parser.parse(Lexer.lex(testcase_tyvar))).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.TypeVariable('\'a', 4)
        )
    ));
    expect(Parser.parse(Lexer.lex(testcase_etyvar))).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.TypeVariable('\'\'meaningoflive', 4)
        )
    ));
});

it("type - record type expression", () => {
    let testcase_empty: string = '42: {};';
    let testcase_single: string = '42: { hi : \'int };';
    let testcase_multiple: string = '42: { hello: \'a, world: \'b };';
    let testcase_no_unit: string = '42: ();';
    let testcase_no_same_label: string = '42: { hi: \'a, hi: \'a };';

    expect(Parser.parse(Lexer.lex(testcase_empty))).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.RecordType(
                new Map([]),
                true,
                5
            )
        )
    ));
    expect(Parser.parse(Lexer.lex(testcase_single))).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.RecordType(
                new Map([
                    ["hi", new Type.TypeVariable('\'int', 11)]
                ]),
                true,
                6
            )
        )
    ));
    expect(Parser.parse(Lexer.lex(testcase_multiple))).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.RecordType(
                new Map([
                    ["hello", new Type.TypeVariable('\'a', 13)],
                    ["world", new Type.TypeVariable('\'b', 24)]
                ]),
                true,
                6
            )
        )
    ));
    expect(() => { Parser.parse(Lexer.lex(testcase_no_unit)); }).toThrow(Parser.ParserError);
    expect(() => { Parser.parse(Lexer.lex(testcase_no_same_label)); }).toThrow(Parser.ParserError);
});

it("type - type construction", () => {
    let testcase_small: string = '42: list;';
    let testcase_single: string = '42: \'a list;';
    let testcase_multiple: string = '42: (\'a * \'b, \'c) list;';

    expect(Parser.parse(Lexer.lex(testcase_small))).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.CustomType(new Lexer.AlphanumericIdentifierToken('list', 4), [], 4)
        )
    ));
    expect(Parser.parse(Lexer.lex(testcase_single))).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.CustomType(
                new Lexer.AlphanumericIdentifierToken('list', 7), [
                    new Type.TypeVariable('\'a', 4),
                ],
                4
            )
        )
    ));
    expect(Parser.parse(Lexer.lex(testcase_multiple))).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.CustomType(
                new Lexer.AlphanumericIdentifierToken('list', 18), [
                    new Type.TupleType([
                            new Type.TypeVariable('\'a', 5),
                            new Type.TypeVariable('\'b', 10)
                        ],
                        8
                    ),
                    new Type.TypeVariable('\'c', 14),
                ],
                4
            )
        )
    ));
});

it("type - tuple type", () => {
    let testcase_simple: string = '42: \'a * \'b;';
    let testcase_multiple: string = '42: \'a * \'b * \'c;';
    let testcase_bracketed: string = '42: \'a * (\'b * \'c);';

    expect(Parser.parse(Lexer.lex(testcase_simple))).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.TupleType([
                    new Type.TypeVariable('\'a', 4),
                    new Type.TypeVariable('\'b', 9)
                ],
                7
            )
        )
    ));
    expect(Parser.parse(Lexer.lex(testcase_multiple))).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.TupleType([
                    new Type.TypeVariable('\'a', 4),
                    new Type.TypeVariable('\'b', 9),
                    new Type.TypeVariable('\'c', 14)
                ],
                7
            )
        )
    ));
    expect(Parser.parse(Lexer.lex(testcase_bracketed))).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.TupleType([
                    new Type.TypeVariable('\'a', 4),
                    new Type.TupleType([
                            new Type.TypeVariable('\'b', 10),
                            new Type.TypeVariable('\'c', 15)
                        ],
                        13
                    )
                ],
                7
            )
        )
    ));
});

it("type - function type expression", () => {
    let testcase_simple: string = '42: \'a -> \'b;';
    let testcase_multiple: string = '42: \'a -> \'b -> \'c;';
    let testcase_multiple_bracketed: string = '42: (\'a -> \'b) -> \'c;';

    expect(Parser.parse(Lexer.lex(testcase_simple))).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.FunctionType(
                new Type.TypeVariable('\'a', 4),
                new Type.TypeVariable('\'b', 10),
                7
            )
        )
    ));
    expect(Parser.parse(Lexer.lex(testcase_multiple))).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.FunctionType(
                new Type.TypeVariable('\'a', 4),
                new Type.FunctionType(
                    new Type.TypeVariable('\'b', 10),
                    new Type.TypeVariable('\'c', 16),
                    13
                ),
                7
            )
        )
    ));
    expect(Parser.parse(Lexer.lex(testcase_multiple_bracketed))).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.FunctionType(
                new Type.FunctionType(
                    new Type.TypeVariable('\'a', 5),
                    new Type.TypeVariable('\'b', 11),
                    8
                ),
                new Type.TypeVariable('\'c', 18),
                15
            )
        )
    ));
});

it("type - bracketed", () => {
    let testcase_simple: string = '42: (\'a);';
    let testcase_multiple_nested: string = '42: ((((\'a -> \'b))));';
    let testcase_nested_complex = '42: ({ hi: (\'a)});';

    expect(Parser.parse(Lexer.lex(testcase_simple))).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.TypeVariable('\'a', 5)]
        )
    ));
    expect(Parser.parse(Lexer.lex(testcase_multiple_nested))).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.FunctionType(
                new Type.TypeVariable('\'a', 8),
                new Type.TypeVariable('\'b', 14),
                11
            )
        )
    ));
    expect(Parser.parse(Lexer.lex(testcase_nested_complex))).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.RecordType(
                new Map([
                    ["hi", new Type.TypeVariable('\'a', 12)]
                ]),
                true,
                7
            )
        )
    ));
});

it("type row", () => {
    let testcase_alphanum: string = '42: { hi: \'a};';
    let testcase_numeric: string = '42: { 1337: \'a};';
    let testcase_non_alphanum: string = '42: { ### : \'a};';
    let testcase_zero: string = '42: { 0: \'a};';
    let testcase_reserved_word: string = '42: { val: \'a};';
    let testcase_equals: string = '42: { =: \'a};';
    let testcase_ident: string = '42: { hi: a};';
    let testcase_tyvar: string = '42: { hi: \'a};';
    let testcase_etyvar: string = '42: { hi: \'\'a};';

    expect(Parser.parse(Lexer.lex(testcase_alphanum))).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.RecordType(
                new Map([
                    ["hi", new Type.TypeVariable('\'a', 10)]
                ]),
                true,
                6
            )
        )
    ));
    expect(Parser.parse(Lexer.lex(testcase_numeric))).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.RecordType(
                new Map([
                    ["1337", new Type.TypeVariable('\'a', 12)]
                ]),
                true,
                6
            )
        )
    ));
    expect(Parser.parse(Lexer.lex(testcase_non_alphanum))).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.RecordType(
                new Map([
                    ["###", new Type.TypeVariable('\'a', 12)]
                ]),
                true,
                6
            )
        )
    ));

    expect(() => { Parser.parse(Lexer.lex(testcase_zero)); }).toThrow(Parser.ParserError);
    expect(() => { Parser.parse(Lexer.lex(testcase_reserved_word)); }).toThrow(Parser.ParserError);
    expect(() => { Parser.parse(Lexer.lex(testcase_equals)); }).toThrow(Parser.ParserError);

    expect(Parser.parse(Lexer.lex(testcase_ident))).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.RecordType(
                new Map([
                    ["hi", new Type.CustomType(
                        new Lexer.AlphanumericIdentifierToken('a', 10), [], 10)]
                ]),
                true,
                6
            )
        )
    ));
    expect(Parser.parse(Lexer.lex(testcase_tyvar))).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.RecordType(
                new Map([
                    ["hi", new Type.TypeVariable('\'a', 10)]
                ]),
                true,
                6
            )
        )
    ));
    expect(Parser.parse(Lexer.lex(testcase_etyvar))).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.RecordType(
                new Map([
                    ["hi", new Type.TypeVariable('\'\'a', 10)]
                ]),
                true,
                6
            )
        )
    ));
});

