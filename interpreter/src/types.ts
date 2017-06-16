export abstract class Type {
    abstract prettyPrint(): void;

    // Returns the unified type, if this and other can be unified, or void, if they cannot be unified.
    // This function returns void instead of throwing an error because it does not know the error location.
    // TODO: probably needs a helper function to find all used type variables and potentially rename them
    abstract unify(other: Type): Type | void;
}

// TODO: better name
export enum PrimitiveTypes { INT, REAL, WORD, STRING, CHAR, BOOL }

export class PrimitiveType implements Type {
    constructor(public type: PrimitiveTypes) {}

    prettyPrint(): void {
        // TODO
    }

    unify(other: Type): Type | void {
        // TODO
    }
}

export class TypeVariable implements Type {
    constructor(public name: string) {}

    prettyPrint(): void {
        // TODO
    }

    unify(other: Type): Type | void {
        // TODO
    }
}

export class Record implements Type {
    constructor(public elements: Map<string, Type>, public complete: boolean = true) {}

    prettyPrint(): void {
        // TODO
    }

    unify(other: Type): Type | void {
        // TODO
    }
}

export class Function implements Type {
    constructor(public parameterType: Type, public returnType: Type) {}

    prettyPrint(): void {
        // TODO
    }

    unify(other: Type): Type | void {
        // TODO
    }
}

// a custom type using type constructors
export class CustomType implements Type {
    // fullName: a unique name for this type
    // typeArguments: instantiations for any type variables this datatype may have
    constructor(public fullName: string, typeArguments: Type[]) {}

    prettyPrint(): void {
        // TODO
    }

    unify(other: Type): Type | void {
        // TODO
    }
}
