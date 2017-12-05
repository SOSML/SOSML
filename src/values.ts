/*
 * Contains classes to represent SML values, e.g. int, string, functions, …
 */

import { State, IdentifierStatus } from './state';
import { InternalInterpreterError, EvaluationError, Warning } from './errors';
import { int, char, IdentifierToken } from './tokens';
import { Match } from './expressions';
import { EvaluationStack } from './evaluator';

export let MAXINT = 1073741823;
export let MININT = -1073741824;

export class PrintCounter {
    constructor(public charactersLeft: number) {
    }
}

export abstract class Value {
    abstract pcToString(state: State|undefined|undefined, pc: PrintCounter): string;
    toString(state: State|undefined|undefined, length: number = 120): string {
        return this.pcToString(state, new PrintCounter(length));
    }
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

    pcToString(state: State|undefined, pc: PrintCounter) {
        if (state === undefined) {
            let ret = '$' + this.address;
            pc.charactersLeft -= ret.length;
            return ret;
        } else {
            if (state.getCell(this.address) !== undefined) {
                pc.charactersLeft -= 4;
                return 'ref ' + (<Value> state.getCell(this.address)).pcToString(state, pc);
            } else {
                throw new EvaluationError(-1, 'Ouch, you may not de-reference "$'
                    + this.address + '".');
            }
        }
    }
}

export class VectorValue extends Value {
    constructor(public entries: Value[] = []) {
        super();
    }

    equals(other: VectorValue) {
        if (this.entries.length !== other.entries.length) {
            return false;
        }
        for (let i = 0; i < this.entries.length; ++i) {
            if (!this.entries[i].equals(other.entries[i])) {
                return false;
            }
        }
        return true;
    }

    pcToString(state: State|undefined, pc: PrintCounter) {
        let res = '#[';
        pc.charactersLeft -= 3;
        for (let i = 0; i < this.entries.length; ++i) {
            if (i > 0) {
                res += ', ';
                pc.charactersLeft -= 2;
            }
            if (pc.charactersLeft > 0) {
                let reserve = 0;
                if (i < this.entries.length) {
                    reserve = Math.floor(pc.charactersLeft / 2);
                }
                pc.charactersLeft -= reserve;
                res += this.entries[i].pcToString(state, pc);
                pc.charactersLeft += reserve;
            } else {
                res += '…';
                break;
            }
        }
        return res += ']';
    }
}

export class ArrayValue extends Value {
    // Array : Collection of memory cells
    constructor(public address: number, public length: number) {
        super();
    }

    equals(other: ArrayValue) {
        return this.address === other.address;
    }

    pcToString(state: State|undefined, pc: PrintCounter) {
        if (state === undefined) {
            let ret = '[|$' + this.address + '...$' + (this.address + this.length - 1) + '|]';
            pc.charactersLeft -= ret.length;
            return ret;
        } else {
            let res = '[|';
            pc.charactersLeft -= 4;
            for (let i = 0; i < this.length; ++i) {
                if (i > 0) {
                    res += ', ';
                    pc.charactersLeft -= 2;
                }

                if (pc.charactersLeft > 0) {
                    if (state.getCell(this.address + i) !== undefined) {
                        let reserve = 0;
                        if (i < this.length) {
                            reserve = Math.floor(pc.charactersLeft / 2);
                        }
                        pc.charactersLeft -= reserve;
                        res += (<Value> state.getCell(this.address + i)).pcToString(state, pc);
                        pc.charactersLeft += reserve;
                    } else {
                        throw new EvaluationError(-1, 'Ouch, you may not de-reference "$'
                            + (this.address + i) + '".');
                    }
                } else {
                    res += '…';
                    break;
                }
            }
            return res += '|]';
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

    pcToString(state: State|undefined, pc: PrintCounter) {
        if (this.value) {
            pc.charactersLeft -= 4;
            return 'true';
        } else {
            pc.charactersLeft -= 5;
            return 'false';
        }
    }
}

export class CharValue extends Value {
    constructor(public value: char) {
        super();
    }

    pcToString(state: State|undefined, pc: PrintCounter): string {
        pc.charactersLeft -= 1;
        let ret = '#' + new StringValue(this.value).pcToString(state, pc);
        return ret;
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

    pcToString(state: State|undefined, pc: PrintCounter): string {
        let pretty = '';
        pc.charactersLeft -= 2;
        for (let chr of this.value) {
            if (pc.charactersLeft < 0) {
                pretty += '…';
                break;
            }
            pc.charactersLeft -= 1;
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
                        let ch = '\\^' + String.fromCharCode(chr.charCodeAt(0) + 64);
                        pretty += ch;
                        pc.charactersLeft -= ch.length - 1;
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

    pcToString(state: State|undefined, pc: PrintCounter): string {
        let ret = '' + this.value;
        pc.charactersLeft -= ret.length;
        return ret;
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
    hasOverflow(): boolean { return this.value > MAXINT || this.value < MININT; }
}


export class Integer extends Value {
    constructor(public value: int) {
        super();
    }

    pcToString(state: State|undefined, pc: PrintCounter): string {
        let str = '' + this.value;
        pc.charactersLeft -= str.length;
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
    modulo(other: Integer): Integer {
        return new Integer(this.value - (Math.floor(this.value / other.value)) * other.value);
    }
    toReal(): Real { return new Real(this.value); }
    hasOverflow(): boolean { return this.value > MAXINT || this.value < MININT; }
}

export class Real extends Value {
    constructor(public value: number) {
        super();
    }

    pcToString(state: State|undefined, pc: PrintCounter): string {
        let str = '' + this.value;
        if (str.search(/\./) === -1) {
            str += '.0';
        }
        pc.charactersLeft -= str.length;
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

    pcToString(state: State|undefined, pc: PrintCounter): string {
        let isTuple = this.entries.size !== 1;
        for (let i = 1; i <= this.entries.size; ++i) {
            if (!this.entries.has('' + i)) {
                isTuple = false;
            }
        }

        if (isTuple) {
            let res: string = '(';
            pc.charactersLeft -= 2;
            for (let i = 1; i <= this.entries.size; ++i) {
                if (i > 1) {
                    res += ', ';
                    pc.charactersLeft -= 2;
                }
                let sub = this.entries.get('' + i);
                if (sub !== undefined) {
                    if (pc.charactersLeft > 0) {
                        let reserve = 0;
                        if (i < this.entries.size) {
                            reserve = Math.floor(pc.charactersLeft / 2);
                        }
                        pc.charactersLeft -= reserve;
                        res += sub.pcToString(state, pc);
                        pc.charactersLeft += reserve;
                    } else {
                        res += '…';
                        break;
                    }
                } else {
                    throw new InternalInterpreterError(-1,
                        'How did we loose this value? It was there before. I promise…');
                }
            }
            return res + ')';
        }

        let result: string = '{';
        pc.charactersLeft -= 2;
        let first: boolean = true;
        let skip: boolean = false;
        let j = 0;
        this.entries.forEach((value: Value, key: string) => {
            if (skip) {
                return;
            }
            if (!first) {
                result += ', ';
                pc.charactersLeft -= 2;
            } else {
                first = false;
            }
            if (pc.charactersLeft > 0) {
                let reserve = 0;
                if (j < this.entries.size) {
                    reserve = Math.floor(pc.charactersLeft / 2);
                }
                pc.charactersLeft -= reserve;
                result += key + ' = ' + value.pcToString(state, pc);
                pc.charactersLeft += reserve;
            } else {
                result += '…';
                skip = true;
            }
            ++j;
        });
        return result + '}';
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

    pcToString(state: State|undefined, pc: PrintCounter): string {
        pc.charactersLeft -= 2;
        return 'fn';
    }

    // Computes the function on the given argument,
    // returns [result, is thrown]
    compute(callStack: EvaluationStack, argument: Value, modifiable: State): void {
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
        callStack.push({
            'next': this.body,
            'params': {'state': nstate, 'recResult': undefined, 'modifiable': modifiable, 'value': argument}
        });
        return;
    }

    equals(other: Value): boolean {
        throw new InternalInterpreterError(-1, 'You simply cannot compare "'
            + this.pcToString(undefined, new PrintCounter(20))
            + '" and "' + other.pcToString(undefined, new PrintCounter(20)) + '".');
    }
}

// Values that were constructed from type constructors
export class ConstructedValue extends Value {
    constructor(public constructorName: string,
                public argument: Value|undefined = undefined,
                public id: number = 0) {
        super();
    }

    pcToString(state: State|undefined, pc: PrintCounter): string {
        if (this.constructorName === '::') {
            let res = '[';
            pc.charactersLeft -= 2;

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
                            pc.charactersLeft -= 2;
                        }
                        if (pc.charactersLeft > 0) {
                            let reserve = 0;
                            if (a2.constructorName !== 'nil') {
                                reserve = Math.floor(pc.charactersLeft / 2);
                            }
                            pc.charactersLeft -= reserve;
                            res += a1.pcToString(state, pc);
                            pc.charactersLeft += reserve;
                        } else {
                            res += '…';
                            break;
                        }
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
            pc.charactersLeft -= 2;
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
                    pc.charactersLeft -= 4 + this.constructorName.length;
                    let reserve = Math.floor(pc.charactersLeft / 2);
                    pc.charactersLeft -= reserve;
                    let res: string = '(';
                    if (pc.charactersLeft > 0) {
                        res += left.pcToString(state, pc);
                    } else {
                        res += '…';
                    }
                    pc.charactersLeft += reserve;
                    res += ' ' + this.constructorName;
                    if (this.id > 0) {
                        let idtext = '/' + this.id;
                        res += idtext;
                        pc.charactersLeft -= idtext.length;
                    }
                    if (pc.charactersLeft > 0) {
                        res += ' ' + right.pcToString(state, pc);
                    } else {
                        res += ' …';
                    }
                    return res + ')';
                }
            }
        }

        let result: string = '';
        result += this.constructorName;
        pc.charactersLeft -= this.constructorName.length + 1;
        if (this.id > 0) {
            let idtext = '/' + this.id;
            result += idtext;
            pc.charactersLeft -= idtext.length;
        }
        if (this.argument) {
            if (pc.charactersLeft > 0) {
                result += ' ';
                if (this.argument instanceof ConstructedValue
                    && (<ConstructedValue> this.argument).argument) {
                    result += '(';
                } else if (this.argument instanceof ExceptionValue
                    && (<ExceptionValue> this.argument).argument) {
                    result += '(';
                }
                result += this.argument.pcToString(state, pc);
                if (this.argument instanceof ConstructedValue
                    && (<ConstructedValue> this.argument).argument) {
                    result += ')';
                } else if (this.argument instanceof ExceptionValue
                    && (<ExceptionValue> this.argument).argument) {
                    result += ')';
                }
            } else {
                result += ' …';
            }
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

    pcToString(state: State|undefined, pc: PrintCounter): string {
        let result: string = this.constructorName;
        pc.charactersLeft -= this.constructorName.length + 1;
        if (this.id > 0) {
            let idtext = '/' + this.id;
            result += idtext;
            pc.charactersLeft -= idtext.length;
        }
        if (this.argument) {
            if (pc.charactersLeft > 0) {
                result += ' ' + this.argument.pcToString(state, pc);
            } else {
                result += ' …';
            }
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

    pcToString(state: State|undefined, pc: PrintCounter): string {
        pc.charactersLeft -= 2;
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

    pcToString(state: State|undefined, pc: PrintCounter) {
        let result: string = this.constructorName;
        pc.charactersLeft -= this.constructorName.length;
        if (this.id > 0) {
            let idtext = '/' + this.id;
            result += idtext;
            pc.charactersLeft -= idtext.length;
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

    pcToString(state: State|undefined, pc: PrintCounter) {
        let result: string = this.exceptionName;
        pc.charactersLeft -= this.exceptionName.length;
        if (this.id > 0) {
            let idtext = '/' + this.id;
            result += idtext;
            pc.charactersLeft -= idtext.length;
        }
        return result;
    }
}
