/*
 * Contains classes to represent SML values, e.g. int, string, functions, …
 */

import { State } from './state';
import { Declaration } from './declarations.ts';
import { InternalInterpreterError } from './errors';

export abstract class Value {
    abstract prettyPrint(): string;
}

export interface AllowsEquality {
    equals(other: Value): boolean;
}

export class Integer extends Value implements AllowsEquality {
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
        throw new InternalInterpreterError(0, 'Cannot compare "int" to "'
            + val.constructor.name + '".');
    }

    equals(value: Value): boolean {
        return this.compareTo(value) === 0;
    }
}

export class Real extends Value implements AllowsEquality {
    constructor(public value: number) {
        super();
    }

    prettyPrint(): string {
        return String(this.value);
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
        throw new InternalInterpreterError(0, 'Cannot compare "real" to "'
            + val.constructor.name + '".');
    }

    equals(value: Value): boolean {
        return this.compareTo(value) === 0;
    }
}

export class Record extends Value implements AllowsEquality {
    constructor(public entries: Map<string, Value>) {
        super();
    }

    prettyPrint(): string {
        // TODO
        throw new InternalInterpreterError(0, 'not yet implemented');
    }

    equals(value: Value): boolean {

        throw new InternalInterpreterError(0, 'not yet implemented');
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
export class CustomValue extends Value implements AllowsEquality {
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

    equals(value: Value): boolean {

        throw new InternalInterpreterError(0, 'not yet implemented');
    }
}
