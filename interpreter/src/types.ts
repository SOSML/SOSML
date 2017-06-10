export interface Type {
    // TODO: prettyPrint(indentation: number): void;

    // Returns the unified type, if this and other can be unified, or void, if they cannot be unified.
    // This function returns void instead of throwing an error because it does not know the error location.
    // TODO: probably needs a helper function to find all used type variables and potentially rename them
    unify(other: Type): Type | void;
}

export enum PrimitiveTypes { INT, REAL, WORD, STRING, CHAR, BOOL }

export class PrimitiveType implements Type {
    type: PrimitiveTypes;

    unify(other: Type): Type | void {
        // TODO
    }
}

export class TypeVariable implements Type {
    name: string;

    unify(other: Type): Type | void {
        // TODO
    }
}

export class Record implements Type {
    constructor(public elements: Map<string, Type>) {}

    unify(other: Type): Type | void {
        // TODO
    }
}

export class Function implements Type {
    parameterType: Type;
    returnType: Type;

    unify(other: Type): Type | void {
        // TODO
    }
}

// a custom type using type constructors
export class CustomType implements Type {
    fullName: string; // a unique name for this type
    typeArguments: Type[]; // instantiations for any type variables this datatype may have

    unify(other: Type): Type | void {
        // TODO
    }
}
