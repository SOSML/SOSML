import { InternalInterpreterError } from './errors';

export interface Type {
    prettyPrint(): string;

    // Returns the unified type, if this and other can be unified, or void, if they cannot be unified.
    // This function returns void instead of throwing an error because it does not know the error location.
    // TODO: probably needs a helper function to find all used type variables and potentially rename them
    unify(other: Type): Type | undefined;

    simplify(): Type;
}

// TODO: better name
export enum PrimitiveTypes { int, real, word, string, char, bool }

export class PrimitiveType implements Type {
    constructor(public type: PrimitiveTypes) {}

    prettyPrint(): string {
        return PrimitiveTypes[this.type];
    }

    unify(other: Type): Type | undefined {
        // TODO
        throw new InternalInterpreterError(0, 'not yet implemented');
    }

    simplify(): Type { return this; }
}

export class TypeVariable implements Type {
    constructor(public name: string) {}

    prettyPrint(): string {
        return name;
    }

    unify(other: Type): Type | undefined {
        // TODO
        throw new InternalInterpreterError(0, 'not yet implemented');
    }
    simplify(): Type { return this; }
}

export class Record implements Type {
    constructor(public elements: Map<string, Type>, public complete: boolean = true) {}

    prettyPrint(): string {
        // TODO: print as Tuple if possible
        let result: string = '{';
        let first: boolean = true;
        this.elements.forEach((type: Type, key: string) => {
            if (!first) {
                result += ', ';
            } else {
                first = false;
            }
            result += key + ' : ' + type.prettyPrint();
        });
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
        let newElements: Map<string, Type> = new Map<string, Type>();
        this.elements.forEach((type: Type, key: string) => {
            newElements[key] = type.simplify();
        });
        return new Record(newElements, this.complete);
    }
}

export class Function implements Type {
    constructor(public parameterType: Type, public returnType: Type) {}

    prettyPrint(): string {
        return '(' + this.parameterType + ' -> ' + this.returnType + ')';
    }

    unify(other: Type): Type | undefined {
        // TODO
        throw new InternalInterpreterError(0, 'not yet implemented');
    }

    simplify(): Type {
        return new Function(this.parameterType.simplify(), this.returnType.simplify());
    }
}

// a custom type using type constructors
export class CustomType implements Type {
    // fullName: a unique name for this type
    // typeArguments: instantiations for any type variables this datatype may have
    constructor(public fullName: string, public typeArguments: TypeVariable[]) {}

    prettyPrint(): string {
        let result: string = '';
        if (this.typeArguments.length > 0) {
            result += '(';
        }
        for (let i: number = 0; i < this.typeArguments.length; ++i) {
            result += ' ' + this.typeArguments[i].prettyPrint();
        }
        result += this.fullName;
        if (this.typeArguments.length > 0) {
            result += ')';
        }
        return result;
    }

    unify(other: Type): Type | undefined {
        // TODO
        throw new InternalInterpreterError(0, 'not yet implemented');
    }

    simplify(): Type {
        return this;
    }
}

// this is a derived form used only for type annotations
export class Tuple implements Type {
    constructor(public elements: Type[]) {}

    prettyPrint(): string {
        let result: string = '(';
        for (let i: number = 0; i < this.elements.length; ++i) {
            if (i > 0) {
                result += ' * ';
            }
            result += ' ' + this.elements[i].prettyPrint();
        }
        return result + ')';
    }

    unify(other: Type): Type | undefined {
        throw new InternalInterpreterError(0, 'called Type.unify on a derived form');
    }

    simplify(): Type {
        let entries: Map<string, Type> = new Map<string, Type>();
        for (let i: number = 0; i < this.elements.length; ++i) {
            entries[String(i + 1)] = this.elements[i].simplify();
        }
        return new Record(entries, true);
    }
}
