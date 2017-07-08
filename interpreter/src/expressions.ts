import { Type } from './types';
import { Token, IdentifierToken, KeywordToken } from './lexer';
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

    prettyPrint(indentation: number = 0, oneLine: boolean = false): string {
        // TODO: move to subclasses
        throw new InternalInterpreterError(this.position, 'not yet implemented');
    }

    abstract simplify(): Expression;
    abstract reParse(state: State): Expression;
}


export interface Pattern {
    // Returns which bindings would be created by matching v to this Pattern,
    // or undefined, if v does not match this Pattern.
    matches(state: State, v: Value): [string, Value][] | undefined;
    simplify(): Pattern;
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
        throw new InternalInterpreterError(this.position, 'Tried re-parsing a pattern.');
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
        throw new InternalInterpreterError(this.position, 'Tried re-parsing a pattern.');
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

    prettyPrint(indentation: number = 0, oneLine: boolean = false): string {
        // TODO
        throw new InternalInterpreterError(this.position, 'not yet implemented');
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
        for (let i: number = 0; i < this.matches.length; ++i) {
            let m: [Pattern, Expression] = this.matches[i];
            newMatches.push([m[0].simplify(), m[1].simplify()]);
        }
        return new Match(this.position, newMatches);
    }

    reParse(state: State): Match {
        throw new InternalInterpreterError(this.position, 'Nyi\'an.');
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
        throw new InternalInterpreterError(this.position, 'Nyi\'an.');
    }
}

export class HandleException extends Expression {
// expression handle match
    constructor(public position: Position, public expression: Expression, public match: Match) { super(); }

    simplify(): HandleException {
        return new HandleException(this.position, this.expression.simplify(), this.match.simplify());
    }

    reParse(state: State): HandleException {
        throw new InternalInterpreterError(this.position, 'Nyi\'an.');
    }
}

export class RaiseException extends Expression {
// raise expression
    constructor(public position: Position, public expression: Expression) { super(); }

    simplify(): RaiseException {
        return new RaiseException(this.position, this.expression.simplify());
    }

    reParse(state: State): RaiseException {
        throw new InternalInterpreterError(this.position, 'Nyi\'an.');
    }
}

export class Lambda extends Expression {
// fn match
    constructor(public position: Position, public match: Match) { super(); }

    simplify(): Lambda {
        return new Lambda(this.position, this.match.simplify());
    }

    reParse(state: State): Lambda {
        throw new InternalInterpreterError(this.position, 'Nyi\'an.');
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
        throw new InternalInterpreterError(this.position, 'Nyi\'an.');
    }
}

export class Constant extends Expression implements Pattern {
    constructor(public position: Position, public token: Token) { super(); }

    matches(state: State, v: Value): [string, Value][] | undefined {
        // TODO
        throw new InternalInterpreterError(this.position, 'not yet implemented');
    }

    simplify(): Constant { return this; }

    reParse(state: State): Constant {
        throw new InternalInterpreterError(this.position, 'Nyi\'an.');
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

    reParse(state: State): ValueIdentifier {
        throw new InternalInterpreterError(this.position, 'Nyi\'an.');
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
        for (let i: number = 0; i < this.entries.length; ++i) {
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
        throw new InternalInterpreterError(this.position, 'Nyi\'an.');
    }
}

export class LocalDeclarationExpression extends Expression {
// let dec in exp1; ...; expn end
// A sequential expression exp1; ... ; expn is represented as such, despite the potentially missing parentheses
    constructor(public position: Position, public declaration: Declaration, public expression: Expression) { super(); }

    simplify(): LocalDeclarationExpression {
        // TODO: should be
        // return new LocalDeclaration(this.position, this.declaration.simplify(), this.expression.simplify());
        return new LocalDeclarationExpression(this.position, this.declaration, this.expression.simplify());
    }

    reParse(state: State): LocalDeclarationExpression {
        // TODO this stuff here is work
        throw new InternalInterpreterError(this.position, 'Nyi\'an.');
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
}

// The following classes are derived forms. They will not be present in the simplified AST and do not implement
// checkSemantics/getType and evaluate.

let falseConstant: Constant = new Constant(0, new KeywordToken('false', 0));
let trueConstant: Constant = new Constant(0, new KeywordToken('true', 0));

export class Conjunction extends Expression {
// leftOperand andalso rightOperand
    constructor(public position: Position, public leftOperand: Expression, public rightOperand: Expression) { super(); }

    simplify(): FunctionApplication {
        return new Conditional(this.position, this.leftOperand, this.rightOperand, falseConstant).simplify();
    }

    reParse(state: State): Conjunction {
        throw new InternalInterpreterError(this.position, 'Nyi\'an.');
    }
}

export class Disjunction extends Expression {
// leftOperand orelse rightOperand
    constructor(public position: Position, public leftOperand: Expression, public rightOperand: Expression) { super(); }

    simplify(): FunctionApplication {
        return new Conditional(this.position, this.leftOperand, trueConstant, this.rightOperand).simplify();
    }

    reParse(state: State): Disjunction {
        throw new InternalInterpreterError(this.position, 'Nyi\'an.');
    }
}

export class Tuple extends Expression implements Pattern {
// (exp1, ..., expn), n > 1
    constructor(public position: Position, public expressions: (Pattern | Expression)[]) { super(); }

    matches(state: State, v: Value): [string, Value][] | undefined {
        throw new InternalInterpreterError(this.position, 'called matches on derived form');
    }

    simplify(): Record {
        let entries: [string, (Pattern | Expression), Type|undefined][] = [];
        for (let i: number = 0; i < this.expressions.length; ++i) {
            entries[String(i + 1)] = [this.expressions[i].simplify(), undefined];
        }
        return new Record(this.position, true, entries);
    }

    reParse(state: State): Tuple {
        throw new InternalInterpreterError(this.position, 'Nyi\'an.');
    }
}

export class List extends Expression implements Pattern {
// [exp1, ..., expn]
    constructor(public position: Position, public expressions: (Pattern | Expression)[]) { super(); }

    matches(state: State, v: Value): [string, Value][] | undefined {
        throw new InternalInterpreterError(this.position, 'called matches on derived form');
    }

    simplify(): FunctionApplication {
        // TODO
        throw new InternalInterpreterError(this.position, 'not yet implemented');
    }

    reParse(state: State): List {
        throw new InternalInterpreterError(this.position, 'Nyi\'an.');
    }
}

export class Sequence extends Expression {
// (exp1; ...; expn), n >= 2
    constructor(public position: Position, public expressions: Expression[]) { super(); }

    simplify(): FunctionApplication {
        // TODO
        throw new InternalInterpreterError(this.position, 'not yet implemented');
    }

    reParse(state: State): Sequence {
        throw new InternalInterpreterError(this.position, 'Nyi\'an.');
    }
}

export class RecordSelector extends Expression {
// #label record
    constructor(public position: Position, public label: Token) { super(); }

    simplify(): FunctionApplication {
        // TODO
        throw new InternalInterpreterError(this.position, 'not yet implemented');
    }

    reParse(state: State): RecordSelector {
        throw new InternalInterpreterError(this.position, 'Nyi\'an.');
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
        throw new InternalInterpreterError(this.position, 'Nyi\'an.');
    }
}

export class Conditional extends Expression {
// if condition then ifTrue else ifFalse
    constructor(public position: Position, public condition: Expression, public ifTrue: Expression,
                public ifFalse: Expression) { super(); }

    simplify(): FunctionApplication {
        let match: Match = new Match(this.position, [[trueConstant, this.ifTrue], [falseConstant, this.ifFalse]]);
        return new CaseAnalysis(this.position, this.condition, match).simplify();
    }

    reParse(state: State): Conditional {
        throw new InternalInterpreterError(this.position, 'Nyi\'an.');
    }
}
