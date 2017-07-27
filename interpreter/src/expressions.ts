import { PrimitiveType, /* RecordType, */ Type, TypeVariable } from './types';
import { Declaration, ValueBinding, ValueDeclaration } from './declarations';
import { Token, IdentifierToken, ConstantToken, IntegerConstantToken, RealConstantToken,
         NumericToken, WordConstantToken, CharacterConstantToken,
         StringConstantToken } from './lexer';
import { State, RebindStatus } from './state';
import { InternalInterpreterError, Position, ElaborationError, EvaluationError } from './errors';
import { Value, CharValue, StringValue, Integer, Real, Word, ValueConstructor,
         ExceptionConstructor, PredefinedFunction, RecordValue, FunctionValue,
         ExceptionValue, ConstructedValue } from './values';
import { ParserError } from './parser';

export abstract class Expression {
    position: Position;

    getType(state: State): Type[] {
        throw new InternalInterpreterError(this.position, 'Called "getType" on a derived form.');
    }

    // Computes the value of an expression, returns [computed value, is thrown exception]
    compute(state: State): [Value, boolean] {
        throw new InternalInterpreterError(this.position, 'Called "getValue" on a derived form.');
    }

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
        throw new InternalInterpreterError(this.position, 'I don\'t want to be printed.');
    }

    abstract simplify(): Expression;
}


export interface Pattern {
    // Returns which bindings would be created by matching v to this Pattern,
    // or undefined, if v does not match this Pattern.
    position: Position;
    getType(state: State): Type[];
    matches(state: State, v: Value): [string, Value][] | undefined;
    simplify(): PatternExpression;
    prettyPrint(indentation: number, oneLine: boolean): string;
}

export type PatternExpression = Pattern & Expression;

export class Constant extends Expression implements Pattern {
    constructor(public position: Position, public token: ConstantToken) { super(); }

    matches(state: State, v: Value): [string, Value][] | undefined {
        if (this.compute(state)[0].equals(v)) {
            return [];
        } else {
            return undefined;
        }
    }

    getType(state: State): Type[] {
        if (this.token instanceof IntegerConstantToken || this.token instanceof NumericToken) {
            return [new PrimitiveType('int')];
        } else if (this.token instanceof RealConstantToken) {
            return [new PrimitiveType('real')];
        } else if (this.token instanceof WordConstantToken) {
            return [new PrimitiveType('word')];
        } else if (this.token instanceof CharacterConstantToken) {
            return [new PrimitiveType('char')];
        } else if (this.token instanceof StringConstantToken) {
            return [new PrimitiveType('string')];
        } else {
            throw new InternalInterpreterError(this.token.position,
                '"' + this.prettyPrint() + '" does not seem to be a valid constant.');
        }
    }

    simplify(): Constant { return this; }

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
        return this.token.getText();
    }

    compute(state: State): [Value, boolean] {
        if (this.token instanceof IntegerConstantToken || this.token instanceof NumericToken) {
            return [new Integer((<IntegerConstantToken | NumericToken> this.token).value), false];
        } else if (this.token instanceof RealConstantToken) {
            return [new Real((<RealConstantToken> this.token).value), false];
        } else if (this.token instanceof WordConstantToken) {
            return [new Word((<WordConstantToken> this.token).value), false];
        } else if (this.token instanceof CharacterConstantToken) {
            return [new CharValue((<CharacterConstantToken> this.token).value), false];
        } else if (this.token instanceof StringConstantToken) {
            return [new StringValue((<StringConstantToken> this.token).value), false];
        }
        throw new EvaluationError(this.token.position, 'You sure that this is a constant?');
    }
}

export class ValueIdentifier extends Expression implements Pattern {
// op longvid or longvid
    constructor(public position: Position, public name: Token) { super(); }

    matches(state: State, v: Value): [string, Value][] | undefined {
        let res = state.getDynamicValue(this.name.getText());
        if (res === undefined || state.getRebindStatus(this.name.getText()) === RebindStatus.Allowed) {
            return [[this.name.getText(), v]];
        }
        if (v.equals(res)) {
            return [];
        }
        return undefined;
    }

    simplify(): ValueIdentifier { return this; }

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
        // TODO
        return this.name.getText();
    }

    getType(state: State): Type[] {
        // TODO
        throw new InternalInterpreterError(this.position, 'nyi\'an :3');
    }

    compute(state: State): [Value, boolean] {
        let res = state.getDynamicValue(this.name.getText());
        if (res === undefined) {
            throw new EvaluationError(this.position, 'Unbound value identifier "'
                + this.name.getText() + '".');
        }

        if (res instanceof ValueConstructor
            && (<ValueConstructor> res).numArgs === 0) {
            res = (<ValueConstructor> res).construct();
        }
        if (res instanceof ExceptionConstructor
            && (<ExceptionConstructor> res).numArgs === 0) {
            res = (<ExceptionConstructor> res).construct();
        }

        return [res, false];
    }
}

export class Record extends Expression implements Pattern {
// { lab = exp, ... } or { }
// a record(pattern) is incomplete if it ends with '...'
    constructor(public position: Position, public complete: boolean,
                public entries: [string, Expression|PatternExpression][]) {
        super();
        this.entries.sort();
        for (let i = 1; i < this.entries.length; ++i) {
            if (this.entries[i][0] === this.entries[i - 1][0]) {
                throw new ElaborationError(this.position,
                    'Label "' + this.entries[i][0] + '" occurs more than once in the same record.');
            }
        }
    }

    matches(state: State, v: Value): [string, Value][] | undefined {
        if (!(v instanceof RecordValue)) {
            return undefined;
        }
        if (this.complete && this.entries.length !== (<RecordValue> v).entries.size) {
            return undefined;
        }

        let res: [string, Value][] = [];

        for (let i = 0; i < this.entries.length; ++i) {
            if (!(<RecordValue> v).hasValue(this.entries[i][0])) {
                return undefined;
            }
            let cur = (<PatternExpression> this.entries[i][1]).matches(
                state, (<RecordValue> v).getValue(this.entries[i][0]));
            if (cur === undefined) {
                return cur;
            }
            for (let j = 0; j < cur.length; ++j) {
                res.push(cur[j]);
            }
        }
        return res;
    }

    getType(state: State): Type[] {
        throw new Error('nyian');
        /* let e: Map<string, Type> = new Map<string, Type>();
        for (let i: number = 0; i < this.entries.length; ++i) {
            let name: string = this.entries[i][0];
            let exp: Expression = this.entries[i][1];
            if (e.has(name)) {
                throw new ElaborationError(this.position,
                    'Label "' + name + '" occurs more than once in the same record.');
            }
            e.set(name, exp.getType(state));
        }
        return [new RecordType(e, this.complete)]; */
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

    compute(state: State): [Value, boolean] {
        let nentr = new Map<string, Value>();
        for (let i = 0; i < this.entries.length; ++i) {
            let res = this.entries[i][1].compute(state);
            if (res[1]) {
                // Computing some expression failed
                return res;
            }
            nentr = nentr.set(this.entries[i][0], res[0]);
        }
        return [new RecordValue(nentr), false];
    }
}

export class LocalDeclarationExpression extends Expression {
// let dec in exp1; ...; expn end
// A sequential expression exp1; ... ; expn is represented as such,
// despite the potentially missing parentheses
    constructor(public position: Position, public declaration: Declaration, public expression: Expression) { super(); }

    simplify(): LocalDeclarationExpression {
        return new LocalDeclarationExpression(this.position, this.declaration.simplify(), this.expression.simplify());
    }

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
        let res = 'let ' + this.declaration.prettyPrint(indentation, oneLine);
        res += ' in ' + this.expression.prettyPrint(indentation, oneLine) + ' end';
        return res;
    }

    getType(state: State): Type[] {
        // TODO
        throw new InternalInterpreterError(this.position, 'nyi\'an :3');
    }

    compute(state: State): [Value, boolean] {
        let nstate = state.getNestedState(false, state.id);
        let res = this.declaration.evaluate(nstate);
        if (res[1]) {
            return [<Value> res[2], true];
        }
        return this.expression.compute(res[0]);
    }
}

export class TypedExpression extends Expression implements Pattern {
// expression: type (L)
    constructor(public position: Position, public expression: Expression,
                public typeAnnotation: Type) { super(); }

    matches(state: State, v: Value): [string, Value][] | undefined {
        return (<PatternExpression> this.expression).matches(state, v);
    }

    getType(state: State): Type[] {
        // TODO
        throw new InternalInterpreterError(this.position, 'nyi\'an :3');
    }

    simplify(): TypedExpression {
        return new TypedExpression(this.position,
            this.expression.simplify(), this.typeAnnotation.simplify());
    }

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
        let res = '( ' + this.expression.prettyPrint(indentation, oneLine);
        res += ': ' + this.typeAnnotation.prettyPrint();
        return res + ' )';
    }

    compute(state: State): [Value, boolean] {
        return this.expression.compute(state);
    }
}

// May represent either a function application or a constructor with an argument
export class FunctionApplication extends Expression implements Pattern {
// function argument
    constructor(public position: Position,
                public func: Expression,
                public argument: Expression|PatternExpression) { super(); }

    matches(state: State, v: Value): [string, Value][] | undefined {
        if (v instanceof FunctionValue) {
            throw new EvaluationError(this.position,
                'You simply cannot match function values.');
        } else if (v instanceof ConstructedValue) {
            if (this.func instanceof ValueIdentifier
                && (<ValueIdentifier> this.func).name.getText()
                === (<ConstructedValue> v).constructorName) {
                if ((<ConstructedValue> v).argument !== undefined) {
                    return (<PatternExpression> this.argument).matches(
                        state, <Value> (<ConstructedValue> v).argument);
                }
                return [];
            }
            return undefined;
        } else if (v instanceof ExceptionValue) {
            if (this.func instanceof ValueIdentifier
                && (<ValueIdentifier> this.func).name.getText()
                    === (<ExceptionValue> v).constructorName) {
                if ((<ExceptionValue> v).argument !== undefined) {
                    return (<PatternExpression> this.argument).matches(
                        state, <Value> (<ExceptionValue> v).argument);
                }
                return [];
            }
            return undefined;
        } else if (v instanceof PredefinedFunction) {
            throw new EvaluationError(this.position,
                'You simply cannot match predefined functions.');
        }
        throw new EvaluationError(this.position, 'Help me, I\'m broken. ('
            + v.constructor.name + ').' );
    }

    getType(state: State): Type[] {
        /* let f: Type = this.func.getType(state);
        let arg: Type = this.argument.getType(state);
        if (f instanceof FunctionType) {
            f.parameterType.unify(arg, state, this.argument.position);
            return f.returnType;
        } else { */
            throw new ElaborationError(this.func.position, this.func.prettyPrint() + ' is not a function.');
        // }
    }

    simplify(): FunctionApplication {
        return new FunctionApplication(this.position, this.func.simplify(), this.argument.simplify());
    }

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
        let res = '( ' +  this.func.prettyPrint(indentation, oneLine);
        res += ' ' + this.argument.prettyPrint(indentation, oneLine);
        return res + ' )';
    }

    compute(state: State): [Value, boolean] {
        let funcVal = this.func.compute(state);
        if (funcVal[1]) {
            // computing the function failed
            return funcVal;
        }
        let argVal = this.argument.compute(state);
        if (argVal[1]) {
            return argVal;
        }
        if (funcVal[0] instanceof FunctionValue) {
            return (<FunctionValue> funcVal[0]).compute(argVal[0]);
        } else if (funcVal[0] instanceof ValueConstructor) {
            return [(<ValueConstructor> funcVal[0]).construct(argVal[0]), false];
        } else if (funcVal[0] instanceof ExceptionConstructor) {
            return [(<ExceptionConstructor> funcVal[0]).construct(argVal[0]), false];
        } else if (funcVal[0] instanceof PredefinedFunction) {
            return (<PredefinedFunction> funcVal[0]).apply(argVal[0]);
        }
        throw new EvaluationError(this.position, 'Cannot evaluate the function "'
            + this.func.prettyPrint() + '" (' + funcVal[0].constructor.name + ').');
    }
}

export class HandleException extends Expression {
// expression handle match
    constructor(public position: Position, public expression: Expression, public match: Match) {
        super();
    }

    simplify(): HandleException {
        return new HandleException(this.position, this.expression.simplify(), this.match.simplify());
    }

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
        let res = '( ( ' + this.expression.prettyPrint(indentation, oneLine) + ' )';
        res += ' handle ' + this.match.prettyPrint(indentation, oneLine) + ' )';
        return res;
    }

    getType(state: State): Type[] {
        // TODO
        throw new InternalInterpreterError(this.position, 'nyi\'an :3');
    }

    compute(state: State): [Value, boolean] {
        let res = this.expression.compute(state);
        if (res[1]) {
            let next = this.match.compute(state, res[0]);
            if (!next[1] || !next[0].equals(new ExceptionValue('Match', undefined, 0))) {
                // Exception got handled
                return next;
            }
        }
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
        return 'raise ' + this.expression.prettyPrint(indentation, oneLine);
    }

    getType(state: State): Type[] {
        // TODO
        throw new InternalInterpreterError(this.position, 'nyi\'an :3');
    }

    compute(state: State): [Value, boolean] {
        let res = this.expression.compute(state);
        if (!(res[0] instanceof ExceptionValue)) {
            throw new EvaluationError(this.position,
                'Cannot "raise" value of type "' + res.constructor.name
                + '" (type must be "exn").');
        }
        return [res[0], true];
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

    getType(state: State): Type[] {
        // TODO
        throw new InternalInterpreterError(this.position, 'nyi\'an :3');
    }

    compute(state: State): [Value, boolean] {
        // TODO thoroughly test that not nesting here suffices
        // let nstate = state.getNestedState(true, state.id);
        return [new FunctionValue(state, [], this.match), false];
    }
}

// Matches

export class Match {
// pat => exp or pat => exp | match
    constructor(public position: Position, public matches: [PatternExpression, Expression][]) { }

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
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

    compute(state: State, value: Value): [Value, boolean] {
        for (let i = 0; i < this.matches.length; ++i) {
            let nstate = state.getNestedState(false, state.id);

            let res = this.matches[i][0].matches(nstate, value);
            if (res !== undefined) {
                for (let j = 0; j < res.length; ++j) {
                    nstate.setDynamicValue(res[j][0], res[j][1], true);
                }
                return this.matches[i][1].compute(nstate);
            }
        }
        return [new ExceptionValue('Match', undefined, 0), true];
    }

    getType(state: State): Type[] {
        // TODO
        throw new InternalInterpreterError(this.position, 'nyi\'an :3');
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

// Pure Patterns

export class Wildcard extends Expression implements Pattern {
    constructor(public position: Position) { super(); }

    getType(state: State): Type[] {
        return [new TypeVariable('\'\'__wc'), new TypeVariable('\'__wc')];
    }

    compute(state: State): [Value, boolean] {
        throw new InternalInterpreterError(this.position,
            'Wildcards are far too wild to have a value.');
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
    constructor(public position: Position, public identifier: IdentifierToken,
                public typeAnnotation: Type | undefined,
                public pattern: Expression|PatternExpression) { super(); }

    compute(state: State): [Value, boolean] {
        throw new InternalInterpreterError(this.position,
            'Layered patterns are far too layered to have a value.');
    }

    getType(state: State): Type[] {
        throw new Error('nyian');
    }

    matches(state: State, v: Value): [string, Value][] | undefined {
        let res = (<PatternExpression> this.pattern).matches(state, v);
        if (res === undefined) {
            return res;
        }
        let result: [string, Value][] = [[this.identifier.getText(), v]];
        for (let i = 0; i < (<[string, Value][]> res).length; ++i) {
            result.push((<[string, Value][]> res)[i]);
        }
        return result;
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
        return this.identifier.getText() + ' as ' + this.pattern.prettyPrint(indentation, oneLine);
    }
}


// The following classes are derived forms.
// They will not be present in the simplified AST and do not implement elaborate/getType

export class InfixExpression extends Expression implements Pattern {
    // operators: (op, idx), to simplify simplify
    constructor(public expressions: Expression[], public operators: [IdentifierToken, number][]) {
        super();
    }

    matches(state: State, v: Value): [string, Value][] | undefined {
        return this.reParse(state).matches(state, v);
    }

    simplify(): FunctionApplication {
        throw new InternalInterpreterError(this.position, 'Ouch, I\'m not fully parsed.');
    }

    reParse(state: State): FunctionApplication {
        let ops = this.operators;
        let exps = this.expressions;
        let poses: number[][] = [];
        for (let i = 0; i < exps.length; ++i) {
            poses.push([i]);
        }
        ops.sort(([a, p1], [b, p2]) => {
            let sta = state.getInfixStatus(a);
            let stb = state.getInfixStatus(b);
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
        for (let i = 0; i < ops.length; ++i) {
            if (i > 0) {
                let info1 = state.getInfixStatus(ops[i][0]);
                let info2 = state.getInfixStatus(ops[i - 1][0]);

                if (info1.precedence === info2.precedence
                    && info1.rightAssociative !== info2.rightAssociative
                    && (poses[ops[i - 1][1] + 1] === poses[ops[i][1]]
                        || poses[ops[i - 1][1]] === poses[ops[i][1] + 1])) {
                    throw new ParserError('Could you ever imagine left associatives '
                        + 'and right associatives living together in peace?', ops[i][0].position);
                }
            }

            let left = exps[ops[i][1]];
            let right = exps[ops[i][1] + 1];
            let com = new FunctionApplication(ops[i][0].position,
                                              new ValueIdentifier(ops[i][0].position, ops[i][0]),
                                              new Tuple(ops[i][0].position, [left, right]));
            let npos = poses[ops[i][1]];
            for (let j of poses[ops[i][1] + 1]) {
                npos.push(j);
            }
            for (let j of npos) {
                poses[j] = npos;
                exps[j] = com;
            }
        }
        return <FunctionApplication> exps[0];
    }
}

let falseConstant = new ValueIdentifier(0, new IdentifierToken('false', 0));
let trueConstant = new ValueIdentifier(0, new IdentifierToken('true', 0));
let nilConstant = new ValueIdentifier(0, new IdentifierToken('nil', 0));
let consConstant = new ValueIdentifier(0, new IdentifierToken('::', 0));

export class Conjunction extends Expression {
// leftOperand andalso rightOperand
    constructor(public position: Position, public leftOperand: Expression, public rightOperand: Expression) { super(); }

    simplify(): FunctionApplication {
        return new Conditional(this.position, this.leftOperand, this.rightOperand,
            falseConstant).simplify();
    }

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
        return '( ' + this.leftOperand.prettyPrint(indentation, oneLine) + ' andalso '
        + this.rightOperand.prettyPrint(indentation, oneLine) + ' )';
    }
}

export class Disjunction extends Expression {
// leftOperand orelse rightOperand
    constructor(public position: Position, public leftOperand: Expression, public rightOperand: Expression) { super(); }

    simplify(): FunctionApplication {
        return new Conditional(this.position, this.leftOperand, trueConstant, this.rightOperand).simplify();
    }

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
        return '( ' + this.leftOperand.prettyPrint(indentation, oneLine) + ' orelse '
        + this.rightOperand.prettyPrint(indentation, oneLine) + ' )';
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
        return '#' + this.label.getText();
    }
}

export class CaseAnalysis extends Expression {
// case expression of match
    constructor(public position: Position, public expression: Expression, public match: Match) { super(); }

    simplify(): FunctionApplication {
        return new FunctionApplication(this.position, new Lambda(this.position,
            this.match.simplify()),
            this.expression.simplify());
    }

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
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
        let res = 'if ' + this.condition.prettyPrint(indentation, oneLine);
        res += ' then ' + this.consequence.prettyPrint(indentation, oneLine);
        res += ' else ' + this.alternative.prettyPrint(indentation, oneLine);
        return res;
    }
}

export class While extends Expression {
// while exp do exp
    constructor(public position: Position, public condition: Expression,
                public body: Expression) {
        super();
    }

    simplify(): Expression {
        let nm = new ValueIdentifier(this.position, new IdentifierToken('__whl', this.position));
        let fapp = new FunctionApplication(this.position, nm, new Tuple(this.position, []));
        let cond = new Conditional(this.position, this.condition,
            new Sequence(this.position, [this.body, fapp]), new Tuple(this.position, []));
        let valbnd = new ValueBinding(this.position, true, nm,
            new Lambda(this.position, new Match(this.position,
                [[new Tuple(this.position, []), cond]])));
        let dec = new ValueDeclaration(this.position, [], [valbnd]);

        return new LocalDeclarationExpression(this.position, dec, fapp).simplify();
    }

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
        return '( while ' + this.condition.prettyPrint(indentation, oneLine)
            + ' do ' + this.body.prettyPrint(indentation, oneLine) + ' )';
    }
}
