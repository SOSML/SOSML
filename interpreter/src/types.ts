import { InternalInterpreterError, Position, InterpreterError } from './errors';
import { IdentifierToken, LongIdentifierToken } from './lexer';
import { State } from './state';

export class TypeUnificationError extends InterpreterError {
    constructor(public type1: Type, public type2: Type) {
        super(0, 'cannot unify ' + type2.prettyPrint() + ' with ' + type1.prettyPrint());
        Object.setPrototypeOf(this, TypeUnificationError.prototype);
    }
}

type Instantiations = [[string, Type][], [string, Type][]];

export abstract class Type {
    admitsEquality: boolean;

    // TODO: state may not accurately represent which type variables are free at the position where the
    // instantiation is made
    static findMapping(instantiations: Instantiations, state: State): Map<string, Type> {
        let mapping: Map<string, Type> = new Map<string, Type>();
        for (let i: number = 0; i < 2; ++i) {
            instantiations[i].forEach((element: [string, Type]) => {
                let name: string = element[0];
                let value: Type = element[1];
                if (mapping.has(name)) {
                    mapping.set(name, (mapping.get(name) as Type).unify(value, state));
                } else {
                    mapping.set(name, value);
                }
            });
        }
        return mapping;
    }

    abstract prettyPrint(): string;

    // Finds the unification of two types. If the types cannot be unified, throws a TypeUnificationException.
    // In the notation of the SML Definition, unify returns the most general type that is generalised by both this
    // and other. (chapter 4.5)
    // TODO: free variables are currently ignored, and there are problems with type variable naming
    unify(other: Type, state: State, errorLocation: Position = 0): Type {
        if (this.equals(other)) {
            return this;
        }

        let instantiations: Instantiations = [[], []];
        try {
            this.findInstantiations(other, instantiations);
            let mapping: Map<string, Type> = Type.findMapping(instantiations, state);
            let result: Type = this.replaceTypeVariables(mapping);
            result = this.unifyImpl(result);
            result = other.unifyImpl(result);
            return result;
        } catch (e) {
            if (e instanceof TypeUnificationError) {
                e.position = errorLocation;
            }
            throw e;
        }
    }

    findInstantiations(other: Type, instantiations: Instantiations): void {
        if (this instanceof TypeVariable) {
            instantiations[0].push([this.name, other]);
        } else if (other instanceof TypeVariable) {
            instantiations[1].push([other.name, this]);
            return;
        }
        this.findInstantiationsImpl(other, instantiations);
    }

    findInstantiationsImpl(other: Type, instantiations: Instantiations): void {
        // must be overloaded for Types which have children
    }

    abstract unifyImpl(other: Type): Type;

    // TODO: allow differently named Type Variables?
    abstract equals(other: any): boolean;

    findFreeTypeVariables(names: Set<string>, boundVariables: Set<string>): void {
        // TODO
    }

    replaceTypeVariables(mapping: Map<string, Type>): Type { return this; }

    simplify(): Type {
        return this;
    }
}

// TODO: better name
export enum PrimitiveTypes { int, real, word, string, char, bool }

export class PrimitiveType extends Type {
    constructor(public type: PrimitiveTypes, public position: Position = 0) {
        super();
        this.admitsEquality = true;
    }

    prettyPrint(): string {
        return PrimitiveTypes[this.type];
    }

    unifyImpl(other: Type): Type {
        if (this.equals(other)) {
            return other;
        } else {
            throw new TypeUnificationError(this, other);
        }
    }

    equals(other: any): boolean {
        return other instanceof PrimitiveType && this.type === other.type;
    }

    simplify(): Type { return this; }
}

export class TypeVariable extends Type {
    constructor(public name: string, public position: Position = 0) {
        super();
        this.admitsEquality = name.charAt(1) === '\'';
    }

    prettyPrint(): string {
        return this.name;
    }

    findFreeTypeVariables(names: Set<string>, boundVariables: Set<string>): void {
        if (!boundVariables.has(this.name)) {
            names.add(this.name);
        }
    }

    replaceTypeVariables(mapping: Map<string, Type>): Type {
        if (mapping.has(this.name)) {
            return mapping.get(this.name) as Type;
        } else {
            return this;
        }
    }

    unifyImpl(other: Type): Type {
        if (other.admitsEquality || !this.admitsEquality) {
            return other;
        } else {
            throw new TypeUnificationError(this, other);
        }
    }

    equals(other: any): boolean {
        return other instanceof TypeVariable && this.name === other.name;
    }
}

export class RecordType extends Type {
    constructor(public elements: Map<string, Type>, public complete: boolean = true, public position: Position = 0) {
        super();
        this.admitsEquality = true;
        this.elements.forEach((type: Type, key: string) => {
            if (!type.admitsEquality) {
                this.admitsEquality = false;
            }
        });
    }

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

    findFreeTypeVariables(names: Set<string>, boundVariables: Set<string>): void {
        this.elements.forEach((type: Type, key: string) => {
            type.findFreeTypeVariables(names, boundVariables);
        });
    }

    findInstantiationsImpl(other: Type, instantiations: Instantiations): void {
        if (!(other instanceof RecordType)) {
            throw new TypeUnificationError(this, other);
        }
        this.elements.forEach((type: Type, key: string) => {
            if (other.elements.has(key)) {
                type.findInstantiations(other.elements.get(key) as Type, instantiations);
            }
        });
    }

    simplify(): RecordType {
        let newElements: Map<string, Type> = new Map<string, Type>();
        this.elements.forEach((type: Type, key: string) => {
            newElements.set(key, type.simplify());
        });
        return new RecordType(newElements, this.complete);
    }

    replaceTypeVariables(mapping: Map<string, Type>): RecordType {
        let newElements: Map<string, Type> = new Map<string, Type>();
        this.elements.forEach((type: Type, key: string) => {
            newElements.set(key, type.replaceTypeVariables(mapping));
        });
        return new RecordType(newElements, this.complete);
    }

    unifyImpl(other: Type): RecordType {
        if (!(other instanceof RecordType)) {
            throw new TypeUnificationError(this, other);
        }
        let complete = this.complete || other.complete;
        let names: Set<string> = new Set<string>();
        let addNames = (ignored: Type, name: string) => {
            names.add(name);
        };
        this.elements.forEach(addNames);
        other.elements.forEach(addNames);

        if ((this.complete && names.size > this.elements.size)) {
            throw new TypeUnificationError(this, other);
        }

        let newElements: Map<string, Type> = new Map<string, Type>();
        if (other.complete) {
            names.forEach((name: string) => {
                if (!other.elements.has(name)) {
                    throw new TypeUnificationError(this, other);
                }
            });
        }

        names.forEach((name: string) => {
            if (this.elements.has(name)) {
                newElements.set(name, (this.elements.get(name) as Type).unifyImpl(other.elements.get(name) as Type));
            } else {
                newElements.set(name, other.elements.get(name) as Type);
            }
        });

        return new RecordType(newElements, complete);
    }

    equals(other: any): boolean {
        if (!(other instanceof RecordType) || this.complete !== other.complete) {
            return false;
        } else {
            if (other === this) {
                return true;
            }
            for (let name in this.elements) {
                if (!this.elements.hasOwnProperty(name)) {
                    if (!(this.elements.get(name) as Type).equals(other.elements.get(name))) {
                        return false;
                    }
                }
            }
            for (let name in other.elements) {
                if (!other.elements.hasOwnProperty(name)) {
                    if (!(other.elements.get(name) as Type).equals(this.elements.get(name))) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
}

export class FunctionType extends Type {
    constructor(public parameterType: Type, public returnType: Type, public position: Position = 0) {
        super();
        this.admitsEquality = parameterType.admitsEquality && returnType.admitsEquality;
    }

    prettyPrint(): string {
        return '( ' + this.parameterType.prettyPrint()
            + ' -> ' + this.returnType.prettyPrint() + ' )';
    }

    findFreeTypeVariables(names: Set<string>, boundVariables: Set<string>): void {
        this.parameterType.findFreeTypeVariables(names, boundVariables);
        this.returnType.findFreeTypeVariables(names, boundVariables);
    }

    findInstantiationsImpl(other: Type, instantiations: Instantiations): void {
        if (!(other instanceof FunctionType)) {
            throw new TypeUnificationError(this, other);
        }
        this.parameterType.findInstantiations(other.parameterType, instantiations);
        this.returnType.findInstantiations(other.returnType, instantiations);
    }

    simplify(): FunctionType {
        return new FunctionType(this.parameterType.simplify(), this.returnType.simplify(), this.position);
    }

    replaceTypeVariables(mapping: Map<string, Type>): FunctionType {
        return new FunctionType(this.parameterType.replaceTypeVariables(mapping),
            this.returnType.replaceTypeVariables(mapping));
    }

    unifyImpl(other: Type): Type {
        if (!(other instanceof FunctionType)) {
            throw new TypeUnificationError(this, other);
        }
        return new FunctionType(this.parameterType.unifyImpl(other.parameterType),
            this.returnType.unifyImpl(other.returnType));
    }

    equals(other: any): boolean {
        return other instanceof FunctionType && this.parameterType.equals(other.parameterType)
            && this.returnType.equals(other.returnType);
    }
}

// a custom type using type constructors
export class CustomType extends Type {
    public fullName: LongIdentifierToken;

    // fullName: a unique name for this type
    // typeArguments: instantiations for any type variables this datatype may have
    constructor(name: IdentifierToken | LongIdentifierToken,
                public typeArguments: Type[],
                public position: Position = 0) {
        super();
        if (name instanceof LongIdentifierToken) {
            this.fullName = name;
        } else {
            this.fullName = new LongIdentifierToken(name.text, name.position, [], name);
        }
    }

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
        result += this.fullName;
        if (this.typeArguments.length > 0) {
            result += ' ';
        }
        result += this.fullName.getText();
        return result;
    }

    findFreeTypeVariables(names: Set<string>, boundVariables: Set<string>): void {
        throw new InternalInterpreterError(0, 'not yet implemented');
    }

    findInstantiationsImpl(other: Type, instantiations: Instantiations): void {
        if (!(other instanceof CustomType) || other.fullName !== this.fullName) {
            throw new TypeUnificationError(this, other);
        }
        for (let i: number = 0; i < this.typeArguments.length; ++i) {
            this.typeArguments[i].findInstantiations(other.typeArguments[i], instantiations);
        }
    }

    simplify(): CustomType {
        let args: Type[] = [];
        for (let i: number = 0; i < this.typeArguments.length; ++i) {
            args.push(this.typeArguments[i].simplify());
        }
        return new CustomType(this.fullName, this.typeArguments);
    }

    replaceTypeVariables(mapping: Map<string, Type>): CustomType {
        let args: Type[] = [];
        for (let i: number = 0; i < this.typeArguments.length; ++i) {
            args.push(this.typeArguments[i].replaceTypeVariables(mapping));
        }
        return new CustomType(this.fullName, this.typeArguments);
    }

    unifyImpl(other: Type): Type {
        if (!(other instanceof CustomType) || other.fullName !== this.fullName) {
            throw new TypeUnificationError(this, other);
        }
        let args: Type[] = [];
        for (let i: number = 0; i < this.typeArguments.length; ++i) {
            args.push(this.typeArguments[i].unifyImpl(other.typeArguments[i]));
        }
        return new CustomType(this.fullName, args);
    }

    equals(other: any): boolean {
        if (!(other instanceof CustomType) || this.fullName !== other.fullName) {
            return false;
        }
        for (let i: number = 0; i < this.typeArguments.length; ++i) {
            if (!this.typeArguments[i].equals(other.typeArguments[i])) {
                return false;
            }
        }
        return true;
    }
}

// this is a derived form used only for type annotations
export class TupleType extends Type {
    constructor(public elements: Type[], public position: Position = 0) {
        super();
    }

    prettyPrint(): string {
        let result: string = '( ';
        for (let i: number = 0; i < this.elements.length; ++i) {
            if (i > 0) {
                result += ' * ';
            }
            result += ' ' + this.elements[i].prettyPrint();
        }
        return result + ' )';
    }

    findInstantiationsImpl(other: Type, instantiations: Instantiations): void {
        throw new InternalInterpreterError(0, 'called Type.findInstantiationsImpl on a derived form');
    }

    simplify(): RecordType {
        let entries: Map<string, Type> = new Map<string, Type>();
        for (let i: number = 0; i < this.elements.length; ++i) {
            entries.set(String(i + 1), this.elements[i].simplify());
        }
        return new RecordType(entries, true);
    }

    findFreeTypeVariables(names: Set<string>, boundVariables: Set<string>): void {
        throw new InternalInterpreterError(0, 'called Type.findFreeTypeVariables on a derived form');
    }

    replaceTypeVariables(mapping: Map<string, Type>): FunctionType {
        throw new InternalInterpreterError(0, 'called Type.replaceTypeVariables on a derived form');
    }

    unifyImpl(other: Type): Type {
        throw new InternalInterpreterError(0, 'called Type.unifyImpl on a derived form');
    }

    equals(other: any): boolean {
        throw new InternalInterpreterError(0, 'called Type.equals on a derived form');
    }
}
