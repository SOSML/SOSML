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

    isSimpleValue(): boolean { return true; }
    isConstructedValue(): boolean { return false; }
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

    isConstructedValue(): boolean { return true; }
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
    // at the beginning because of linter…
    static implode(list: ConstructedValue): StringValue {
        let str = '';
        while (list.constructorName !== 'nil') {
            if (list.constructorName !== '::') {
                throw new InternalInterpreterError(-1,
                    'Is this a char list? I can\t implode this (' + list.constructorName + ')');
            }
            let arg = list.argument;
            if (arg instanceof RecordValue) {
                let a1 = arg.getValue('1');
                let a2 = arg.getValue('2');
                if (a1 instanceof CharValue && a2 instanceof ConstructedValue) {
                    str += a1.value;
                    list = a2;
                } else {
                    throw new InternalInterpreterError(-1,
                        'Is this a char list? I can\t implode this (' + list.constructorName + ')');
                }
            } else {
                throw new InternalInterpreterError(-1,
                    'Is this a char list? I can\t implode this (' + list.constructorName + ')');
            }
        }

        return new StringValue(str);
    }

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
        let ret: ConstructedValue = new ConstructedValue('nil');

        for (let i = this.value.length - 1; i >= 0; --i) {
            ret = new ConstructedValue('::', new RecordValue(new Map<string, Value>([
                ['1', new CharValue(this.value[i])],
                ['2', ret]
            ])));
        }

        return ret;
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

    negate(): Word { return new Word(-this.value); }
    equals(value: Value): boolean { return this.compareTo(value) === 0; }
    add(other: Word): Word { return new Word(this.value + other.value); }
    multiply(other: Word): Word { return new Word(this.value * other.value); }
    divide(other: Word): Word { return new Word(Math.floor(this.value / other.value)); }
    modulo(other: Word): Word { return new Word(this.value % other.value); }
    toReal(): Real { return new Real(this.value); }
    hasOverflow(): boolean { return this.value > 1073741823 || this.value < -1073741824; }
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
    hasOverflow(): boolean { return this.value > 1073741823 || this.value < -1073741824; }
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
    hasOverflow(): boolean {
        // TODO how do we implement Overflow for reals?
        return false;
    }
}

export class RecordValue extends Value {
    constructor(public entries: Map<string, Value> = new Map<string, Value>()) {
        super();
    }

    prettyPrint(): string {
        // TODO: print as Tuple if possible
        let result: string = '{ ';
        let first: boolean = true;
        this.entries.forEach((value: Value, key: string) => {
            if (!first) {
                result += ', ';
            } else {
                first = false;
            }
            result += key + ' = ' + value.prettyPrint();
        });
        return result + ' }';
    }

    getValue(name: string): Value {
        if (!this.entries.has(name)) {
            throw new EvaluationError(0, 'Tried accessing non-existing record part.');
        }
        return <Value> this.entries.get(name);
    }

    hasValue(name: string): boolean {
        return this.entries.has(name);
    }

    equals(other: Value): boolean {
        if (!(other instanceof RecordValue)) {
            return false;
        }
        let fail = false;
        this.entries.forEach((j: Value, i: string) => {
            if (!(<RecordValue> other).entries.has(i)) {
                fail = true;
            }
            if (!j.equals(<Value> (<RecordValue> other).entries.get(i))) {
                fail = true;
            }
        });
        if (fail) {
            return false;
        }
        (<RecordValue> other).entries.forEach((j: Value, i: string) => {
            if (!this.entries.has(i)) {
                fail = true;
            }
            if (!j.equals(<Value> (<RecordValue> other).entries.get(i))) {
                fail = true;
            }
        });
        if (fail) {
            return false;
        }
        return true;
    }
}

export class FunctionValue extends Value {
    constructor(public state: State,
                public recursives: [string, Value][],
                public body: Match) {
        super();
    }

    prettyPrint(): string {
        let res = 'fn ' + '[';
        for (let i = 0; i < this.recursives.length; ++i) {
            if (i > 0) {
                res += ', ';
            }
            res += this.recursives[i][0] + ' ↦ ' + this.recursives[i][1].prettyPrint();
        }
        res += '] (';

        this.state.getDefinedIdentifiers().forEach((val: string) => {
            res += ' ' + val;
        });
        return res + ' )';
    }

    // Computes the function on the given argument,
    // returns [result, is thrown]
    compute(argument: Value): [Value, boolean] {
        // adjoin the bindings in this.state into the state
        let nstate = this.state.getNestedState(false, this.state.id);
        for (let i = 0; i < this.recursives.length; ++i) {
            if (this.recursives[i][1] instanceof FunctionValue) {
                nstate.setDynamicValue(this.recursives[i][0],
                    new FunctionValue(this.state, this.recursives,
                        (<FunctionValue> this.recursives[i][1]).body), true);
            } else {
                nstate.setDynamicValue(this.recursives[i][0], this.recursives[i][1], true);
            }
        }

        return this.body.compute(nstate, argument);
    }

    equals(other: Value): boolean {
        throw new InternalInterpreterError(-1, 'You simply cannot compare "' + this.prettyPrint()
            + '" and "' + other.prettyPrint() + '".');
    }
}

// Values that were constructed from type constructors
export class ConstructedValue extends Value {
    constructor(public constructorName: string,
                public argument: Value|undefined = undefined,
                public id: number = 0) {
        super();
    }

    prettyPrint(): string {
        let result: string =  this.constructorName;
        if (this.id > 1) {
            result += '/' + (this.id - 1);
        }
        if (this.argument) {
            result += ' ' + this.argument.prettyPrint();
        }
        return result;
    }

    equals(other: Value): boolean {
        if (other instanceof ValueConstructor) {
            other = other.construct();
        }

        if (!(other instanceof ConstructedValue)) {
            return false;
        }
        if (this.constructorName !== (<ConstructedValue> other).constructorName
            || this.id !== (<ConstructedValue> other).id) {
            return false;
        }
        if (this.argument !== undefined) {
            if ((<ConstructedValue> other).argument === undefined) {
                return true;
            } else {
                return this.argument.equals(<Value> (<ConstructedValue> other).argument);
            }
        } else {
            return (<ConstructedValue> other).argument === undefined;
        }
    }

    implode(): StringValue {
        // TODO if this CustomType is a List of CharValue, implode them into a string.
        throw new InternalInterpreterError(-1, 'nyi\'an');
    }

    isConstructedValue(): boolean { return true; }
}

export class ExceptionValue extends Value {
    constructor(public constructorName: string,
                public argument: Value|undefined = undefined,
                public id: number = 0) {
        super();
    }

    prettyPrint(): string {
        let result: string = this.constructorName;
        if (this.id > 1) {
            result += '/' + (this.id - 1);
        }
        if (this.argument) {
            result += ' ' + this.argument.prettyPrint();
        }
        return result;
    }

    equals(other: Value): boolean {
        if (other instanceof ExceptionConstructor) {
            other = other.construct();
        }

        if (!(other instanceof ExceptionValue)) {
            return false;
        }
        if (this.constructorName !== (<ExceptionValue> other).constructorName
            || this.id !== (<ExceptionValue> other).id) {
            return false;
        }
        if (this.argument !== undefined) {
            if ((<ExceptionValue> other).argument === undefined) {
                return true;
            } else {
                return this.argument.equals(<Value> (<ExceptionValue> other).argument);
            }
        } else {
            return (<ExceptionValue> other).argument === undefined;
        }
    }

    isConstructedValue(): boolean { return true; }
}


export class PredefinedFunction extends Value {
    constructor(public name: string,
                public apply: (arg: Value|undefined) => [Value, boolean]) {
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
    constructor(public constructorName: string, public numArgs: number = 0,
                public id: number = 0) {
        super();
    }

    equals(other: Value): boolean {
        if (!(other instanceof ValueConstructor)) {
            return false;
        }
        return this.constructorName === (<ValueConstructor> other).constructorName
            && this.id === (<ValueConstructor> other).id;
    }

    construct(parameter: Value|undefined = undefined): ConstructedValue {
        return new ConstructedValue(this.constructorName, parameter, this.id);
    }

    prettyPrint() {
        let result = this.constructorName;
        if (this.id !== 0) {
            result += '/' + this.id;
        }
        return result;
    }

    isSimpleValue(): boolean {
        return false;
    }
}

export class ExceptionConstructor extends Value {
    constructor(public exceptionName: string, public numArgs: number = 0,
                public id: number = 0) {
        super();
    }

    equals(other: Value): boolean {
        if (!(other instanceof ExceptionConstructor)) {
            return false;
        }
        return this.exceptionName === (<ExceptionConstructor> other).exceptionName
            && this.id === (<ExceptionConstructor> other).id;
    }

    construct(parameter: Value|undefined = undefined): ExceptionValue {
        return new ExceptionValue(this.exceptionName, parameter, this.id);
    }

    prettyPrint() {
        let result = this.exceptionName;
        if (this.id !== 0) {
            result += '/' + this.id;
        }
        return result;
    }

    isSimpleValue(): boolean {
        return false;
    }
}
