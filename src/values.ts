/*
 * Contains classes to represent SML values, e.g. int, string, functions, …
 */

import { State, IdentifierStatus } from './state';
import { InternalInterpreterError, EvaluationError, Warning } from './errors';
import { int, char, IdentifierToken } from './tokens';
import { Match } from './expressions';
import { MemBind, EvaluationStack } from './evaluator';

export abstract class Value {
    abstract toString(state: State|undefined|undefined): string;
    equals(other: Value): boolean {
        throw new InternalInterpreterError(-1,
            'Tried comparing incomparable things.');
    }
}

export class ReferenceValue extends Value {
    constructor(public address: number) {
        super();
    }

    equals(other: ReferenceValue) {
        return this.address === other.address;
    }

    toString(state: State|undefined) {
        if (state === undefined) {
            return '$' + this.address;
        } else {
            if (state.getCell(this.address) !== undefined) {
                return 'ref ' + (<Value> state.getCell(this.address)).toString(state);
            } else {
                throw new EvaluationError(-1, 'Ouch, you may not de-reference "$'
                    + this.address + '".');
            }
        }
    }
}

export class BoolValue extends Value {
    constructor(public value: boolean) {
        super();
    }

    equals(other: BoolValue) {
        return this.value === other.value;
    }

    toString(state: State|undefined) {
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

    toString(state: State|undefined): string {
        return '#' + new StringValue(this.value).toString(state);
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
                    'Is this a char list? I can\'t implode "' + list.constructorName + '".');
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
                        'Is this a char list? I can\'t implode "' + list.constructorName + '".');
                }
            } else {
                throw new InternalInterpreterError(-1,
                    'Is this a char list? I can\'t implode "' + list.constructorName + '".');
            }
        }

        return new StringValue(str);
    }

    constructor(public value: string) {
        super();
    }

    toString(state: State|undefined): string {
        let pretty = '';
        for (let chr of this.value) {
            switch (chr) {
                case '\n': pretty += '\\n'; break;
                case '\t': pretty += '\\t'; break;
                case '\r': pretty += '\\r'; break;
                case '\x07': pretty += '\\a'; break;
                case '\b': pretty += '\\b'; break;
                case '\v': pretty += '\\v'; break;
                case '\f': pretty += '\\f'; break;
                case '\x7F': pretty += '\\127'; break;
                case '\xFF': pretty += '\\255'; break;
                default:
                    if (chr.charCodeAt(0) < 32) {
                        pretty += '\\^' + String.fromCharCode(chr.charCodeAt(0) + 64);
                    } else {
                        pretty += chr;
                    }
                    break;
            }
        }
        return '"' + pretty + '"';
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

    toString(state: State|undefined): string {
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

    toString(state: State|undefined): string {
        let str = '' + this.value;
        return str.replace(/-/, '~');
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

    toString(state: State|undefined): string {
        let str = '' + this.value;
        if (str.search(/\./) === -1) {
            str += '.0';
        }
        return str.replace(/-/, '~');
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

    toString(state: State|undefined): string {
        let isTuple = this.entries.size !== 1;
        for (let i = 1; i <= this.entries.size; ++i) {
            if (!this.entries.has('' + i)) {
                isTuple = false;
            }
        }

        if (isTuple) {
            let res: string = '(';
            for (let i = 1; i <= this.entries.size; ++i) {
                if (i > 1) {
                    res += ', ';
                }
                let sub = this.entries.get('' + i);
                if (sub !== undefined) {
                    res += sub.toString(state);
                } else {
                    throw new InternalInterpreterError(-1,
                        'How did we loose this value? It was there before. I promise…');
                }
            }
            return res + ')';
        }

        let result: string = '{ ';
        let first: boolean = true;
        this.entries.forEach((value: Value, key: string) => {
            if (!first) {
                result += ', ';
            } else {
                first = false;
            }
            result += key + ' = ' + value.toString(state);
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

    toString(state: State|undefined): string {
        return 'fn';
    }

    // Computes the function on the given argument,
    // returns [result, is thrown]
    compute(callStack: EvaluationStack, argument: Value, memory: MemBind): void {
        // adjoin the bindings in this.state into the state
        let nstate = this.state.getNestedState(this.state.id);
        for (let i = 0; i < this.recursives.length; ++i) {
            if (this.recursives[i][1] instanceof FunctionValue) {
                nstate.setDynamicValue(this.recursives[i][0],
                    new FunctionValue(this.state, this.recursives,
                        (<FunctionValue> this.recursives[i][1]).body), IdentifierStatus.VALUE_VARIABLE);
            } else {
                nstate.setDynamicValue(this.recursives[i][0], this.recursives[i][1],
                    IdentifierStatus.VALUE_VARIABLE);
            }
        }

        for (let i = 0; i < memory.length; ++i) {
            nstate.setCell(memory[i][0], memory[i][1]);
        }
        callStack.push({
            'next': this.body,
            'params': {'state': nstate, 'recResult': undefined, 'value': argument}
        });
        return;
    }

    equals(other: Value): boolean {
        throw new InternalInterpreterError(-1, 'You simply cannot compare "' + this.toString(undefined)
            + '" and "' + other.toString(undefined) + '".');
    }
}

// Values that were constructed from type constructors
export class ConstructedValue extends Value {
    constructor(public constructorName: string,
                public argument: Value|undefined = undefined,
                public id: number = 0) {
        super();
    }

    toString(state: State|undefined): string {
        if (this.constructorName === '::') {
            let res = '[';

            let list: ConstructedValue = this;
            while (list.constructorName !== 'nil') {
                if (list.constructorName !== '::') {
                    throw new InternalInterpreterError(-1,
                        'Is this even a list? 1 "' + list.constructorName + '".');
                }
                let arg = list.argument;
                if (arg instanceof RecordValue && arg.entries.size === 2) {
                    let a1 = arg.getValue('1');
                    let a2 = arg.getValue('2');
                    if (a1 instanceof Value && a2 instanceof ConstructedValue) {
                        if (list !== this) {
                            res += ', ';
                        }
                        res += a1.toString(state);
                        list = a2;
                    } else {
                        throw new InternalInterpreterError(-1,
                            'Is this even a list? 2 "' + list.constructorName + '".');
                    }
                } else {
                    throw new InternalInterpreterError(-1,
                        'Is this even a list? 3 "' + list.constructorName + '".');
                }
            }

            return res + ']';
        } else if (this.constructorName === 'nil') {
            return '[]';
        }

        if (state !== undefined) {
            let infix = state.getInfixStatus(new IdentifierToken(this.constructorName, -1));
            if (infix !== undefined
                && infix.infix
                && this.argument instanceof RecordValue && this.argument.entries.size === 2) {
                let left = this.argument.getValue('1');
                let right = this.argument.getValue('2');
                if (left instanceof Value && right instanceof Value) {
                    let res: string = '(' + left.toString(state);
                    res += ' ' + this.constructorName;
                    if (this.id > 0) {
                        res += '/' + this.id;
                    }
                    res += ' ' + right.toString(state);
                    return res + ')';
                }
            }
        }

        let result: string =  this.constructorName;
        if (this.id > 0) {
            result += '/' + this.id;
        }
        if (this.argument) {
            result += ' ' + this.argument.toString(state);
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
}

export class ExceptionValue extends Value {
    constructor(public constructorName: string,
                public argument: Value|undefined = undefined,
                public id: number = 0) {
        super();
    }

    toString(state: State|undefined): string {
        let result: string = this.constructorName;
        if (this.id > 0) {
            result += '/' + this.id;
        }
        if (this.argument) {
            result += ' ' + this.argument.toString(state);
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
}


export class PredefinedFunction extends Value {
    constructor(public name: string,
                public apply: (arg: Value|undefined) => [Value, boolean, Warning[]]) {
        super();
    }

    toString(state: State|undefined): string {
        return 'fn';
    }

    equals(other: Value): boolean {
        if (!(other instanceof PredefinedFunction)) {
            return false;
        }
        return this.name === (<PredefinedFunction> other).name;
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

    toString(state: State|undefined) {
        let result = this.constructorName;
        if (this.id > 0) {
            result += '/' + this.id;
        }
        return result;
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

    toString(state: State|undefined) {
        let result = this.exceptionName;
        if (this.id > 0) {
            result += '/' + this.id;
        }
        return result;
    }
}
