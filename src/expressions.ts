import {  RecordType, Type, FunctionType, CustomType, AnyType } from './types';
import { Declaration, ValueBinding, ValueDeclaration } from './declarations';
import { Token, IdentifierToken, ConstantToken, IntegerConstantToken, RealConstantToken,
         NumericToken, WordConstantToken, CharacterConstantToken, StringConstantToken } from './tokens';
import { State, IdentifierStatus } from './state';
import { InternalInterpreterError, ElaborationError, EvaluationError, ParserError, Warning } from './errors';
import { Value, CharValue, StringValue, Integer, Real, Word, ValueConstructor,
         ExceptionConstructor, PredefinedFunction, RecordValue, FunctionValue,
         ExceptionValue, ConstructedValue, ReferenceValue } from './values';
import { getInitialState } from './initialState.ts';

type MemBind = [number, Value][];

export abstract class Expression {
    position: number;

    getType(state: State): Type {
        throw new InternalInterpreterError(this.position, 'Called "getType" on a derived form.');
    }

    // Computes the value of an expression, returns [computed value, is thrown exception]
    compute(state: State): [Value, boolean, Warning[], MemBind] {
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
    position: number;
    matchType(state: State, t: Type): [[string, Type][], Type];
    matches(state: State, v: Value): [string, Value][] | undefined;
    simplify(): PatternExpression;
    prettyPrint(indentation: number, oneLine: boolean): string;
}

export type PatternExpression = Pattern & Expression;

export class Constant extends Expression implements Pattern {
    constructor(public position: number, public token: ConstantToken) { super(); }

    matchType(state: State, t: Type): [[string, Type][], Type] {
        return [[], this.getType(state)];
    }

    matches(state: State, v: Value): [string, Value][] | undefined {
        if (this.compute(state)[0].equals(v)) {
            return [];
        } else {
            return undefined;
        }
    }

    getType(state: State): Type {
        if (this.token instanceof IntegerConstantToken || this.token instanceof NumericToken) {
            return new CustomType('int');
        } else if (this.token instanceof RealConstantToken) {
            return new CustomType('real');
        } else if (this.token instanceof WordConstantToken) {
            return new CustomType('word');
        } else if (this.token instanceof CharacterConstantToken) {
            return new CustomType('char');
        } else if (this.token instanceof StringConstantToken) {
            return new CustomType('string');
        } else {
            throw new InternalInterpreterError(this.token.position,
                '"' + this.prettyPrint() + '" does not seem to be a valid constant.');
        }
    }

    simplify(): Constant { return this; }

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
        return this.token.getText();
    }

    compute(state: State): [Value, boolean, Warning[], MemBind] {
        if (this.token instanceof IntegerConstantToken || this.token instanceof NumericToken) {
            return [new Integer((<IntegerConstantToken | NumericToken> this.token).value),
                false, [], []];
        } else if (this.token instanceof RealConstantToken) {
            return [new Real((<RealConstantToken> this.token).value), false, [], []];
        } else if (this.token instanceof WordConstantToken) {
            return [new Word((<WordConstantToken> this.token).value), false, [], []];
        } else if (this.token instanceof CharacterConstantToken) {
            return [new CharValue((<CharacterConstantToken> this.token).value), false, [], []];
        } else if (this.token instanceof StringConstantToken) {
            return [new StringValue((<StringConstantToken> this.token).value), false, [], []];
        }
        throw new EvaluationError(this.token.position, 'You sure that this is a constant?');
    }
}

export class ValueIdentifier extends Expression implements Pattern {
// op longvid or longvid
    constructor(public position: number, public name: Token) { super(); }

    matchType(state: State, t: Type): [[string, Type][], Type] {
        let res = state.getStaticValue(this.name.getText());
        if (res === undefined || res[1] === IdentifierStatus.VALUE_VARIABLE) {
            return [[[this.name.getText(), t.instantiate(state)]], t.instantiate(state)];
        }
        // TODO res[0] < t
        if (t.equals(res[0])) {
            return [[], t];
        }
        throw new ElaborationError(this.position,
            'Type clash: "' + t.prettyPrint + '" vs. "' + res[0].prettyPrint() + '".');
    }

    matches(state: State, v: Value): [string, Value][] | undefined {
        let res = state.getDynamicValue(this.name.getText());
        if (res === undefined || res[1] === IdentifierStatus.VALUE_VARIABLE) {
            return [[this.name.getText(), v]];
        }
        if (v.equals(res[0])) {
            return [];
        }
        return undefined;
    }

    simplify(): ValueIdentifier { return this; }

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
        return this.name.getText();
    }

    getType(state: State): Type {
        let res = state.getStaticValue(this.name.getText());
        if (res === undefined) {
            throw new ElaborationError(this.position, 'Unbound value identifier "'
                + this.name.getText() + '".');
        }

        return res[0];
    }

    compute(state: State): [Value, boolean, Warning[], MemBind] {
        let res = state.getDynamicValue(this.name.getText());
        if (res === undefined) {
            throw new EvaluationError(this.position, 'Unbound value identifier "'
                + this.name.getText() + '".');
        }

        if (res[1] === IdentifierStatus.VALUE_CONSTRUCTOR
            && (<ValueConstructor> res[0]).numArgs === 0) {
            return [(<ValueConstructor> res[0]).construct(), false, [], []];
        }
        if (res[1] === IdentifierStatus.EXCEPTION_CONSTRUCTOR
            && (<ExceptionConstructor> res[0]).numArgs === 0) {
            return [(<ExceptionConstructor> res[0]).construct(), false, [], []];
        }

        return [res[0], false, [], []];
    }
}

export class Record extends Expression implements Pattern {
// { lab = exp, ... } or { }
// a record(pattern) is incomplete if it ends with '...'
    constructor(public position: number, public complete: boolean,
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

    matchType(state: State, t: Type): [[string, Type][], Type] {
        if (!(t instanceof RecordType)) {
            throw new ElaborationError(this.position,
                'Expected pattern of a record type, got "' + t.constructor.name + '".');
        }
        if (this.complete && this.entries.length !== (<RecordType> t).elements.size) {
            throw new ElaborationError(this.position,
                'Expected a record type with ' + this.entries.length + ' entries,'
                + ' but the given one has ' + (<RecordType> t).elements.size + '.');
        }

        let res: [string, Type][] = [];
        let rtp = new Map<string, Type>();

        for (let i = 0; i < this.entries.length; ++i) {
            if (!(<RecordType> t).hasType(this.entries[i][0])) {
                // TODO Better message
                throw new ElaborationError(this.position, 'Elaboration failed.');
            }
            let cur = (<PatternExpression> this.entries[i][1]).matchType(
                state, (<RecordType> t).getType(this.entries[i][0]));

            res = res.concat(cur[0]);
            rtp = rtp.set(this.entries[i][0], cur[1]);
        }
        return [res, new RecordType(rtp)];
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

    getType(state: State): Type {
        let e: Map<string, Type> = new Map<string, Type>();
        for (let i: number = 0; i < this.entries.length; ++i) {
            let name: string = this.entries[i][0];
            let exp: Expression = this.entries[i][1];
            if (e.has(name)) {
                throw new ElaborationError(this.position,
                    'Label "' + name + '" occurs more than once in the same record.');
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

    compute(state: State): [Value, boolean, Warning[], MemBind] {
        let nentr = new Map<string, Value>();
        let warns: Warning[] = [];
        let membnd: MemBind = [];
        for (let i = 0; i < this.entries.length; ++i) {
            let res = this.entries[i][1].compute(state);
            warns = warns.concat(res[2]);
            membnd = membnd.concat(res[3]);
            for (let j = 0; j < res[3].length; ++j) {
                state.setCell(res[3][j][0], res[3][j][1]);
            }
            if (res[1]) {
                // Computing some expression failed
                return [res[0], true, warns, membnd];
            }
            nentr = nentr.set(this.entries[i][0], res[0]);
        }
        return [new RecordValue(nentr), false, warns, membnd];
    }
}

export class LocalDeclarationExpression extends Expression {
// let dec in exp1; ...; expn end
// A sequential expression exp1; ... ; expn is represented as such,
// despite the potentially missing parentheses
    constructor(public position: number, public declaration: Declaration, public expression: Expression) { super(); }

    simplify(): LocalDeclarationExpression {
        return new LocalDeclarationExpression(this.position, this.declaration.simplify(), this.expression.simplify());
    }

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
        let res = 'let ' + this.declaration.prettyPrint(indentation, oneLine);
        res += ' in ' + this.expression.prettyPrint(indentation, oneLine) + ' end';
        return res;
    }

    getType(state: State): Type {
        // TODO Warnings?
        let res = this.declaration.elaborate(state.getNestedState(state.id));

        return this.expression.getType(res[0]);
    }

    compute(state: State): [Value, boolean, Warning[], MemBind] {
        let nstate = state.getNestedState(0).getNestedState(state.id);
        let res = this.declaration.evaluate(nstate);
        let membnd = res[0].getMemoryChanges(0);
        if (res[1]) {
            return [<Value> res[2], true, res[3], membnd];
        }
        let nres = this.expression.compute(res[0]);
        return [nres[0], nres[1], res[3].concat(nres[2]), membnd.concat(nres[3])];
    }
}

export class TypedExpression extends Expression implements Pattern {
// expression: type (L)
    constructor(public position: number, public expression: Expression,
                public typeAnnotation: Type) { super(); }

    matchType(state: State, t: Type): [[string, Type][], Type] {
        let tp = (<PatternExpression> this.expression).matchType(state, t);

        if (!tp[1].equals(this.typeAnnotation)) {
            throw new ElaborationError(this.position,
                'The specified type "' + this.typeAnnotation.prettyPrint()
                + ' does not match the annotated expression\'s type "'
                + tp[1].prettyPrint() + '.');
        }

        return [tp[0], this.typeAnnotation];
    }

    matches(state: State, v: Value): [string, Value][] | undefined {
        return (<PatternExpression> this.expression).matches(state, v);
    }

    getType(state: State): Type {
        let tp = this.expression.getType(state);

        if (tp.matches(state, this.typeAnnotation) === undefined) {
            throw new ElaborationError(this.position,
                'The specified type "' + this.typeAnnotation.prettyPrint()
                + ' does not match the annotated expression\'s type "'
                + tp.prettyPrint() + '.');
        }

        return this.typeAnnotation;
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

    compute(state: State): [Value, boolean, Warning[], MemBind] {
        return this.expression.compute(state);
    }
}

// May represent either a function application or a constructor with an argument
export class FunctionApplication extends Expression implements Pattern {
// function argument
    constructor(public position: number,
                public func: Expression,
                public argument: Expression|PatternExpression) { super(); }

    matchType(state: State, t: Type): [[string, Type][], Type] {

        if (t instanceof FunctionType) {
            throw new ElaborationError(this.position,
                'You simply cannot match function values.');
        }
        if (!(this.func instanceof ValueIdentifier)) {
            // TODO Better message
            throw new ElaborationError(this.position, 'Elaboration failed. 1');
        }

        let ti = state.getStaticValue((<ValueIdentifier> this.func).name.getText());
        if (ti === undefined || ti[1] === IdentifierStatus.VALUE_VARIABLE) {
            throw new ElaborationError(this.position,
                'Unbound value Identifier "' + (<ValueIdentifier> this.func).name.getText() + '".');
        }

        if (!(ti[0] instanceof FunctionType) || !(t instanceof CustomType)) {
            // TODO Better message
            throw new ElaborationError(this.position, 'Elaboration failed. 2');
        }

        let res = (<PatternExpression> this.argument).matchType(state,
            (<FunctionType> ti[0]).parameterType);

        if (!res[1].equals((<FunctionType> ti[0]).parameterType)) {
            // TODO Better message
            throw new ElaborationError(this.position, 'Elaboration failed. 4');
        }

        return [res[0], (<FunctionType> ti[0]).returnType];
    }

    matches(state: State, v: Value): [string, Value][] | undefined {
        if (v instanceof FunctionValue) {
            throw new EvaluationError(this.position,
                'You simply cannot match function values.');
        } else if (v instanceof ConstructedValue) {
            if (this.func instanceof ValueIdentifier
                && (<ValueIdentifier> this.func).name.getText()
                === (<ConstructedValue> v).constructorName
                && (<ValueIdentifier> this.func).name.getText() !== 'ref') {
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
        } else if (v instanceof ReferenceValue) {
            if (this.func instanceof ValueIdentifier
                && (<ValueIdentifier> this.func).name.getText() === 'ref') {
                return (<PatternExpression> this.argument).matches(
                    state, <Value> state.getCell((<ReferenceValue> v).address));
            }
            return undefined;
        }
        throw new EvaluationError(this.position, 'Help me, I\'m broken. ('
            + v.constructor.name + ').' );
    }

    getType(state: State): Type {
        let f: Type = this.func.getType(state);
        let arg: Type = this.argument.getType(state);
        if (f instanceof AnyType) {
            f = new FunctionType(new AnyType(), new AnyType());
        }

        if (f instanceof FunctionType) {
            let tp = (<FunctionType> f).parameterType.matches(state, arg);
            if (tp === undefined) {
                throw new ElaborationError(this.position,
                    'Do not feed functions of type "' + f.prettyPrint()
                    + '" an argument of type "' + arg.prettyPrint() + '".');
            }
            for (let i = 0; i < tp.length; ++i) {
                state.setStaticValue(tp[i][0], tp[i][1], IdentifierStatus.VALUE_VARIABLE);
            }
            return f.returnType.instantiate(state);
        } else {
            throw new ElaborationError(this.func.position,
                '"' + this.func.prettyPrint() + '" of type "'
                + f.prettyPrint() + '" is not a function.');
        }
    }

    simplify(): FunctionApplication {
        return new FunctionApplication(this.position, this.func.simplify(), this.argument.simplify());
    }

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
        let res = '( ' +  this.func.prettyPrint(indentation, oneLine);
        res += ' ' + this.argument.prettyPrint(indentation, oneLine);
        return res + ' )';
    }

    compute(state: State): [Value, boolean, Warning[], MemBind] {
        if (this.func instanceof ValueIdentifier) {
            if (this.func.name.getText() === 'ref') {
                let aVal = this.argument.compute(state);
                if (aVal[1]) {
                    return [aVal[0], true, aVal[2], aVal[3]];
                }
                for (let i = 0; i < aVal[3].length; ++i) {
                    state.setCell(aVal[3][i][0], aVal[3][i][1]);
                }
                let res: ReferenceValue = state.setNewCell(aVal[0]);
                aVal[3].push([res.address, aVal[0]]);

                return [res, false, aVal[2], aVal[3]];
            } else if (this.func.name.getText() === ':=') {
                let aVal = this.argument.compute(state);
                if (aVal[1]) {
                    return [aVal[0], true, aVal[2], aVal[3]];
                }
                for (let i = 0; i < aVal[3].length; ++i) {
                    state.setCell(aVal[3][i][0], aVal[3][i][1]);
                }

                if ((!(aVal[0] instanceof RecordValue))
                    || (!((<RecordValue> aVal[0]).getValue('1') instanceof ReferenceValue))) {
                    throw new EvaluationError(this.position, 'That\'s not how ":=" works.');
                }
                aVal[3].push([(<ReferenceValue> (<RecordValue> aVal[0]).getValue('1')).address,
                    (<RecordValue> aVal[0]).getValue('2')]);
                return [new RecordValue(), false, aVal[2], aVal[3]];
            } else if (this.func.name.getText() === '!') {
                let aVal = this.argument.compute(state);
                if (aVal[1]) {
                    return [aVal[0], true, aVal[2], aVal[3]];
                }
                for (let i = 0; i < aVal[3].length; ++i) {
                    state.setCell(aVal[3][i][0], aVal[3][i][1]);
                }
                if (!(aVal[0] instanceof ReferenceValue)) {
                    throw new EvaluationError(this.position,
                        'You cannot dereference "' + this.argument.prettyPrint() + '".');
                }
                return [<Value> state.getCell((<ReferenceValue> aVal[0]).address), false, aVal[2], aVal[3]];
            }
        }

        let funcVal = this.func.compute(state);
        if (funcVal[1]) {
            // computing the function failed
            return funcVal;
        }

        for (let i = 0; i < funcVal[3].length; ++i) {
            state.setCell(funcVal[3][i][0], funcVal[3][i][1]);
        }

        let argVal = this.argument.compute(state);
        let warns = funcVal[2].concat(argVal[2]);
        let membnd = funcVal[3].concat(argVal[3]);
        if (argVal[1]) {
            return [argVal[0], true, warns, membnd];
        }
        if (funcVal[0] instanceof FunctionValue) {
            for (let i = 0; i < argVal[3].length; ++i) {
                state.setCell(argVal[3][i][0], argVal[3][i][1]);
            }
            let nmem: MemBind = [];

            for (let i = 0; i < state.memory[0]; ++i) {
                if (state.getCell(i) !== undefined) {
                    nmem.push([i, <Value> state.getCell(i)]);
                }
            }

            let res = (<FunctionValue> funcVal[0]).compute(argVal[0], nmem);
            return [res[0], res[1], warns.concat(res[2]), membnd.concat(res[3])];
        } else if (funcVal[0] instanceof ValueConstructor) {
            return [(<ValueConstructor> funcVal[0]).construct(argVal[0]), false, warns, membnd];
        } else if (funcVal[0] instanceof ExceptionConstructor) {
            return [(<ExceptionConstructor> funcVal[0]).construct(argVal[0]), false, warns, membnd];
        } else if (funcVal[0] instanceof PredefinedFunction) {
            let res = (<PredefinedFunction> funcVal[0]).apply(argVal[0]);
            return [res[0], res[1], warns.concat(res[2]), membnd];
        }
        throw new EvaluationError(this.position, 'Cannot evaluate the function "'
            + this.func.prettyPrint() + '" (' + funcVal[0].constructor.name + ').');
    }
}

export class HandleException extends Expression {
    // expression handle match
    constructor(public position: number, public expression: Expression, public match: Match) {
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

    getType(state: State): Type {
        let mtp = this.match.getType(state);
        if ((!(mtp instanceof FunctionType))
            || (<FunctionType> mtp).parameterType.equals(new CustomType('exn'))) {
            throw new ElaborationError(this.match.position,
                'You can only handle things of type "exn".');
        }
        let rt = (<FunctionType> mtp).returnType;
        let etp = this.expression.getType(state);

        if (!rt.equals(etp)) {
            throw new ElaborationError(this.expression.position,
                'The "handle" cannot change the type of the expression from "'
                + etp.prettyPrint() + '" to "' + rt.prettyPrint() + '".');
        }

        return etp;
    }

    compute(state: State): [Value, boolean, Warning[], MemBind] {
        let res = this.expression.compute(state);
        if (res[1]) {
            for (let i = 0; i < res[3].length; ++i) {
                state.setCell(res[3][i][0], res[3][i][1]);
            }

            let next = this.match.compute(state, res[0]);
            if (!next[1] || !next[0].equals(new ExceptionValue('Match', undefined, 0))) {
                // Exception got handled
                return [next[0], next[1], res[2].concat(next[2]), res[3].concat(next[3])];
            }
            res[2] = res[2].concat(next[2]);
            res[3] = res[3].concat(next[3]);
        }
        return res;
    }
}

export class RaiseException extends Expression {
    // raise expression
    constructor(public position: number, public expression: Expression) { super(); }

    simplify(): RaiseException {
        return new RaiseException(this.position, this.expression.simplify());
    }

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
        return 'raise ' + this.expression.prettyPrint(indentation, oneLine);
    }

    getType(state: State): Type {
        if (!this.expression.getType(state).equals(new CustomType('exn'))) {
            throw new ElaborationError(this.expression.position,
                'Raising anything but exceptions will only raise exceptions.');
        }
        return new AnyType();
    }

    compute(state: State): [Value, boolean, Warning[], MemBind] {
        let res = this.expression.compute(state);
        if (!(res[0] instanceof ExceptionValue)) {
            throw new EvaluationError(this.position,
                'Cannot "raise" value of type "' + res.constructor.name
                + '" (type must be "exn").');
        }
        return [res[0], true, res[2], res[3]];
    }
}

export class Lambda extends Expression {
    // fn match
    constructor(public position: number, public match: Match) { super(); }

    simplify(): Lambda {
        return new Lambda(this.position, this.match.simplify());
    }

    prettyPrint(indentation: number = 0, oneLine: boolean = true): string {
        // TODO
        return '( fn ' + this.match.prettyPrint(indentation, oneLine) + ' )';
    }

    getType(state: State): Type {
        return this.match.getType(state);
    }

    compute(state: State): [Value, boolean, Warning[], MemBind] {
        // We need to ensure that the function value receives a capture
        // of the current state, and that that capture stays that way
        // (Local declarations may change the past, so we must record that, too.
        let nstate = getInitialState().getNestedState(state.id);

        state.getDefinedIdentifiers().forEach((val: string) => {
            let value = state.getDynamicValue(val);
            let type = state.getDynamicType(val);
            if (value !== undefined) {
                nstate.setDynamicValue(val, value[0], value[1]);
            }
            if (type !== undefined) {
                nstate.setDynamicType(val, type);
            }
        });

        return [new FunctionValue(nstate, [], this.match), false, [], []];
    }
}

// Matches

export class Match {
    // pat => exp or pat => exp | match
    constructor(public position: number, public matches: [PatternExpression, Expression][]) { }

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

    compute(state: State, value: Value): [Value, boolean, Warning[], MemBind] {
        for (let i = 0; i < this.matches.length; ++i) {
            let nstate = state.getNestedState(state.id);

            let res = this.matches[i][0].matches(nstate, value);
            if (res !== undefined) {
                for (let j = 0; j < res.length; ++j) {
                    nstate.setDynamicValue(res[j][0], res[j][1], IdentifierStatus.VALUE_VARIABLE);
                }
                return this.matches[i][1].compute(nstate);
            }
        }
        return [new ExceptionValue('Match', undefined, 0), true, [], []];
    }

    getType(state: State): Type {
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
    constructor(public position: number) { super(); }

    getType(state: State): Type {
        return new AnyType();
    }

    compute(state: State): [Value, boolean, Warning[], MemBind] {
        throw new InternalInterpreterError(this.position,
            'Wildcards are far too wild to have a value.');
    }

    matchType(state: State, t: Type): [[string, Type][], Type] {
        return [[], t];
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
    constructor(public position: number, public identifier: IdentifierToken,
                public typeAnnotation: Type | undefined,
                public pattern: Expression|PatternExpression) { super(); }

    compute(state: State): [Value, boolean, Warning[], MemBind] {
        throw new InternalInterpreterError(this.position,
            'Layered patterns are far too layered to have a value.');
    }

    getType(state: State): Type {
        throw new InternalInterpreterError(this.position,
            'Layered patterns are far too layered to have a type.');
    }

    matchType(state: State, t: Type): [[string, Type][], Type]  {
        // TODO
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

    matchType(state: State, t: Type): [[string, Type][], Type] {
        return this.reParse(state).matchType(state, t);
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
    constructor(public position: number, public leftOperand: Expression, public rightOperand: Expression) { super(); }

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
    constructor(public position: number, public leftOperand: Expression, public rightOperand: Expression) { super(); }

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
    constructor(public position: number, public expressions: Expression[]) { super(); }

    matchType(state: State, t: Type): [[string, Type][], Type] {
        return this.simplify().matchType(state, t);
    }

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
    constructor(public position: number, public expressions: Expression[]) { super(); }

    matchType(state: State, t: Type): [[string, Type][], Type] {
        return this.simplify().matchType(state, t);
    }

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
    constructor(public position: number, public expressions: Expression[]) { super(); }

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
    constructor(public position: number, public label: IdentifierToken | NumericToken) { super(); }

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
    constructor(public position: number, public expression: Expression, public match: Match) { super(); }

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
    constructor(public position: number, public condition: Expression, public consequence: Expression,
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
    constructor(public position: number, public condition: Expression,
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
