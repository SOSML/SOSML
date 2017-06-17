import { InternalCompilerError } from './errors';

export interface Type {
    prettyPrint(): string;

    // Returns the unified type, if this and other can be unified, or void, if they cannot be unified.
    // This function returns void instead of throwing an error because it does not know the error location.
    // TODO: probably needs a helper function to find all used type variables and potentially rename them
    unify(other: Type): Type | undefined;

    simplify(): Type;
}

// TODO: better name
export enum PrimitiveTypes { INT, REAL, WORD, STRING, CHAR, BOOL }

export class PrimitiveType implements Type {
    constructor(public type: PrimitiveTypes) {}

    prettyPrint(): string {
        // TODO
        throw new InternalCompilerError(0, 'not yet implemented');
    }

    unify(other: Type): Type | undefined {
        // TODO
        throw new InternalCompilerError(0, 'not yet implemented');
    }

    simplify(): Type { return this; }
}

export class TypeVariable implements Type {
    constructor(public name: string) {}

    prettyPrint(): string {
        // TODO
        throw new InternalCompilerError(0, 'not yet implemented');
    }

    unify(other: Type): Type | undefined {
        // TODO
        throw new InternalCompilerError(0, 'not yet implemented');
    }
    simplify(): Type { return this; }
}

export class Record implements Type {
    constructor(public elements: Map<string, Type>, public complete: boolean = true) {}

    prettyPrint(): string {
        // TODO
        throw new InternalCompilerError(0, 'not yet implemented');
    }

    unify(other: Type): Type | undefined {
        // TODO
        throw new InternalCompilerError(0, 'not yet implemented');
    }

    simplify(): Type {
        // TODO
        throw new InternalCompilerError(0, 'not yet implemented');
    }
}

export class Function implements Type {
    constructor(public parameterType: Type, public returnType: Type) {}

    prettyPrint(): string {
        // TODO
        throw new InternalCompilerError(0, 'not yet implemented');
    }

    unify(other: Type): Type | undefined {
        // TODO
        throw new InternalCompilerError(0, 'not yet implemented');
    }

    simplify(): Type {
        return new Function(this.parameterType.simplify(), this.returnType.simplify());
    }
}

// a custom type using type constructors
export class CustomType implements Type {
    // fullName: a unique name for this type
    // typeArguments: instantiations for any type variables this datatype may have
    constructor(public fullName: string, public typeArguments: Type[]) {}

    prettyPrint(): string {
        // TODO
        throw new InternalCompilerError(0, 'not yet implemented');
    }

    unify(other: Type): Type | undefined {
        // TODO
        throw new InternalCompilerError(0, 'not yet implemented');
    }

    simplify(): Type {
        // TODO
        throw new InternalCompilerError(0, 'not yet implemented');
    }
}

// this is a derived form used only for type annotations
export class Tuple implements Type {
    constructor(public elements: Type[]) {}

    prettyPrint(): string {
        // TODO
        throw new InternalCompilerError(0, 'not yet implemented');
    }

    unify(other: Type): Type | undefined {
        // TODO
        throw new InternalCompilerError(0, 'called Type.unify on a derived form');
    }

    simplify(): Type {
        // TODO
        throw new InternalCompilerError(0, 'not yet implemented');
    }
}
