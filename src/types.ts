import { ElaborationError } from './errors';
import { State } from './state';

export abstract class Type {
    abstract toString(): string;
    abstract equals(other: any): boolean;

    // Constructs types with type variables instantiated as much as possible
    instantiate(state: State, tyVarBnd: Map<string, Type>, seen: Set<string> = new Set<string>()): Type {
        return this.simplify().instantiate(state, tyVarBnd, seen);
    }

    // Merge this type with the other type. This operation is commutative
    merge(state: State, tyVarBnd: Map<string, Type>, other: Type): [Type, Map<string, Type>] {
        return this.simplify().merge(state, tyVarBnd, other);
    }

    makeEqType(state: State, tyVarBnd: Map<string, Type>): [Type, Map<string, Type>] {
        return this.simplify().makeEqType(state, tyVarBnd);
    }

    // Return all () type variables
    getTypeVariables(): Set<string> {
        return this.simplify().getTypeVariables();
    }

    // Get all type variables in order (they may appear more than once)
    getOrderedTypeVariables(): string[] {
        return this.simplify().getOrderedTypeVariables();
    }

    replaceTypeVariables(replacements: Map<string, string>): Type {
        return this.simplify().replaceTypeVariables(replacements);
    }

    simplify(): Type {
        return this;
    }

    admitsEquality(state: State): boolean {
        return false;
    }

    normalize(): Type {
        let orderedVars = this.getOrderedTypeVariables();
        let replacements = new Map<string, string>();

        for (let v of orderedVars) {
            if (replacements.has(v)) {
                continue;
            }

            let nextVar = '';
            let cnt = replacements.size + 1;
            if (cnt <= 26) {
                nextVar = String.fromCharCode('a'.charCodeAt(0) + cnt - 1);
            } else {
                while (cnt > 0) {
                    let nextChar = (--cnt) % 26;
                    nextVar = String.fromCharCode('a'.charCodeAt(0) + nextChar) + nextVar;
                    cnt = Math.floor(cnt / 26);
                }
            }

            let newVar = '\'';
            if (v.length > 2 && v.charAt(1) === '\'') {
                newVar += '\'';
            }

            newVar += nextVar;

            replacements.set(v, newVar);
        }

        return this.replaceTypeVariables(replacements);
    }
}

// A type representing any type
export class AnyType extends Type {
    constructor() {
        super();
    }

    toString(): string {
        return 'any';
    }

    equals(other: any) {
        return true;
    }

    instantiate(state: State, tyVarBnd: Map<string, Type>, seen: Set<string> = new Set<string>()): Type {
        return this;
    }

    merge(state: State, tyVarBnd: Map<string, Type>, other: Type): [Type, Map<string, Type>] {
        return [other, tyVarBnd];
    }

    makeEqType(state: State, tyVarBnd: Map<string, Type>): [Type, Map<string, Type>] {
        return [this, tyVarBnd];
    }

    getTypeVariables(): Set<string> {
        return new Set<string>();
    }

    getOrderedTypeVariables(): string[] {
        return [];
    }

    replaceTypeVariables(replacements: Map<string, string>): Type {
        return this;
    }
}

export class TypeVariableBind extends Type {
    constructor(public name: string, public type: Type, public domain: Type[] = []) {
        super();
    }

    toString(): string {
        if (this.domain.length === 0) {
            return '∀ ' + this.name + ' . ' + this.type;
        } else {
            let res = '∀ ' + this.name + ' ∈ {';
            for (let i = 0; i < this.domain.length; ++i) {
                if (i > 0) {
                    res += ', ';
                }
                res += this.domain[i];
            }
            return res + '} . ' + this.type;
        }
    }

    getTypeVariables(): Set<string> {
        let rec = this.type.getTypeVariables();
        let res = new Set<string>();

        rec.forEach((val: string) => {
            if (val !== this.name) {
                res.add(val);
            }
        });
        return res;
    }

    getOrderedTypeVariables(): string[] {
        return [this.name].concat(this.type.getOrderedTypeVariables());
    }

    replaceTypeVariables(replacements: Map<string, string>): Type {
        if (replacements.has(this.name)) {
            return new TypeVariableBind(<string> replacements.get(this.name),
                this.type.replaceTypeVariables(replacements));
        }
        return this.type.replaceTypeVariables(replacements);
    }

    equals(other: any) {
        if (!(other instanceof TypeVariableBind)
            || (<TypeVariableBind> other).name !== this.name) {
            return false;
        }
        return (<TypeVariableBind> other).type.equals(this.type);
    }
}

export class TypeVariable extends Type {
    constructor(public name: string, public position: number = 0) {
        super();
    }

    toString(): string {
        return this.name;
    }

    instantiate(state: State, tyVarBnd: Map<string, Type>, seen: Set<string> = new Set<string>()): Type {
        if (!tyVarBnd.has(this.name)) {
            return this;
        }
        if (seen.has(this.name)) {
            throw new ElaborationError(this.position,
                'Type clash. An expression of type "' + this.name
                + '" cannot have type "' + (<Type> tyVarBnd.get(this.name))
                + '" because of circularity.');
        }
        let nsen = new Set<string>();
        seen.forEach((val: string) => {
            nsen.add(val);
        });
        nsen.add(this.name);
        return (<Type> tyVarBnd.get(this.name)).instantiate(state, tyVarBnd, nsen);
    }

    merge(state: State, tyVarBnd: Map<string, Type>, other: Type): [Type, Map<string, Type>] {
        if (other instanceof AnyType) {
            return [this, tyVarBnd];
        }

        let ths = this.instantiate(state, tyVarBnd);

        if (ths instanceof TypeVariable) {
            let oth = other.instantiate(state, tyVarBnd);

            if (oth instanceof TypeVariable) {
                // TODO equality checks
                if (ths.name === oth.name) {
                    return [ths, tyVarBnd];
                } else if (ths.name < oth.name) {
                    // TODO Check that we really don't need to create a new TypeVariable
                    return [ths, tyVarBnd.set(oth.name, ths)];
                } else {
                    return [ths, tyVarBnd.set(ths.name, oth)];
                }
            } else {
                if (ths.admitsEquality(state) && !oth.admitsEquality(state)) {
                    let nt = oth.makeEqType(state, tyVarBnd);
                    if (!nt[0].admitsEquality(state)) {
                        throw ['Type "' + oth + '" does not admit equality.', ths, oth];
                    } else {
                        oth = nt[0];
                        tyVarBnd = nt[1];
                    }
                }
                return [oth, tyVarBnd.set(ths.name, oth)];
            }
        } else {
            return ths.merge(state, tyVarBnd, other);
        }
    }

    makeEqType(state: State, tyVarBnd: Map<string, Type>): [Type, Map<string, Type>] {
        if (this.admitsEquality(state)) {
            return [this, tyVarBnd];
        }
        if (tyVarBnd.has(this.name)) {
            let tmp = (<Type> tyVarBnd.get(this.name)).makeEqType(state, tyVarBnd);
            tyVarBnd = tmp[1];
            tyVarBnd = tyVarBnd.set('\'' + this.name, tmp[0]);
        }
        let nt = new TypeVariable('\'' + this.name, this.position);
        return [nt, tyVarBnd.set(this.name, nt)];
    }

    getTypeVariables(): Set<string> {
        let res = new Set<string>();
        res.add(this.name);
        return res;
    }

    getOrderedTypeVariables(): string[] {
        return [this.name];
    }

    replaceTypeVariables(replacements: Map<string, string>): Type {
        if (replacements.has(this.name)) {
            return new TypeVariable(<string> replacements.get(this.name), this.position);
        }
        return this;
    }

    admitsEquality(state: State): boolean {
        return this.name[1] === '\'';
    }

    equals(other: any): boolean {
        if (other instanceof AnyType) {
            return true;
        }
        if (!(other instanceof TypeVariable && this.name === other.name)) {
            return false;
        }
        return true;
    }
}

export class RecordType extends Type {
    constructor(public elements: Map<string, Type>, public complete: boolean = true, public position: number = 0) {
        super();
    }

    instantiate(state: State, tyVarBnd: Map<string, Type>, seen: Set<string> = new Set<string>()): Type {
        let newElements: Map<string, Type> = new Map<string, Type>();
        this.elements.forEach((type: Type, key: string) => {
            newElements.set(key, type.instantiate(state, tyVarBnd, seen));
        });
        return new RecordType(newElements, this.complete);
    }

    merge(state: State, tyVarBnd: Map<string, Type>, other: Type): [Type, Map<string, Type>] {
        if (other instanceof TypeVariable || other instanceof AnyType) {
            return other.merge(state, tyVarBnd, this);
        }

        if (other instanceof RecordType) {
            if (!this.complete && other.complete) {
                return other.merge(state, tyVarBnd, this);
            }

            let rt: Map<string, Type> = new Map<string, Type>();
            let tybnd = tyVarBnd;
            other.elements.forEach((val: Type, key: string) => {
                if (this.complete && !this.elements.has(key)) {
                    throw ['Records don\'t agree on members ("' + key
                        + '" occurs only once.)', this.instantiate(state, tybnd),
                        other.instantiate(state, tybnd)];
                }

                if (!this.elements.has(key)) {
                    rt = rt.set(key, val.instantiate(state, tybnd));
                } else {
                    let mg = val.merge(state, tybnd, <Type> this.elements.get(key));
                    rt = rt.set(key, mg[0]);
                    tybnd = mg[1];
                }
            });

            if (other.complete) {
                this.elements.forEach((val: Type, key: string) => {
                    if (!other.elements.has(key)) {
                        throw ['Records don\'t agree on members ("' + key
                            + '" occurs only once.)', this.instantiate(state, tybnd),
                            other.instantiate(state, tybnd)];
                    }
                });
            }

            return [new RecordType(rt, this.complete || other.complete), tybnd];
        }

        // Merging didn't work
        throw ['Cannot merge "RecordType" and "' + other.constructor.name + '".',
            this.instantiate(state, tyVarBnd),
            other.instantiate(state, tyVarBnd)];
    }

    makeEqType(state: State, tyVarBnd: Map<string, Type>): [Type, Map<string, Type>] {
        let newElements: Map<string, Type> = new Map<string, Type>();
        this.elements.forEach((type: Type, key: string) => {
            let tmp = type.makeEqType(state, tyVarBnd);
            newElements.set(key, tmp[0]);
            tyVarBnd = tmp[1];
        });
        return [new RecordType(newElements, this.complete), tyVarBnd];
    }

    getTypeVariables(): Set<string> {
        let res = new Set<string>();
        this.elements.forEach((val: Type) => {
            val.getTypeVariables().forEach((id: string) => {
                res.add(id);
            });
        });
        return res;
    }

    getOrderedTypeVariables(): string[] {
        let res: string[] = [];
        this.elements.forEach((val: Type) => {
            res = res.concat(val.getOrderedTypeVariables());
        });
        return res;
    }

    replaceTypeVariables(replacements: Map<string, string>): Type {
        let rt: Map<string, Type> = new Map<string, Type>();
        this.elements.forEach((val: Type, key: string) => {
            rt = rt.set(key, val.replaceTypeVariables(replacements));
        });
        return new RecordType(rt, this.complete, this.position);
    }

    getType(name: string): Type {
        if (!this.elements.has(name)) {
            throw new ElaborationError(0, 'Tried accessing non-existing record part.');
        }
        return <Type> this.elements.get(name);
    }

    hasType(name: string): boolean {
        return this.elements.has(name);
    }

    admitsEquality(state: State): boolean {
        let res = true;
        this.elements.forEach((type: Type, key: string) => {
            if (!type.admitsEquality(state)) {
                res = false;
            }
        });
        return res;
    }

    toString(): string {
        let isTuple = true;
        for (let i = 1; i <= this.elements.size; ++i) {
            if (!this.elements.has('' + i)) {
                isTuple = false;
            }
        }

        if (isTuple) {
            if (this.elements.size === 0) {
                return 'unit';
            }
            let res: string = '';
            for (let i = 1; i <= this.elements.size; ++i) {
                if (i > 1) {
                    res += ' * ';
                }
                let sub = this.elements.get('' + i);
                if (sub instanceof FunctionType) {
                    res += '(' + sub + ')';
                } else {
                    res += sub;
                }
            }
            return res + '';
        }

        // TODO: print as Tuple if possible
        let result: string = '{';
        let first: boolean = true;
        this.elements.forEach((type: Type, key: string) => {
            if (!first) {
                result += ', ';
            } else {
                first = false;
            }
            result += key + ': ' + type;
        });
        if (!this.complete) {
            if (!first) {
                result += ', ';
            }
            result += '...';
        }
        return result + '}';
    }

    simplify(): RecordType {
        let newElements: Map<string, Type> = new Map<string, Type>();
        this.elements.forEach((type: Type, key: string) => {
            newElements.set(key, type.simplify());
        });
        return new RecordType(newElements, this.complete, this.position);
    }

    equals(other: any): boolean {
        if (other instanceof AnyType) {
            return true;
        }
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
    constructor(public parameterType: Type, public returnType: Type, public position: number = 0) {
        super();
    }

    instantiate(state: State, tyVarBnd: Map<string, Type>, seen: Set<string> = new Set<string>()): Type {
        return new FunctionType(this.parameterType.instantiate(state, tyVarBnd, seen),
            this.returnType.instantiate(state, tyVarBnd, seen),
            this.position);
    }

    merge(state: State, tyVarBnd: Map<string, Type>, other: Type): [Type, Map<string, Type>] {
        if (other instanceof TypeVariable || other instanceof AnyType) {
            return other.merge(state, tyVarBnd, this);
        }
        if (other instanceof FunctionType) {
            let p = this.parameterType.merge(state, tyVarBnd, other.parameterType);
            let r = this.returnType.merge(state, p[1], other.returnType);

            return [new FunctionType(p[0], r[0]), r[1]];
        }

        // Merging didn't work
        throw ['Cannot merge "FunctionType" and "' + other.constructor.name + '".',
            this.instantiate(state, tyVarBnd),
            other.instantiate(state, tyVarBnd)];
    }

    makeEqType(state: State, tyVarBnd: Map<string, Type>): [Type, Map<string, Type>] {
        return [this, tyVarBnd];
    }

    getTypeVariables(): Set<string> {
        let res = new Set<string>();
        this.parameterType.getTypeVariables().forEach((value: string) => {
            res.add(value);
        });
        this.returnType.getTypeVariables().forEach((value: string) => {
            res.add(value);
        });
        return res;
    }

    getOrderedTypeVariables(): string[] {
        let res: string[] = [];
        res = res.concat(this.parameterType.getOrderedTypeVariables());
        res = res.concat(this.returnType.getOrderedTypeVariables());
        return res;
    }

    replaceTypeVariables(replacements: Map<string, string>): Type {
        let res = this.parameterType.replaceTypeVariables(replacements);
        let res2 = this.returnType.replaceTypeVariables(replacements);
        return new FunctionType(res, res2, this.position);
    }

    admitsEquality(state: State): boolean {
        return false;
    }

    toString(): string {
        if (this.parameterType instanceof FunctionType) {
            return '(' + this.parameterType + ')'
                + ' -> ' + this.returnType;
        } else {
            return this.parameterType
                + ' -> ' + this.returnType;
        }
    }

    simplify(): FunctionType {
        return new FunctionType(this.parameterType.simplify(), this.returnType.simplify(), this.position);
    }

    equals(other: any): boolean {
        if (other instanceof AnyType) {
            return true;
        }
        return other instanceof FunctionType && this.parameterType.equals(other.parameterType)
            && this.returnType.equals(other.returnType);
    }
}

// A custom defined type similar to "list" or "option".
// May have a type argument.
// TODO ID?
export class CustomType extends Type {
    constructor(public name: string,
                public typeArguments: Type[] = [],
                public position: number = 0) {
        super();
    }

    instantiate(state: State, tyVarBnd: Map<string, Type>, seen: Set<string> = new Set<string>()): Type {
        let tp = state.getStaticType(this.name);
        if (tp !== undefined && tp.type instanceof FunctionType) {
            try {
                let mt = this.merge(state, tyVarBnd,  (<FunctionType> tp.type).parameterType, true);
                return (<FunctionType> tp.type).returnType.instantiate(state, mt[1], seen);
            } catch (e) {
                if (!(e instanceof Array)) {
                    throw e;
                }
                throw new ElaborationError(this.position,
                    'Instantiating "' + this + '" failed:\n'
                    + 'Cannot merge "' + e[1] + '" and "' + e[2]
                    + '" (' + e[0] + ').');
            }
        } else if (tp === undefined) {
            throw new ElaborationError(this.position, 'Unbound type "' + this.name + '".');
        }

        let res: Type[] = [];
        for (let i = 0; i < this.typeArguments.length; ++i) {
            res.push(this.typeArguments[i].instantiate(state, tyVarBnd, seen));
        }
        return new CustomType(this.name, res, this.position);
    }

    merge(state: State, tyVarBnd: Map<string, Type>, other: Type, noinst: boolean = false): [Type, Map<string, Type>] {
        if (other instanceof TypeVariable || other instanceof AnyType) {
            return other.merge(state, tyVarBnd, this);
        }

        let ths: Type = this;
        let oth = other;
        if (!noinst) {
            // Remove type alias and stuff
            ths = this.instantiate(state, tyVarBnd);

            if (!(ths instanceof CustomType)) {
                return ths.merge(state, tyVarBnd, other);
            }
            oth = other.instantiate(state, tyVarBnd);
        }

        if (oth instanceof CustomType && (<CustomType> ths).name === (<CustomType> oth).name
            && (<CustomType> ths).typeArguments.length === (<CustomType> oth).typeArguments.length) {
            let res: Type[] = [];
            let tybnd = tyVarBnd;

            for (let i = 0; i < (<CustomType> ths).typeArguments.length; ++i) {
                let tmp = (<CustomType> ths).typeArguments[i].merge(state, tybnd, oth.typeArguments[i]);
                res.push(tmp[0]);
                tybnd = tmp[1];
            }

            return [new CustomType((<CustomType> ths).name, res), tybnd];
        }

        // Merging didn't work
        throw ['Cannot merge "CustomType" and "' + other.constructor.name + '".',
            this.instantiate(state, tyVarBnd),
            other.instantiate(state, tyVarBnd)];
    }

    makeEqType(state: State, tyVarBnd: Map<string, Type>): [Type, Map<string, Type>] {
        let res: Type[] = [];
        for (let i = 0; i < this.typeArguments.length; ++i) {
            let tmp = this.typeArguments[i].makeEqType(state, tyVarBnd);
            res.push(tmp[0]);
            tyVarBnd = tmp[1];
        }
        return [new CustomType(this.name, res, this.position), tyVarBnd];
    }

    getTypeVariables(): Set<string> {
        let res = new Set<string>();
        if (this.typeArguments.length > 0) {
            for (let i = 0; i < this.typeArguments.length; ++i) {
                this.typeArguments[i].getTypeVariables().forEach((val: string) => {
                    res.add(val);
                });
            }
        }
        return res;
    }

    getOrderedTypeVariables(): string[] {
        let res: string[] = [];
        for (let i = 0; i < this.typeArguments.length; ++i) {
            res = res.concat(this.typeArguments[i].getOrderedTypeVariables());
        }
        return res;
    }

    replaceTypeVariables(replacements: Map<string, string> = new Map<string, string>()): Type {
        let rt: Type[] = [];

        for (let i = 0; i < this.typeArguments.length; ++i) {
            rt.push(this.typeArguments[i].replaceTypeVariables(replacements));
        }
        return new CustomType(this.name, rt, this.position);
    }

    admitsEquality(state: State): boolean {
        for (let i = 0; i < this.typeArguments.length; ++i) {
            if (!this.typeArguments[i].admitsEquality(state)) {
                return false;
            }
        }
        return true;
    }

    toString(): string {
        let result: string = '';
        if (this.typeArguments.length > 1) {
            result += '(';
        }
        for (let i = 0; i < this.typeArguments.length; ++i) {
            if (i > 0) {
                result += ', ';
            }
            result += this.typeArguments[i];
        }
        if (this.typeArguments.length > 1) {
            result += ')';
        }
        if (this.typeArguments.length > 0) {
            result += ' ';
        }
        result += this.name;
        return result;
    }

    simplify(): Type {
        let args: Type[] = [];
        for (let i: number = 0; i < this.typeArguments.length; ++i) {
            args.push(this.typeArguments[i].simplify());
        }
        return new CustomType(this.name, args, this.position);
    }

    equals(other: any): boolean {
        if (other instanceof AnyType) {
            return true;
        }
        if (!(other instanceof CustomType) || this.name !== other.name) {
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

// Derived Types

export class TupleType extends Type {
    constructor(public elements: Type[], public position: number = 0) {
        super();
    }

    toString(): string {
        let result: string = '(';
        for (let i: number = 0; i < this.elements.length; ++i) {
            if (i > 0) {
                result += ' * ';
            }
            result += this.elements[i];
        }
        return result + ')';
    }

    simplify(): RecordType {
        let entries: Map<string, Type> = new Map<string, Type>();
        for (let i: number = 0; i < this.elements.length; ++i) {
            entries.set('' + (i + 1), this.elements[i].simplify());
        }
        return new RecordType(entries, true, this.position);
    }

    equals(other: any): boolean {
        return this.simplify().equals(other);
    }
}
