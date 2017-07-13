import { InternalInterpreterError, Position } from './errors';
import { Token } from './lexer';

export interface Type {
    prettyPrint(): string;

    // Returns the unified type, if this and other can be unified, or void, if they cannot be unified.
    // This function returns void instead of throwing an error because it does not know the error location.
    // TODO: probably needs a helper function to find all used type variables and potentially rename them
    unify(other: Type): Type | undefined;

    simplify(): Type;
}

    /*
// TODO: better name
export enum PrimitiveTypes { int, real, word, string, char, bool }

export class PrimitiveType implements Type {
    constructor(public position: Position, public type: PrimitiveTypes) {}

    prettyPrint(): string {
        return PrimitiveTypes[this.type];
    }

    unify(other: Type): Type | undefined {
        // TODO
        throw new InternalInterpreterError(0, 'not yet implemented');
    }

    simplify(): Type { return this; }
}
     */

export class TypeVariable implements Type {
    constructor(public position: Position, public name: string) {}

    prettyPrint(): string {
        return this.name;
    }

    unify(other: Type): Type | undefined {
        // TODO
        throw new InternalInterpreterError(0, 'not yet implemented');
    }
    simplify(): Type { return this; }
}

export class RecordType implements Type {
    constructor(public position: Position,
                public complete: boolean,
                public entries: [string, Type][]) {}

    prettyPrint(): string {
        // TODO: print as Tuple if possible
        let result: string = '{';
        let first: boolean = true;
        for (let i: number = 0; i < this.entries.length; ++i) {
            if (!first) {
                result += ', ';
            }
            first = false;
            result += this.entries[i][0] + ': ' + this.entries[i][1].prettyPrint();
        }
        if (!this.complete) {
            if (!first) {
                result += ', ';
            }
            result += '...';
        }
        return result + '}';
    }

    unify(other: Type): Type | undefined {
        // TODO
        throw new InternalInterpreterError(0, 'not yet implemented');
    }

    simplify(): Type {
        let newEntries: [string, Type][] = [];
        for (let i: number = 0; i < this.entries.length; ++i) {
            let e: [string, Type] = this.entries[i];
            newEntries.push([e[0], e[1].simplify()]);
        }
        return new RecordType(this.position, this.complete, newEntries);
    }
}

export class FunctionType implements Type {
    constructor(public position: Position,
                public parameterType: Type,
                public returnType: Type) {}

    prettyPrint(): string {
        return '( ' + this.parameterType.prettyPrint()
            + ' -> ' + this.returnType.prettyPrint() + ' )';
    }

    unify(other: Type): Type | undefined {
        // TODO
        throw new InternalInterpreterError(0, 'not yet implemented');
    }

    simplify(): Type {
        return new FunctionType(this.position, this.parameterType.simplify(), this.returnType.simplify());
    }
}

// a custom type using type constructors
export class CustomType implements Type {
    // fullName: a unique name for this type
    // typeArguments: instantiations for any type variables this datatype may have
    constructor(public position: Position,
                public fullName: Token,
                public typeArguments: Type[]) {}

    prettyPrint(): string {
        let result: string = '';
        if (this.typeArguments.length > 1) {
            result += '( ';
        }
        for (let i = 0; i < this.typeArguments.length; ++i) {
            if (i > 0) {
                result += ', ';
            }
            result += this.typeArguments[i].prettyPrint();
        }
        if (this.typeArguments.length > 1) {
            result += ' )';
        }
        if (this.typeArguments.length > 0) {
            result += ' ';
        }
        result += this.fullName.getText();
        return result;
    }

    unify(other: Type): Type | undefined {
        // TODO
        throw new InternalInterpreterError(0, 'not yet implemented');
    }

    simplify(): Type {
        let ntypes: Type[] = [];
        for (let i = 0; i < this.typeArguments.length; ++i) {
            ntypes.push(this.typeArguments[i].simplify());
        }
        return new CustomType(this.position, this.fullName, ntypes);
    }
}

// this is a derived form used only for type annotations
export class TupleType implements Type {
    constructor(public position: Position,
                public elements: Type[]) {}

    prettyPrint(): string {
        let result: string = '( ';
        for (let i: number = 0; i < this.elements.length; ++i) {
            if (i > 0) {
                result += ' * ';
            }
            result += this.elements[i].prettyPrint();
        }
        return result + ' )';
    }

    unify(other: Type): Type | undefined {
        throw new InternalInterpreterError(0, 'called Type.unify on a derived form');
    }

    simplify(): Type {
        let entries: [string, Type][] = [];
        for (let i: number = 0; i < this.elements.length; ++i) {
            entries[String(i + 1)] = this.elements[i].simplify();
        }
        return new RecordType(this.position, true, entries);
    }
}
