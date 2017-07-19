/*
 * Contains classes to represent SML values, e.g. int, string, functions, …
 */

import { State } from './state';
import { InternalInterpreterError, EvaluationError } from './errors';
import { int, char } from './lexer';
import { Match } from './expressions';

export abstract class Value {
    abstract prettyPrint(): string;
    equals(other: Value): boolean {
        throw new InternalInterpreterError(-1,
            'Tried comparing incomparable things.');
    }

    isSimpleValue(): boolean {
        return true;
    }
}

export class BoolValue extends Value {
    constructor(public value: boolean) {
        super();
    }

    equals(other: BoolValue) {
        return this.value === other.value;
    }

    prettyPrint() {
        if (this.value) {
            return 'true';
        } else {
            return 'false';
        }
    }
}

export class CharValue extends Value {
    constructor(public value: char) {
        super();
    }

    prettyPrint(): string {
        // TODO
        return '#"<' + this.value + '>"';
    }

    compareTo(other: CharValue): number {
        if (this.value < other.value) {
            return -1;
        } else if (this.value > other.value) {
            return 1;
        } else {
            return 0;
        }
    }

    equals(other: StringValue) {
        return this.value === other.value;
    }
}

export class StringValue extends Value {
    constructor(public value: string) {
        super();
    }

    prettyPrint(): string {
        return '"' + this.value + '"';
    }

    equals(other: StringValue) {
        return this.value === other.value;
    }

    compareTo(other: StringValue) {
        if (this.value < other.value) {
            return -1;
        } else if (this.value > other.value) {
            return 1;
        } else {
            return 0;
        }
    }

    concat(other: StringValue) {
        return new StringValue(this.value + other.value);
    }

    explode(): ConstructedValue {
        // TODO construct a list of CharValue here
        throw new InternalInterpreterError(-1, 'Nyi\'an');
    }
}

export class Word extends Value {
    constructor(public value: int) {
        super();
    }

    prettyPrint(): string {
        return '' + this.value;
    }

    compareTo(val: Value) {
        if (val instanceof Word) {
            let other = (<Word> val).value;
            if (this.value < other) {
                return -1;
            } else if (this.value > other) {
                return 1;
            } else {
                return 0;
            }
        }
        return 2;
    }

    equals(value: Value): boolean { return this.compareTo(value) === 0; }
    negate(): Word { return new Word(-this.value); }
    add(other: Word): Word { return new Word(this.value + other.value); }
    multiply(other: Word): Word { return new Word(this.value * other.value); }
    divide(other: Word): Word { return new Word(Math.floor(this.value / other.value)); }
    modulo(other: Word): Word { return new Word(this.value % other.value); }
    toReal(): Real { return new Real(this.value); }
}


export class Integer extends Value {
    constructor(public value: int) {
        super();
    }

    prettyPrint(): string {
        return '' + this.value;
    }

    compareTo(val: Value) {
        if (val instanceof Integer) {
            let other = (<Integer> val).value;
            if (this.value < other) {
                return -1;
            } else if (this.value > other) {
                return 1;
            } else {
                return 0;
            }
        }
        return false;
    }

    equals(value: Value): boolean {
        return this.compareTo(value) === 0;
    }

    negate(): Integer { return new Integer(-this.value); }
    add(other: Integer): Integer { return new Integer(this.value + other.value); }
    multiply(other: Integer): Integer { return new Integer(this.value * other.value); }
    divide(other: Integer): Integer { return new Integer(Math.floor(this.value / other.value)); }
    modulo(other: Integer): Integer { return new Integer(this.value % other.value); }
    toReal(): Real { return new Real(this.value); }
}

export class Real extends Value {
    constructor(public value: number) {
        super();
    }

    prettyPrint(): string {
        // TODO in TS this may produce ints
        return '' + this.value;
    }

    compareTo(val: Value) {
        if (val instanceof Real) {
            let other = (<Real> val).value;
            if (this.value < other) {
                return -1;
            } else if (this.value > other) {
                return 1;
            } else {
                return 0;
            }
        }
        return false;
    }

    equals(value: Value): boolean {
        return this.compareTo(value) === 0;
    }

    negate(): Real {
        return new Real(-this.value);
    }

    add(other: Real): Real {
        return new Real(this.value + other.value);
    }

    multiply(other: Real): Real {
        return new Real(this.value * other.value);
    }

    divide(other: Real): Real {
        return new Real(this.value / other.value);
    }

    toInteger(): Integer {
        return new Integer(Math.floor(this.value));
    }
}

export class RecordValue extends Value {
    constructor(public entries: Map<string, Value>) {
        super();
    }

    prettyPrint(): string {
        // TODO
        throw new InternalInterpreterError(0, 'not yet implemented');
    }

    getValue(name: string): Value {
        if (this.entries[name] === undefined) {
            throw new EvaluationError(0, 'Tried accessing non-existing record part.');
        }
        return this.entries[name];
    }

    equals(other: Value): boolean {
        if (!(other instanceof RecordValue)) {
            return false;
        }
        if (!this.entries.forEach((j: Value, i: string) => {
            if (!(<RecordValue> other).entries.has(i)) {
                return false;
            }
            if (!this.entries[i].equals((<RecordValue> other).entries[i])) {
                return false;
            }
            return true;
        })) {
            return false;
        }
        if (!(<RecordValue> other).entries.forEach((j: Value, i: string) => {
            if (!this.entries.has(i)) {
                return false;
            }
            if (!this.entries[i].equals((<RecordValue> other).entries[i])) {
                return false;
            }
            return true;
        })) {
            return false;
        }
        return true;
    }
}

export class FunctionValue extends Value {
    constructor(public state: State, public body: Match) {
        super();
    }

    prettyPrint(): string {
        // TODO
        throw new InternalInterpreterError(0, 'not yet implemented');
    }

    // Computes the function on the given argument,
    // returns [result, is thrown]
    compute(state: State, argument: Value): [Value, boolean] {
        return this.body.compute(state, argument);
    }
}

// Values that were constructed from type constructors
export class ConstructedValue extends Value {
    constructor(public constructorName: string,
                public argument: Value = new RecordValue(new Map<string, Value>())) {
        super();
    }

    prettyPrint(): string {
        let result: string = '(' + this.constructorName;
        if (this.argument) {
            result += ' ' + this.argument.prettyPrint();
        }
        return result + ')';
    }

    equals(other: Value): boolean {
        if (!(other instanceof ConstructedValue)) {
            return false;
        }
        if (this.constructorName !== (<ConstructedValue> other).constructorName) {
            return false;
        }
        return this.argument.equals((<ConstructedValue> other).argument);
    }

    implode(): StringValue {
        // TODO if this CustomType is a List of CharValue, implode them into a string.
        throw new InternalInterpreterError(-1, 'nyi\'an');
    }
}

export class ExceptionValue extends Value {
    constructor(public constructorName: string,
                public argument: Value = new RecordValue(new Map<string, Value>())) {
        super();
    }

    prettyPrint(): string {
        let result: string = '(' + this.constructorName;
        if (this.argument) {
            result += ' ' + this.argument.prettyPrint();
        }
        return result + ')';
    }

    equals(other: Value): boolean {
        if (!(other instanceof ExceptionValue)) {
            return false;
        }
        if (this.constructorName !== (<ExceptionValue> other).constructorName) {
            return false;
        }
        return this.argument.equals((<ExceptionValue> other).argument);
    }
}


export class PredefinedFunction extends Value {
    constructor(public name: string,
                public apply: (arg: Value|undefined) => Value) {
        super();
    }

    prettyPrint(): string {
        return this.name + ' (predefined)';
    }

    equals(other: Value): boolean {
        if (!(other instanceof PredefinedFunction)) {
            return false;
        }
        return this.name === (<PredefinedFunction> other).name;
    }

    isSimpleValue(): boolean {
        return false;
    }
}

export class ValueConstructor extends Value {
    constructor(public constructorName: string) {
        super();
    }

    equals(other: Value): boolean {
        if (!(other instanceof ValueConstructor)) {
            return false;
        }
        return this.constructorName === (<ValueConstructor> other).constructorName;
    }

    construct(parameter: Value = new RecordValue(new Map<string, Value>())): ConstructedValue {
        return new ConstructedValue(this.constructorName, parameter);
    }

    prettyPrint() {
        return this.constructorName + ' [value constructor]';
    }

    isSimpleValue(): boolean {
        return false;
    }
}

export class ExceptionConstructor extends Value {
    constructor(public exceptionName: string) {
        super();
    }

    equals(other: Value): boolean {
        if (!(other instanceof ExceptionConstructor)) {
            return false;
        }
        return this.exceptionName === (<ExceptionConstructor> other).exceptionName;
    }

    construct(parameter: Value = new RecordValue(new Map<string, Value>())): ExceptionValue {
        return new ExceptionValue(this.exceptionName, parameter);
    }

    prettyPrint() {
        return this.exceptionName + ' [exception constructor]';
    }

    isSimpleValue(): boolean {
        return false;
    }
}
