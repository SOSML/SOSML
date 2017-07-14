const Lexer = require("../src/lexer");
const Parser = require("../src/parser");
const Errors = require("../src/errors");

const Expr = require("../src/expressions.ts");
const Decl = require("../src/declarations.ts");

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

it("basic", () => {
    let testcase_empty: string = ';';
    let testcase_simple1: string = 'val x = 42;';

    expect(Parser.parse(Lexer.lex(testcase_empty))).toEqualWithType(
        new Decl.SequentialDeclaration(0, [])
    );
    expect(Parser.parse(Lexer.lex(testcase_simple1))).toEqualWithType(
        new Decl.SequentialDeclaration(0, [
            new Decl.ValueDeclaration(0, [], [
                new Decl.ValueBinding(4, false,
                    new Expr.ValueIdentifier(4, new Lexer.AlphanumericIdentifierToken('x', 4)),
                    new Expr.Constant(8, new Lexer.NumericToken('42', 8, 42))
                )
            ])
        ])
    );
});

it("atomic expression - special constant", () => {
    let testcase_special_const: string = '42;';

    expect(Parser.parse(Lexer.lex(testcase_special_const))).toEqualWithType(createItExpression(
        new Expr.Constant(0, new Lexer.NumericToken('42', 0, 42))
    ));

    //TODO maybe more?
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
    //TODO tests
});

it("type - record type expression", () => {
    //TODO tests
});

it("type - type construction", () => {
    //TODO tests
});

it("type - tuple type", () => {
    //TODO tests
});

it("type - function type expression", () => {
    //TODO tests
});

it("type - bracketed", () => {
    //TODO tests
});

it("type row", () => {
    //TODO tests
});

