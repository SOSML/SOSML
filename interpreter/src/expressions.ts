import { FunctionType, PrimitiveType, PrimitiveTypes, RecordType, Type } from './types';
import {
    Token, IdentifierToken, ConstantToken, IntegerConstantToken, RealConstantToken, NumericToken,
    WordConstantToken, CharacterConstantToken, StringConstantToken
} from './lexer';
import { Declaration } from './declarations';
import { State } from './state';
import { InternalInterpreterError, Position, SemanticError } from './errors';
import { Value } from './values';


export abstract class Expression {
    type: Type | undefined;
    position: Position;

    // It is not necessary to call checkStaticSemantics on Expressions. getType may be called instead.
    checkStaticSemantics(state: State): void {
        this.getType(state);
    }

    getType(state: State): Type {
        if (!this.type) {
            this.type = this.computeType(state);
        }
        return this.type;
    }

    computeType(state: State): Type {
        throw new InternalInterpreterError(this.position, 'called computeType on derived form');
    }

    getValue(state: State): Value {
        throw new InternalInterpreterError(this.position, 'called getValue on derived form');
    }

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
        // TODO: move to subclasses
        throw new InternalInterpreterError(this.position, 'not yet implemented');
    }

    abstract simplify(): Expression;
}


export interface Pattern {
    // Returns which bindings would be created by matching v to this Pattern,
    // or undefined, if v does not match this Pattern.
    position: number;
    matches(state: State, v: Value): [string, Value][] | undefined;
    simplify(): PatternExpression;
    prettyPrint(indentation: number, oneLine: boolean): string;
}

export type PatternExpression = Pattern & Expression;

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

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
        return '_';
    }
}

export class LayeredPattern extends Expression implements Pattern {
// <op> identifier <:type> as pattern
    constructor(public position: Position, public identifier: IdentifierToken, public typeAnnotation: Type | undefined,
                public pattern: Expression
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

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
        // TODO
        throw new InternalInterpreterError(this.position, 'not yet implemented');
    }
}


export class Match {
// pat => exp or pat => exp | match
    patternType: Type;
    returnType: Type;

    constructor(public position: Position, public matches: [PatternExpression, Expression][]) { }

    checkStaticSemantics(state: State) {
        // TODO
    }

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
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

    getValue(state: State, matchWith: Value): Value {
        // TODO
        throw new InternalInterpreterError(this.position, 'not yet implemented');
    }

    simplify(): Match {
        let newMatches: [PatternExpression, Expression][] = [];
        for (let i = 0; i < this.matches.length; ++i) {
            let m: [PatternExpression, Expression] = this.matches[i];
            newMatches.push([m[0].simplify(), m[1].simplify()]);
        }
        return new Match(this.position, newMatches);
    }
}

export class TypedExpression extends Expression implements Pattern {
// expression: type (L)
    constructor(public position: Position, public expression: Expression,
                public typeAnnotation: Type) { super(); }

    matches(state: State, v: Value): [string, Value][] | undefined {
        // TODO
        throw new InternalInterpreterError(this.position, 'not yet implemented');
    }

    computeType(state: State): Type {
        let result: Type = this.expression.getType(state);
        // TODO: check semantics of typeAnnotation
        // TODO: equals is not correct here. result must generalise typeAnnotation
        if (!result.equals(this.typeAnnotation)) {
            throw new SemanticError(this.position,
                'expression cannot have explicit type ' + this.typeAnnotation.toString());
        }
        return this.typeAnnotation;
    }

    simplify(): TypedExpression {
        return new TypedExpression(this.position, this.expression.simplify(), this.typeAnnotation.simplify());
    }

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
        // TODO
        let res = '( ' + this.expression.prettyPrint(indentation, oneLine);
        res += ': ' + this.typeAnnotation.prettyPrint();
        return res + ' )';
    }
}

export class HandleException extends Expression {
// expression handle match
    constructor(public position: Position, public expression: Expression, public match: Match) { super(); }

    simplify(): HandleException {
        return new HandleException(this.position, this.expression.simplify(), this.match.simplify());
    }

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
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

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
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

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
        // TODO
        return '( fn ' + this.match.prettyPrint(indentation, oneLine) + ' )';
    }
}

// May represent either a function application or a constructor with an argument
export class FunctionApplication extends Expression implements Pattern {
// function argument
    constructor(public position: Position,
                public func: Expression,
                public argument: Expression) { super(); }

    matches(state: State, v: Value): [string, Value][] | undefined {
        // TODO
        throw new InternalInterpreterError(this.position, 'not yet implemented');
    }

    computeType(state: State): Type {
        let f: Type = this.func.getType(state);
        let arg: Type = this.argument.getType(state);
        if (f instanceof FunctionType) {
            f.parameterType.unify(arg, state, this.argument.position);
            return f.returnType;
        } else {
            // TODO: do we need a special case for constructors?
            throw new SemanticError(this.func.position, this.func.prettyPrint() + ' is not a function.');
        }
    }

    simplify(): FunctionApplication {
        return new FunctionApplication(this.position, this.func.simplify(), this.argument.simplify());
    }

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
        // TODO
        let res = this.func.prettyPrint(indentation, oneLine);
        res += ' ' + this.argument.prettyPrint(indentation, oneLine);
        return res;
    }
}

export class Constant extends Expression implements Pattern {
    constructor(public position: Position, public token: ConstantToken) { super(); }

    matches(state: State, v: Value): [string, Value][] | undefined {
        // TODO
        throw new InternalInterpreterError(this.position, 'not yet implemented');
    }

    computeType(state: State): Type {
        if (this.token instanceof IntegerConstantToken || this.token instanceof NumericToken) {
            return new PrimitiveType(PrimitiveTypes.int);
        } else if (this.token instanceof RealConstantToken) {
            return new PrimitiveType(PrimitiveTypes.real);
        } else if (this.token instanceof WordConstantToken) {
            return new PrimitiveType(PrimitiveTypes.word);
        } else if (this.token instanceof CharacterConstantToken) {
            return new PrimitiveType(PrimitiveTypes.char);
        } else if (this.token instanceof StringConstantToken) {
            return new PrimitiveType(PrimitiveTypes.string);
        } else {
            throw new InternalInterpreterError(this.token.position, 'invalid Constant ' + this.prettyPrint());
        }
    }

    simplify(): Constant { return this; }

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
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

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
        // TODO
        return this.name.getText();
    }
}

export class Record extends Expression implements Pattern {
// { lab = exp, ... } or { }
    // a record(pattern) is incomplete if it ends with '...'
    constructor(public position: Position, public complete: boolean,
                public entries: [string, Expression][]) {
        super();
    }

    matches(state: State, v: Value): [string, Value][] | undefined {
        // TODO
        throw new InternalInterpreterError(this.position, 'not yet implemented');
    }

    computeType(state: State): RecordType {
        let e: Map<string, Type> = new Map<string, Type>();
        for (let i: number = 0; i < this.entries.length; ++i) {
            let name: string = this.entries[i][0];
            let exp: Expression = this.entries[i][1];
            if (e.has(name)) {
                throw new SemanticError(this.position,
                    'Label ' + name + ' occurs more than once in record expression.');
            }
            e.set(name, exp.getType(state));
        }
        return new RecordType(e, this.complete);
    }

    simplify(): Record {
        let newEntries: [string, Expression][] = [];
        for (let i = 0; i < this.entries.length; ++i) {
            let e: [string, Expression] = this.entries[i];
            newEntries.push([e[0], e[1].simplify()]);
        }
        return new Record(this.position, this.complete, newEntries);
    }

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
        // TODO
        let result: string = '{';
        let first: boolean = true;
        for (let i = 0; i < this.entries.length; ++i) {
            if (!first) {
                result += ', ';
            }
            first = false;
            result += this.entries[i][0] + ' = '
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

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
        // TODO
        let res = 'let ' + this.declaration.prettyPrint(indentation, oneLine);
        res += ' in ' + this.expression.prettyPrint(indentation, oneLine) + ' end';
        return res;
    }
}

export class InfixExpression extends Expression implements Pattern {
    // operators: (op, idx), to simplify simplify
    constructor(public expressions: Expression[], public operators: [IdentifierToken, number][]) {
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
            let sta = state.lookupInfixStatus(a.text);
            let stb = state.lookupInfixStatus(b.text);
            if (sta.precedence > stb.precedence) {
                return -1;
            }
            if (sta.precedence < stb.precedence) {
                return 1;
            }
            if (sta.rightAssociative) {
                if (p1 > p2) {
                    return -1;
                }
                if (p1 < p2) {
                    return 1;
                }
            } else {
                if (p1 > p2) {
                    return 1;
                }
                if (p1 < p2) {
                    return -1;
                }
            }
            return 0;
        });

        // Using copy by reference to make this work whithout shrinking the array
        let last = 0;
        for (let i = 0; i < ops.length; ++i) {
            let left = exps[ops[i][1]];
            let right = exps[ops[i][1] + 1];
            let com = new FunctionApplication(ops[i][0].position,
                                              new ValueIdentifier(ops[i][0].position, ops[i][0]),
                                              new Tuple(ops[i][0].position, [left, right]));
            exps[ops[i][1]] = com;
            exps[ops[i][1] + 1] = com;
            last = ops[i][1];
        }
        return <FunctionApplication> exps[last];
    }

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
        // TODO
        let res = '{{ ' + this.expressions[0].prettyPrint(indentation, oneLine);
        for (let i = 1; i < this.expressions.length; ++i) {
            res += ' ' + this.operators[i - 1][0].getText();
            res += ' ' + this.expressions[i].prettyPrint(indentation, oneLine);
        }
        return res + ' }}';
    }
}

// The following classes are derived forms. They will not be present in the simplified AST and do not implement
// checkSemantics/getType

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

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
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

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
        // TODO
        return this.leftOperand.prettyPrint(indentation, oneLine) + ' orelse '
        + this.rightOperand.prettyPrint(indentation, oneLine);
    }
}

export class Tuple extends Expression implements Pattern {
// (exp1, ..., expn), n > 1
    constructor(public position: Position, public expressions: Expression[]) { super(); }

    matches(state: State, v: Value): [string, Value][] | undefined {
        return this.simplify().matches(state, v);
    }

    simplify(): Record {
        let entries: [string, Expression][] = [];
        for (let i = 0; i < this.expressions.length; ++i) {
            entries.push(['' + (i + 1), this.expressions[i].simplify()]);
        }
        return new Record(this.position, true, entries);
    }

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
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
    constructor(public position: Position, public expressions: Expression[]) { super(); }

    matches(state: State, v: Value): [string, Value][] | undefined {
        return this.simplify().matches(state, v);
    }

    simplify(): PatternExpression {
        let res: PatternExpression = nilConstant;
        for (let i = this.expressions.length - 1; i >= 0; --i) {
            let pair = new Tuple(-1, [this.expressions[i], res]).simplify();
            res = new FunctionApplication(-1, consConstant, pair);
        }
        return res;
    }

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
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

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
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
    constructor(public position: Position, public label: IdentifierToken | NumericToken) { super(); }

    simplify(): Lambda {
        return new Lambda(this.position, new Match(-1, [[
            new Record(-1, false, [[this.label.text, new ValueIdentifier(-1, new IdentifierToken('__rs', -1))]]),
            new ValueIdentifier(-1, new IdentifierToken('__rs', -1))]]));
    }

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
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

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
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

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
        // TODO
        let res = 'if ' + this.condition.prettyPrint(indentation, oneLine);
        res += ' then ' + this.consequence.prettyPrint(indentation, oneLine);
        res += ' else ' + this.alternative.prettyPrint(indentation, oneLine);
        return res;
    }
}
