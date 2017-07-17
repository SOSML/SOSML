const Lexer = require("../src/lexer");
const Parser = require("../src/parser");
const Errors = require("../src/errors");

const State = require("../src/state.ts");
const Expr = require("../src/expressions.ts");
const Decl = require("../src/declarations.ts");
const Type = require("../src/types.ts");

const TestHelper = require("./test_helper.ts");
TestHelper.init();

function parse(str: string): Decl.Declaration {
    return Parser.parse(Lexer.lex(str), State.getInitialState());
}

it("exp", () => {
    //TODO
});

it("pat", () => {
    //TODO
});

it("patrow", () => {
    //TODO
});

it("ty", () => {
    //TODO
});

it("fvalbind", () => {
    //TODO
});

it("dec", () => {
    //TODO
});

it("strbind", () => {
    //TODO
});

it("strexp", () => {
    //TODO
});

it("funbind", () => {
    //TODO
});

it("program", () => {
    //TODO
});
