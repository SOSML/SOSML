import { Type } from './types';
import { Token, IdentifierToken } from './lexer';
import { Declaration } from './declarations';
import { ASTNode } from './ast';
import { State } from './state';
import { InternalInterpreterError, Position } from './errors';
import { Value } from './values';


export abstract class Expression extends ASTNode {
    type: Type;

    checkStaticSemantics(state: State): void {
        this.type = this.computeType(state);
    }

    getType(state: State): Type {
        if (this.type === undefined) { // TODO: is this.type really undefined if we never assign anything?
            throw new InternalInterpreterError(this.position, 'didn\'t call checkStaticSemantics before getType');
        }
        return this.type;
    }

    computeType(state: State): Type {
        throw new InternalInterpreterError(this.position, 'called computeType on derived form');
    }

    evaluate(state: State): void {
        // TODO: should create a binding for the variable it to this expression value
    }

    getValue(state: State): Value {
        throw new InternalInterpreterError(this.position, 'called getValue on derived form');
    }

    prettyPrint(indentation: number, oneLine: boolean): string {
        // TODO: move to subclasses
        throw new InternalInterpreterError(this.position, 'not yet implemented');
    }

    abstract simplify(): Expression;
    abstract reParse(state: State): Expression;
}


export interface Pattern {
    // Returns which bindings would be created by matching v to this Pattern,
    // or undefined, if v does not match this Pattern.
    position: number;
    matches(state: State, v: Value): [string, Value][] | undefined;
    simplify(): Pattern;
    reParse(state: State): Pattern;
    prettyPrint(indentation: number, oneLine: boolean): string;
}

export class Wildcard extends Expression implements Pattern {
    constructor(public position: Position) { super(); }

    getValue(state: State): Value {
        throw new InternalInterpreterError(this.position, 'called getValue on a pattern wildcard');
    }

    matches(state: State, v: Value): [string, Value][] | undefined {
        return [];
    }

    simplify(): Wildcard {
        return this;
    }

    reParse(state: State): Wildcard {
        return this;
    }

    prettyPrint(indentation: number, oneLine: boolean): string {
        return '_';
    }
}

export class LayeredPattern extends Expression implements Pattern {
// <op> identifier <:type> as pattern
    constructor(public position: Position, public identifier: IdentifierToken, public typeAnnotation: Type | undefined,
                public pattern: Pattern | Expression
    ) { super(); }

    getValue(state: State): Value {
        throw new InternalInterpreterError(this.position, 'called getValue on a pattern');
    }

    matches(state: State, v: Value): [string, Value][] | undefined {
        // TODO
        throw new InternalInterpreterError(this.position, 'not yet implemented');
    }

    simplify(): LayeredPattern {
        if (this.typeAnnotation) {
            return new LayeredPattern(this.position, this.identifier, this.typeAnnotation.simplify(),
                this.pattern.simplify());
        } else {
            return new LayeredPattern(this.position, this.identifier, undefined, this.pattern.simplify());
        }
    }

    reParse(state: State): LayeredPattern {
        if (this.typeAnnotation) {
            return new LayeredPattern(this.position, this.identifier, this.typeAnnotation,
                this.pattern.reParse(state));
        } else {
            return new LayeredPattern(this.position, this.identifier, undefined, this.pattern.reParse(state));
        }
    }

    prettyPrint(indentation: number, oneLine: boolean): string {
        // TODO
        throw new InternalInterpreterError(this.position, 'not yet implemented');
    }
}


export class Match extends ASTNode {
// pat => exp or pat => exp | match
    patternType: Type;
    returnType: Type;

    constructor(public position: Position, public matches: [Pattern, Expression][]) { super (); }

    checkStaticSemantics(state: State) {
        // TODO
    }

    prettyPrint(indentation: number, oneLine: boolean): string {
        // TODO
        let res = '';
        for (let i = 0; i < this.matches.length; ++i) {
            if (i > 0) {
                res += ' | ';
            }
            res += this.matches[i][0].prettyPrint(indentation, oneLine);
            res += ' => ' + this.matches[i][1].prettyPrint(indentation, oneLine);
        }
        return res;
    }

    evaluate(state: State): void {
        // TODO: probably remove
        throw new InternalInterpreterError(this.position, 'not yet implemented');
    }

    getValue(state: State, matchWith: Value): Value {
        // TODO
        throw new InternalInterpreterError(this.position, 'not yet implemented');
    }

    simplify(): Match {
        let newMatches: [Pattern, Expression][] = [];
        for (let i = 0; i < this.matches.length; ++i) {
            let m: [Pattern, Expression] = this.matches[i];
            newMatches.push([m[0].simplify(), m[1].simplify()]);
        }
        return new Match(this.position, newMatches);
    }

    reParse(state: State): Match {
        let newMatches: [Pattern, Expression][] = [];
        for (let i = 0; i < this.matches.length; ++i) {
            let m: [Pattern, Expression] = this.matches[i];
            newMatches.push([m[0].reParse(state), m[1].reParse(state)]);
        }
        return new Match(this.position, newMatches);
    }
}

export class TypedExpression extends Expression implements Pattern {
// expression: type (L)
    constructor(public position: Position, public expression: Expression|Pattern,
                public typeAnnotation: Type) { super(); }

    matches(state: State, v: Value): [string, Value][] | undefined {
        // TODO
        throw new InternalInterpreterError(this.position, 'not yet implemented');
    }

    simplify(): TypedExpression {
        return new TypedExpression(this.position, this.expression.simplify(), this.typeAnnotation.simplify());
    }

    reParse(state: State): TypedExpression {
        return new TypedExpression(this.position, this.expression.reParse(state), this.typeAnnotation);
    }

    prettyPrint(indentation: number, oneLine: boolean): string {
        // TODO
        let res = '( ' + this.expression.prettyPrint(indentation, oneLine);
        res += ': ' + this.type.prettyPrint();
        return res + ' )';
    }
}

export class HandleException extends Expression {
// expression handle match
    constructor(public position: Position, public expression: Expression, public match: Match) { super(); }

    simplify(): HandleException {
        return new HandleException(this.position, this.expression.simplify(), this.match.simplify());
    }

    reParse(state: State): HandleException {
        return new HandleException(this.position, this.expression.reParse(state), this.match.reParse(state));
    }

    prettyPrint(indentation: number, oneLine: boolean): string {
        // TODO
        let res = '( ' + this.expression.prettyPrint(indentation, oneLine) + ' )';
        res += ' handle ' + this.match.prettyPrint(indentation, oneLine);
        return res;
    }
}

export class RaiseException extends Expression {
// raise expression
    constructor(public position: Position, public expression: Expression) { super(); }

    simplify(): RaiseException {
        return new RaiseException(this.position, this.expression.simplify());
    }

    reParse(state: State): RaiseException {
        return new RaiseException(this.position, this.expression.reParse(state));
    }

    prettyPrint(indentation: number, oneLine: boolean): string {
        // TODO
        return 'raise ' + this.expression.prettyPrint(indentation, oneLine);
    }
}

export class Lambda extends Expression {
// fn match
    constructor(public position: Position, public match: Match) { super(); }

    simplify(): Lambda {
        return new Lambda(this.position, this.match.simplify());
    }

    reParse(state: State): Lambda {
        return new Lambda(this.position, this.match.reParse(state));
    }

    prettyPrint(indentation: number, oneLine: boolean): string {
        // TODO
        return 'fn ' + this.match.prettyPrint(indentation, oneLine);
    }
}

// May represent either a function application or a constructor with an argument
export class FunctionApplication extends Expression implements Pattern {
// function argument
    constructor(public position: Position,
                public func: Expression|Pattern,
                public argument: Expression|Pattern) { super(); }

    matches(state: State, v: Value): [string, Value][] | undefined {
        // TODO
        throw new InternalInterpreterError(this.position, 'not yet implemented');
    }

    simplify(): FunctionApplication {
        return new FunctionApplication(this.position, this.func.simplify(), this.argument.simplify());
    }

    reParse(state: State): FunctionApplication {
        // TODO check that this is indeed enough
        return new FunctionApplication(this.position, this.func.reParse(state), this.argument.reParse(state));
    }

    prettyPrint(indentation: number, oneLine: boolean): string {
        // TODO
        let res = '( ' + this.func.prettyPrint(indentation, oneLine);
        res += ' ' + this.argument.prettyPrint(indentation, oneLine) + ' )';
        return res;
    }
}

export class Constant extends Expression implements Pattern {
    constructor(public position: Position, public token: Token) { super(); }

    matches(state: State, v: Value): [string, Value][] | undefined {
        // TODO
        throw new InternalInterpreterError(this.position, 'not yet implemented');
    }

    simplify(): Constant { return this; }

    reParse(state: State): Constant { return this; }

    prettyPrint(indentation: number, oneLine: boolean): string {
        // TODO
        return this.token.getText();
    }
}

export class ValueIdentifier extends Expression implements Pattern {
// op longvid or longvid
    constructor(public position: Position, public name: Token) { super(); }

    matches(state: State, v: Value): [string, Value][] | undefined {
        // TODO
        throw new InternalInterpreterError(this.position, 'not yet implemented');
    }

    simplify(): ValueIdentifier { return this; }

    reParse(state: State): ValueIdentifier { return this; }

    prettyPrint(indentation: number, oneLine: boolean): string {
        // TODO
        return this.name.getText();
    }
}

export class Record extends Expression implements Pattern {
// { lab = exp, ... } or { }
    // a record(pattern) is incomplete if it ends with '...'
    constructor(public position: Position, public complete: boolean,
                public entries: [string, (Pattern | Expression), (Type|undefined)][]) {
        super();
    }

    matches(state: State, v: Value): [string, Value][] | undefined {
        // TODO
        throw new InternalInterpreterError(this.position, 'not yet implemented');
    }

    simplify(): Record {
        let newEntries: [string, (Pattern | Expression), Type|undefined][] = [];
        for (let i = 0; i < this.entries.length; ++i) {
            let e: [string, (Pattern | Expression), Type|undefined] = this.entries[i];
            let nt: Type|undefined = e[2];
            if (nt !== undefined) {
                nt = nt.simplify();
            }
            newEntries.push([e[0], e[1].simplify(), nt]);
        }
        return new Record(this.position, this.complete, newEntries);
    }

    reParse(state: State): Record {
        let newEntries: [string, (Pattern | Expression), Type|undefined][] = [];
        for (let i = 0; i < this.entries.length; ++i) {
            let e: [string, (Pattern | Expression), Type|undefined] = this.entries[i];
            let nt: Type|undefined = e[2];
            newEntries.push([e[0], e[1].reParse(state), nt]);
        }
        return new Record(this.position, this.complete, newEntries);
    }

    prettyPrint(indentation: number, oneLine: boolean): string {
        // TODO
        let result: string = '{';
        let first: boolean = true;
        for (let i = 0; i < this.entries.length; ++i) {
            if (!first) {
                result += ', ';
            }
            first = false;
            result += this.entries[i][0] + ': '
                + this.entries[i][1].prettyPrint(indentation, oneLine);
        }
        if (!this.complete) {
            if (!first) {
                result += ', ';
            }
            result += '...';
        }
        return result + '}';
    }
}

export class LocalDeclarationExpression extends Expression {
// let dec in exp1; ...; expn end
// A sequential expression exp1; ... ; expn is represented as such, despite the potentially missing parentheses
    constructor(public position: Position, public declaration: Declaration, public expression: Expression) { super(); }

    simplify(): LocalDeclarationExpression {
        return new LocalDeclarationExpression(this.position, this.declaration.simplify(), this.expression.simplify());
    }

    reParse(state: State): LocalDeclarationExpression {
        let nstate = state.clone();
        return new LocalDeclarationExpression(this.position, this.declaration.reParse(nstate),
                                              this.expression.reParse(nstate));
    }

    prettyPrint(indentation: number, oneLine: boolean): string {
        // TODO
        let res = 'let ' + this.declaration.prettyPrint(indentation, oneLine);
        res += ' in ' + this.expression.prettyPrint(indentation, oneLine) + ' end';
        return res;
    }
}

export class InfixExpression extends Expression implements Pattern {
    // operators: (op, idx), to simplify simplify
    constructor(public expressions: (Expression|Pattern)[], public operators: [IdentifierToken, number][]) {
        super();
    }

    matches(state: State, v: Value): [string, Value][] | undefined {
        return this.simplify().matches(state, v);
    }

    simplify(): FunctionApplication {
        throw new InternalInterpreterError(this.position, 'Ouch, I\'m not fully parsed.');
    }

    reParse(state: State): FunctionApplication {
        let ops = this.operators;
        let exps = this.expressions;
        ops.sort(([a, p1], [b, p2]) => {
            let sta = state.getIdentifierInformation(a);
            let stb = state.getIdentifierInformation(b);
            if (sta.precedence > stb.precedence) {
                return -1;
            }
            if (sta.precedence < stb.precedence) {
                return 1;
            }
            if (sta.rightAssociative) {
                if (p1 < p2) {
                    return -1;
                }
                if (p1 > p2) {
                    return 1;
                }
            } else {
                if (p1 < p2) {
                    return 1;
                }
                if (p1 > p2) {
                    return -1;
                }
            }
            return 0;
        });

        // Using copy by reference to make this work whithout shrinking the array
        for (let i = 0; i < ops.length; ++i) {
            let left = exps[ops[i][1]];
            let right = exps[ops[i][1] + 1];
            let com = new FunctionApplication(ops[i][0].position,
                                              new ValueIdentifier(ops[i][0].position, ops[i][0]),
                                              new Tuple(ops[i][0].position, [left, right]));
            exps[ops[i][1]] = com;
            exps[ops[i][1] + 1] = com;
        }
        return <FunctionApplication> exps[0];
    }

    prettyPrint(indentation: number, oneLine: boolean): string {
        // TODO
        let res = '{{ ' + this.expressions[0].prettyPrint(indentation, oneLine);
        for (let i = 1; i < this.expressions.length; ++i) {
            res += ' ' + this.operators[i - 1][0].getText();
            res += ' ' + this.expressions[i].prettyPrint(indentation, oneLine);
        }
        return res += ' }}';
    }
}

// The following classes are derived forms. They will not be present in the simplified AST and do not implement
// checkSemantics/getType and evaluate.

// TODO move these constants to state
let falseConstant = new ValueIdentifier(0, new IdentifierToken('false', 0));
let trueConstant = new ValueIdentifier(0, new IdentifierToken('true', 0));
let nilConstant = new ValueIdentifier(0, new IdentifierToken('nil', 0));
let consConstant = new ValueIdentifier(0, new IdentifierToken('::', 0));

export class Conjunction extends Expression {
// leftOperand andalso rightOperand
    constructor(public position: Position, public leftOperand: Expression, public rightOperand: Expression) { super(); }

    simplify(): FunctionApplication {
        return new Conditional(this.position, this.leftOperand, this.rightOperand, falseConstant).simplify();
    }

    reParse(state: State): Conjunction {
        return new Conjunction(this.position, this.leftOperand.reParse(state), this.rightOperand.reParse(state));
    }

    prettyPrint(indentation: number, oneLine: boolean): string {
        // TODO
        return this.leftOperand.prettyPrint(indentation, oneLine) + ' andalso '
        + this.rightOperand.prettyPrint(indentation, oneLine);
    }
}

export class Disjunction extends Expression {
// leftOperand orelse rightOperand
    constructor(public position: Position, public leftOperand: Expression, public rightOperand: Expression) { super(); }

    simplify(): FunctionApplication {
        return new Conditional(this.position, this.leftOperand, trueConstant, this.rightOperand).simplify();
    }

    reParse(state: State): Disjunction {
        return new Disjunction(this.position, this.leftOperand.reParse(state), this.rightOperand.reParse(state));
    }

    prettyPrint(indentation: number, oneLine: boolean): string {
        // TODO
        return this.leftOperand.prettyPrint(indentation, oneLine) + ' orelse '
        + this.rightOperand.prettyPrint(indentation, oneLine);
    }
}

export class Tuple extends Expression implements Pattern {
// (exp1, ..., expn), n > 1
    constructor(public position: Position, public expressions: (Pattern | Expression)[]) { super(); }

    matches(state: State, v: Value): [string, Value][] | undefined {
        return this.simplify().matches(state, v);
    }

    simplify(): Record {
        let entries: [string, (Pattern | Expression), Type|undefined][] = [];
        for (let i = 0; i < this.expressions.length; ++i) {
            entries[String(i + 1)] = [this.expressions[i].simplify(), undefined];
        }
        return new Record(this.position, true, entries);
    }

    reParse(state: State): Tuple {
        let entries: (Pattern | Expression)[] = [];
        for (let i = 0; i < this.expressions.length; ++i) {
            entries.push(this.expressions[i].reParse(state));
        }
        return new Tuple(this.position, entries);
    }

    prettyPrint(indentation: number, oneLine: boolean): string {
        // TODO
        let res = '( ';
        for (let i = 0; i < this.expressions.length; ++i) {
            if (i > 0) {
                res += ', ';
            }
            res += this.expressions[i].prettyPrint(indentation, oneLine);
        }
        return res + ' )';
    }
}

export class List extends Expression implements Pattern {
// [exp1, ..., expn]
    constructor(public position: Position, public expressions: (Pattern | Expression)[]) { super(); }

    matches(state: State, v: Value): [string, Value][] | undefined {
        return this.simplify().matches(state, v);
    }

    simplify(): FunctionApplication {
        let res: Expression|Pattern = nilConstant;
        for (let i = this.expressions.length - 1; i >= 0; --i) {
            let pair = new Tuple(-1, [this.expressions[i], res]).simplify();
            res = new FunctionApplication(-1, consConstant, pair);
        }
        return <FunctionApplication> res;
    }

    reParse(state: State): List {
        let entries: (Pattern | Expression)[] = [];
        for (let i = 0; i < this.expressions.length; ++i) {
            entries.push(this.expressions[i].reParse(state));
        }
        return new List(this.position, entries);
    }

    prettyPrint(indentation: number, oneLine: boolean): string {
        // TODO
        let res = '[ ';
        for (let i = 0; i < this.expressions.length; ++i) {
            if (i > 0) {
                res += ', ';
            }
            res += this.expressions[i].prettyPrint(indentation, oneLine);
        }
        return res + ' ]';
    }
}

export class Sequence extends Expression {
// (exp1; ...; expn), n >= 2
    constructor(public position: Position, public expressions: Expression[]) { super(); }

    simplify(): FunctionApplication {
        let pos = this.expressions.length - 1;
        let match = new Match(-1, [[new Wildcard(0), this.expressions[pos]]]);
        let res = new CaseAnalysis(-1, this.expressions[pos - 1], match);
        for (let i = pos - 2; i >= 0; --i) {
            match = new Match(-1, [[new Wildcard(0), res]]);
            res = new CaseAnalysis(-1, this.expressions[i], match);
        }
        return res.simplify();
    }

    reParse(state: State): Sequence {
        let entries: Expression[] = [];
        for (let i = 0; i < this.expressions.length; ++i) {
            entries.push(this.expressions[i].reParse(state));
        }
        return new Sequence(this.position, entries);
    }

    prettyPrint(indentation: number, oneLine: boolean): string {
        // TODO
        let res = '( ';
        for (let i = 0; i < this.expressions.length; ++i) {
            if (i > 0) {
                res += '; ';
            }
            res += this.expressions[i].prettyPrint(indentation, oneLine);
        }
        return res + ' )';
    }
}

export class RecordSelector extends Expression {
// #label record
    constructor(public position: Position, public label: Token) { super(); }

    simplify(): Lambda {
        // TODO Token.text does not always contain the required text ~> .text() ?
        return new Lambda(this.position, new Match(-1, [[
            new Record(-1, false, [[this.label.text,
                new ValueIdentifier(-1, new IdentifierToken('__rs', -1)), undefined]]),
            new ValueIdentifier(-1, new IdentifierToken('__rs', -1))]]));
    }

    reParse(state: State): RecordSelector {
        return this;
    }

    prettyPrint(indentation: number, oneLine: boolean): string {
        // TODO
        return '#' + this.label.getText();
    }
}

export class CaseAnalysis extends Expression {
// case expression of match
    constructor(public position: Position, public expression: Expression, public match: Match) { super(); }

    simplify(): FunctionApplication {
        return new FunctionApplication(this.position, new Lambda(this.position, this.match.simplify()),
            this.expression.simplify());
    }

    reParse(state: State): CaseAnalysis {
        return new CaseAnalysis(this.position, this.expression.reParse(state), this.match.reParse(state));
    }

    prettyPrint(indentation: number, oneLine: boolean): string {
        // TODO
        let res = 'case ' + this.expression.prettyPrint(indentation, oneLine);
        res += ' of ' + this.match.prettyPrint(indentation, oneLine);
        return res;
    }
}

export class Conditional extends Expression {
// if condition then consequence else alternative
    constructor(public position: Position, public condition: Expression, public consequence: Expression,
                public alternative: Expression) { super(); }

    simplify(): FunctionApplication {
        let match: Match = new Match(this.position, [[trueConstant, this.consequence],
                                                    [falseConstant, this.alternative]]);
        return new CaseAnalysis(this.position, this.condition, match).simplify();
    }

    reParse(state: State): Conditional {
        return new Conditional(this.position, this.condition.reParse(state), this.consequence.reParse(state),
                               this.alternative.reParse(state));
    }

    prettyPrint(indentation: number, oneLine: boolean): string {
        // TODO
        let res = 'if ' + this.condition.prettyPrint(indentation, oneLine);
        res += ' then ' + this.consequence.prettyPrint(indentation, oneLine);
        res += ' else ' + this.alternative.prettyPrint(indentation, oneLine);
        return res;
    }
}
