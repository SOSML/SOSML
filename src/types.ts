import { InternalInterpreterError, ElaborationError } from './errors';
import { State } from './state';

export abstract class Type {
    abstract prettyPrint(): string;
    abstract equals(other: any): boolean;

    // Constructs types with type variables instantiated as much as possible
    instantiate(state: State, tyVarBnd: Map<string, Type>): Type {
        return this.simplify().instantiate(state, tyVarBnd);
    }

    // Merge this type with the other type. This operation is commutative
    merge(state: State, tyVarBnd: Map<string, Type>, other: Type): [Type, Map<string, Type>] {
        return this.simplify().merge(state, tyVarBnd, other);
    }

    makeEqType(state: State, tyVarBnd: Map<string, Type>) : [Type, Map<string, Type>] {
        return this.simplify().makeEqType(state, tyVarBnd);
    }

    // Return all () type variables
    getTypeVariables(): Set<string> {
        return this.simplify().getTypeVariables();
    }

    replaceTypeVariables(state: State, nextName: string = '\'t1',
                         replacements: Map<string, string> = new Map<string, string>())
        : [Type, string, Map<string, string>] {
        return this.simplify().replaceTypeVariables(state, nextName, replacements);
    }

    simplify(): Type {
        return this;
    }

    admitsEquality(state: State): boolean {
        return false;
    }
}

// A type representing any type
export class AnyType extends Type {
    constructor() {
        super();
    }

    prettyPrint(): string {
        return 'any';
    }

    equals(other: any) {
        return true;
    }

    instantiate(state: State, tyVarBnd: Map<string, Type>): Type {
        return this;
    }

    merge(state: State, tyVarBnd: Map<string, Type>, other: Type): [Type, Map<string, Type>] {
        return [other, tyVarBnd];
    }

    makeEqType(state: State, tyVarBnd: Map<string, Type>) : [Type, Map<string, Type>] {
        return [this, tyVarBnd];
    }

    getTypeVariables(): Set<string> {
        return new Set<string>();
    }

    replaceTypeVariables(state: State, nextName: string = '\'t1',
                         replacements: Map<string, string> = new Map<string, string>())
        : [Type, string, Map<string, string>] {
        return [this, nextName, replacements];
    }
}

    /*
export class TypeVariableBind extends Type {
    constructor(public name: string, public type: Type, public domain: Type[] = []) {
        super();
    }

    prettyPrint(): string {
        if (this.domain.length === 0) {
            return '∀ ' + this.name + ' . ' + this.type.prettyPrint();
        } else {
            let res = '∀ ' + this.name + ' ∈ {';
            for (let i = 0; i < this.domain.length; ++i) {
                if (i > 0) {
                    res += ', ';
                }
                res += this.domain[i].prettyPrint();
            }
            return res + '} . ' + this.type.prettyPrint();
        }
    }

    equals(other: any) {
        if (!(other instanceof TypeVariableBind)
            || (<TypeVariableBind> other).name !== this.name) {
            return false;
        }
        return (<TypeVariableBind> other).type.equals(this.type);
    }
}
     */

export class TypeVariable extends Type {
    constructor(public name: string, public position: number = 0) {
        super();
    }

    prettyPrint(): string {
        return this.name;
    }

    instantiate(state: State, tyVarBnd: Map<string, Type>): Type {
        if (!tyVarBnd.has(this.name)) {
            return this;
        }
        return (<Type> tyVarBnd.get(this.name)).instantiate(state, tyVarBnd);
    }

    merge(state: State, tyVarBnd: Map<string, Type>, other: Type): [Type, Map<string, Type>] {
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
                        throw ['Type "' + oth.prettyPrint() + '" does not admit equality.', ths, oth];
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

    makeEqType(state: State, tyVarBnd: Map<string, Type>) : [Type, Map<string, Type>] {
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

    replaceTypeVariables(state: State, nextName: string = '\'t1',
                         replacements: Map<string, string> = new Map<string, string>())
        : [Type, string, Map<string, string>] {
        if (replacements.has(this.name)) {
            return [new TypeVariable(<string> replacements.get(this.name),
                this.position), nextName, replacements];
        }
        if (state.getStaticValue(this.name) !== undefined) {
            if (!this.admitsEquality(state)) {
                replacements = replacements.set(this.name, nextName);
            } else {
                replacements = replacements.set(this.name, '\'' + nextName);
            }
            let cur: number = (+nextName.substring(2)) + 1;
            for (; ; ++cur) {
                if (state.getStaticValue('\'t' + cur) === undefined) {
                    nextName = '\'t' + cur;
                    break;
                }
            }
            return [new TypeVariable(<string> replacements.get(this.name),
                this.position), nextName, replacements];
        }
        return [this, nextName, replacements];
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

    instantiate(state: State, tyVarBnd: Map<string, Type>): Type {
        let newElements: Map<string, Type> = new Map<string, Type>();
        this.elements.forEach((type: Type, key: string) => {
            newElements.set(key, type.instantiate(state, tyVarBnd));
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

    makeEqType(state: State, tyVarBnd: Map<string, Type>) : [Type, Map<string, Type>] {
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

    replaceTypeVariables(state: State, nextName: string = '\'t1',
                         replacements: Map<string, string> = new Map<string, string>())
        : [Type, string, Map<string, string>] {
        let res: [Type, string, Map<string, string>] = [this, nextName, replacements];
        let rt: Map<string, Type> = new Map<string, Type>();
        this.elements.forEach((val: Type, key: string) => {
            res = val.replaceTypeVariables(state, res[1], res[2]);
            rt = rt.set(key, res[0]);
        });
        return [new RecordType(rt, this.complete, this.position), res[1], res[2]];
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

    prettyPrint(): string {
        let isTuple = true;
        for (let i = 1; i <= this.elements.size; ++i) {
            if (!this.elements.has('' + i)) {
                isTuple = false;
            }
        }

        if (isTuple) {
            let res: string = '(';
            for (let i = 1; i <= this.elements.size; ++i) {
                if (i > 1) {
                    res += ' * ';
                }
                let sub = this.elements.get('' + i);
                if (sub !== undefined) {
                    res += sub.prettyPrint();
                } else {
                    throw new InternalInterpreterError(-1,
                        'How did we loose this value? It was there before. I promise…');
                }
            }
            return res + ')';
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

    instantiate(state: State, tyVarBnd: Map<string, Type>): Type {
        return new FunctionType(this.parameterType.instantiate(state, tyVarBnd),
            this.returnType.instantiate(state, tyVarBnd),
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

    makeEqType(state: State, tyVarBnd: Map<string, Type>) : [Type, Map<string, Type>] {
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

    replaceTypeVariables(state: State, nextName: string = '\'t1',
                         replacements: Map<string, string> = new Map<string, string>())
        : [Type, string, Map<string, string>] {
        let res = this.parameterType.replaceTypeVariables(state, nextName, replacements);
        let res2 = this.returnType.replaceTypeVariables(state, res[1], res[2]);
        return [new FunctionType(res[0], res2[0], this.position), res2[1], res2[2]];
    }

    admitsEquality(state: State): boolean {
        return false;
    }

    prettyPrint(): string {
        if (this.parameterType instanceof FunctionType) {
            return '(' + this.parameterType.prettyPrint() + ')'
                + ' -> ' + this.returnType.prettyPrint();
        } else {
            return this.parameterType.prettyPrint()
                + ' -> ' + this.returnType.prettyPrint();
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

    instantiate(state: State, tyVarBnd: Map<string, Type>): Type {
        let tp = state.getStaticType(this.name);
        if (tp !== undefined && tp.type instanceof FunctionType) {
            try {
                let mt = this.merge(state, tyVarBnd,  (<FunctionType> tp.type).parameterType, true);
                return (<FunctionType> tp.type).returnType.instantiate(state, mt[1]);
            } catch (e) {
                throw new ElaborationError(this.position,
                    'Instantiating "' + this.prettyPrint() + '" failed:\n'
                    + 'Cannot merge "' + e[1].prettyPrint() + '" and "' + e[2].prettyPrint()
                    + '" (' + e[0] + ').');
            }
        } else if (tp === undefined) {
            throw new ElaborationError(this.position, 'Unbound type "' + this.name + '".');
        }

        let res: Type[] = [];
        for (let i = 0; i < this.typeArguments.length; ++i) {
            res.push(this.typeArguments[i].instantiate(state, tyVarBnd));
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

    makeEqType(state: State, tyVarBnd: Map<string, Type>) : [Type, Map<string, Type>] {
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

    replaceTypeVariables(state: State, nextName: string = '\'t1',
                         replacements: Map<string, string> = new Map<string, string>())
        : [Type, string, Map<string, string>] {
        let res: [Type, string, Map<string, string>] = [this, nextName, replacements];
        let rt: Type[] = [];

        for (let i = 0; i < this.typeArguments.length; ++i) {
            res = this.typeArguments[i].replaceTypeVariables(state, res[1], res[2]);
            rt.push(res[0]);
        }
        return [new CustomType(this.name, rt, this.position), res[1], res[2]];
    }

    admitsEquality(state: State): boolean {
        for (let i = 0; i < this.typeArguments.length; ++i) {
            if (!this.typeArguments[i].admitsEquality(state)) {
                return false;
            }
        }
        return true;
    }

    prettyPrint(): string {
        let result: string = '';
        if (this.typeArguments.length > 1) {
            result += '(';
        }
        for (let i = 0; i < this.typeArguments.length; ++i) {
            if (i > 0) {
                result += ', ';
            }
            result += this.typeArguments[i].prettyPrint();
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

    prettyPrint(): string {
        let result: string = '(';
        for (let i: number = 0; i < this.elements.length; ++i) {
            if (i > 0) {
                result += ' * ';
            }
            result += this.elements[i].prettyPrint();
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
