/*
 * Contains classes to represent SML values, e.g. int, string, functions, …
 */

import { State } from './state';
import { Declaration } from './declarations.ts';
import { InternalInterpreterError } from './errors';

export abstract class Value {
    abstract prettyPrint(): string;
    equals(other: Value): boolean {
        throw new InternalInterpreterError(-1,
            'Tried comparing incomparable things.');
    }
}

export class Integer extends Value {
    constructor(public value: number) {
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
}

export class RecordValue extends Value {
    constructor(public entries: Map<string, Value>) {
        super();
    }

    prettyPrint(): string {
        // TODO
        throw new InternalInterpreterError(0, 'not yet implemented');
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
    constructor(public state: State, public body: Declaration) {
        super();
    }

    prettyPrint(): string {
        // TODO
        throw new InternalInterpreterError(0, 'not yet implemented');
    }
}

// Values that were constructed from type constructors
export class CustomValue extends Value {
    constructor(public constructorName: string, public argument: Value) {
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
        if (!(other instanceof CustomValue)) {
            return false;
        }
        if (this.constructorName !== (<CustomValue> other).constructorName) {
            return false;
        }
        return this.argument.equals((<CustomValue> other).argument);
    }
}
