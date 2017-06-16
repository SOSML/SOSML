/*
 * Contains classes to represent SML values, e.g. int, string, functions, …
 */

import { State } from './state';
import { ASTNode } from './ast';
import { InternalCompilerError } from './errors';

export abstract class Value {
    abstract prettyPrint(): string;
}

export class Integer extends Value {
    value: number;

    prettyPrint(): string {
        return String(this.value);
    }
}

export class Record extends Value {
    entries: Map<string, Value>;

    prettyPrint(): string {
        // TODO
        throw new InternalCompilerError(0, 'not yet implemented');
    }
}

export class Lambda extends Value {
    // TODO: we only need part of the state
    state: State;
    body: ASTNode;

    prettyPrint(): string {
        // TODO
        throw new InternalCompilerError(0, 'not yet implemented');
    }
}

// Values that were constructed from type constructors
export class CustomValue {
    constructorName: string;
    arguments: Value[];

    prettyPrint(): string {
        let result: string = '(' + this.constructorName;
        for (let i: number = 0; i < this.arguments.length; ++i) { // TODO: figure out how range based for-loops work
            result += ' ' + this.arguments[i];
        }
        return result + ')';
    }
}
