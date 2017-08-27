import { Expression } from './expressions';
import { Declaration } from './declarations';
import { IdentifierToken, Token, LongIdentifierToken } from './tokens';
import { Type, TypeVariable } from './types';
import { State, DynamicInterface, DynamicStructureInterface, DynamicValueInterface,
         DynamicTypeInterface, IdentifierStatus, DynamicBasis, DynamicFunctorInformation } from './state';
import { Warning, EvaluationError } from './errors';
import { Value } from './values';
import { getInitialState } from './initialState';

// Module Expressions

// Structure Expressions

type MemBind = [number, Value][];

export interface Structure {
    computeStructure(state: State): [DynamicBasis | Value, Warning[], MemBind];
}

export class StructureExpression extends Expression implements Structure {
// struct <strdec> end
    constructor(public position: number, public structureDeclaration: Declaration) {
        super();
    }

    simplify(): StructureExpression {
        return new StructureExpression(this.position, this.structureDeclaration.simplify());
    }

    computeStructure(state: State): [DynamicBasis | Value, Warning[], MemBind] {
        let nstate = state.getNestedState(0).getNestedState(state.id);
        let tmp = this.structureDeclaration.evaluate(nstate);
        let mem = tmp[0].getMemoryChanges(0);

        if (tmp[1]) {
            return [<Value> tmp[2], tmp[3], mem];
        }

        return [tmp[0].getDynamicChanges(0), tmp[3], mem];
    }

    toString(): string {
        return 'struct ' + this.structureDeclaration + ' end';
    }
}

export class StructureIdentifier extends Expression implements Structure {
// longstrid
    constructor(public position: number, public identifier: Token) {
        super();
    }

    simplify(): StructureIdentifier {
        return this;
    }

    computeStructure(state: State): [DynamicBasis | Value, Warning[], MemBind] {
        let res: DynamicBasis | undefined = undefined;
        if (this.identifier instanceof LongIdentifierToken) {
            let st = state.getAndResolveDynamicStructure(<LongIdentifierToken> this.identifier);

            if (st !== undefined) {
                res = (<DynamicBasis> st).getStructure(
                    (<LongIdentifierToken> this.identifier).id.getText());
            }
        } else {
            res = state.getDynamicStructure(this.identifier.getText());
        }

        if (res === undefined) {
            throw new EvaluationError(this.position, 'Undefined module "'
                + this.identifier.getText() + '".');
        }
        return [<DynamicBasis> res, [], []];
    }

    toString(): string {
        return this.identifier.getText();
    }
}

export class TransparentConstraint extends Expression implements Structure {
// strexp : sigexp
    constructor(public position: number, public structureExpression: Expression & Structure,
                public signatureExpression: Expression & Signature) {
        super();
    }

    simplify(): TransparentConstraint {
        return new TransparentConstraint(this.position,
            <Expression & Structure> this.structureExpression.simplify(),
            <Expression & Signature> this.signatureExpression.simplify());
    }

    computeStructure(state: State): [DynamicBasis | Value, Warning[], MemBind] {
        let tmp = this.structureExpression.computeStructure(state);
        if (tmp[0] instanceof Value) {
            return tmp;
        }
        let sig = this.signatureExpression.computeInterface(state);
        return [(<DynamicBasis> tmp[0]).restrict(sig), tmp[1], tmp[2]];
    }

    toString(): string {
        return this.structureExpression + ' : ' + this.signatureExpression;
    }
}

export class OpaqueConstraint extends Expression implements Structure {
// strexp :> sigexp
    constructor(public position: number, public structureExpression: Expression & Structure,
                public signatureExpression: Expression & Signature) {
        super();
    }

    simplify(): OpaqueConstraint {
        return new OpaqueConstraint(this.position,
            <Expression & Structure> this.structureExpression.simplify(),
            <Expression & Signature> this.signatureExpression.simplify());
    }

    computeStructure(state: State): [DynamicBasis | Value, Warning[], MemBind] {
        let tmp = this.structureExpression.computeStructure(state);
        if (tmp[0] instanceof Value) {
            return tmp;
        }
        let sig = this.signatureExpression.computeInterface(state);
        return [(<DynamicBasis> tmp[0]).restrict(sig), tmp[1], tmp[2]];
    }

    toString(): string {
        return this.structureExpression + ' :> ' + this.signatureExpression;
    }
}

export class FunctorApplication extends Expression implements Structure {
// funid ( strexp )
    constructor(public position: number, public functorId: IdentifierToken,
                public structureExpression: Expression & Structure) {
        super();
    }

    simplify(): FunctorApplication {
        return new FunctorApplication(this.position, this.functorId,
            <Expression & Structure> this.structureExpression.simplify());
    }

    computeStructure(state: State): [DynamicBasis | Value, Warning[], MemBind] {
        let fun = state.getDynamicFunctor(this.functorId.getText());

        if (fun === undefined) {
            throw new EvaluationError(this.position,
                'Undefined functor "' + this.functorId.getText() + '".');
        }

        let res = this.structureExpression.computeStructure(state);

        if (res[0] instanceof Value) {
            return res;
        }

        let nstate = fun.state.getNestedState(fun.state.id);
        for (let i = 0; i < res[2].length; ++i) {
            nstate.setCell(res[2][i][0], res[2][i][1]);
        }
        nstate.setDynamicStructure(fun.paramName.getText(),
            (<DynamicBasis> res[0]).restrict(fun.param));
        let nres = fun.body.computeStructure(nstate);
        return [nres[0], res[1].concat(nres[1]), res[2].concat(nres[2])];
    }

    toString(): string {
        return this.functorId.getText() + '( ' + this.structureExpression + ' )';
    }
}

export class LocalDeclarationStructureExpression extends Expression implements Structure {
// let strdec in exp1; ...; expn end
// A sequential expression exp1; ... ; expn is represented as such,
// despite the potentially missing parentheses
    constructor(public position: number, public declaration: Declaration,
                public expression: Expression & Structure) { super(); }

    simplify(): LocalDeclarationStructureExpression {
        return new LocalDeclarationStructureExpression(this.position, this.declaration.simplify(),
            <Expression & Structure> this.expression.simplify());
    }

    toString(): string {
        return 'let ' + this.declaration + ' in ' + this.expression + ' end';
    }

    computeStructure(state: State): [DynamicBasis | Value, Warning[], MemBind] {
        let nstate = state.getNestedState(0).getNestedState(state.id);
        let res = this.declaration.evaluate(nstate);
        let membnd = res[0].getMemoryChanges(0);
        if (res[1]) {
            return [<Value> res[2], res[3], membnd];
        }
        let nres = this.expression.computeStructure(res[0]);
        return [nres[0], res[3].concat(nres[1]), membnd.concat(nres[2])];
    }
}


// Signature Expressions

export interface Signature {
    computeInterface(state: State): DynamicInterface;
}

export class SignatureExpression extends Expression implements Signature {
// sig spec end
    constructor(public position: number, public specification: Specification) {
        super();
    }

    simplify(): SignatureExpression {
        return this;
    }

    computeInterface(state: State): DynamicInterface {
        return this.specification.computeInterface(state);
    }

    toString(): string {
        return 'sig ' + this.specification + ' end';
    }
}

export class SignatureIdentifier extends Expression implements Signature {
// sigid
    constructor(public position: number, public identifier: Token) {
        super();
    }

    simplify(): SignatureIdentifier {
        return this;
    }

    computeInterface(state: State): DynamicInterface {
        let st = state.dynamicBasis;
        if (this.identifier instanceof LongIdentifierToken) {
            for (let i = 0; i < (<LongIdentifierToken> this.identifier).qualifiers.length; ++i) {
                let tmp: DynamicBasis | undefined;
                if (i === 0) {
                    tmp = state.getDynamicStructure(
                        (<LongIdentifierToken> this.identifier).qualifiers[i].getText());
                } else {
                    tmp = st.getStructure(
                        (<LongIdentifierToken> this.identifier).qualifiers[i].getText());
                }
                if (tmp === undefined) {
                    throw new EvaluationError(this.position, 'Undefined module "'
                        + (<LongIdentifierToken> this.identifier).qualifiers[i].getText() + '"');
                }
                st = <DynamicBasis> tmp;
            }
            let res = st.getSignature((<LongIdentifierToken> this.identifier).id.getText());
            if (res === undefined) {
                throw new EvaluationError(this.position, 'Undefined signature "'
                    + this.identifier.getText() + '".');
            } else {
                return <DynamicInterface> res;
            }
        }
        let rs = state.getDynamicSignature(this.identifier.getText());
        if (rs === undefined) {
            throw new EvaluationError(this.position, 'Undefined signature "'
                + this.identifier.getText() + '".');
        } else {
            return <DynamicInterface> rs;
        }
    }

    toString(): string {
        return this.identifier.getText();
    }
}

export class TypeRealisation extends Expression implements Signature {
// sigexp where type tyvarseq longtycon = ty
    constructor(public position: number, public signatureExpression: Expression & Signature,
                public tyvarseq: TypeVariable[], public name: Token,
                public type: Type) {
        super();
    }

    simplify(): TypeRealisation {
        return new TypeRealisation(this.position, <Expression & Signature> this.signatureExpression.simplify(),
            this.tyvarseq, this.name, this.type.simplify());
    }

    computeInterface(state: State): DynamicInterface {
        return this.signatureExpression.computeInterface(state);
    }

    toString(): string {
        return this.signatureExpression + ' where type <stuff> ' + this.name.getText()
            + ' = ' + this.type;
    }
}


// Module declarations and bindings

// Sutrcture declaration

export class StructureDeclaration extends Declaration {
// structure strbind
    constructor(public position: number, public structureBinding: StructureBinding[]) {
        super();
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]> = new Map<string, [Type, boolean]>(),
              nextName: string = '\'t0'): [State, Warning[], Map<string, [Type, boolean]>, string] {
        // TODO
        return [state, [new Warning(this.position, 'Skipped elaborating structure.\n')], tyVarBnd, nextName];
    }

    evaluate(state: State): [State, boolean, Value|undefined, Warning[]] {
        let warns: Warning[] = [];
        for (let i = 0; i < this.structureBinding.length; ++i) {
            let tmp = this.structureBinding[i].evaluate(state);
            if (tmp[1]) {
                return tmp;
            }
            state = tmp[0];
            warns = warns.concat(tmp[3]);
        }
        return [state, false, undefined, warns];
    }

    simplify(): StructureDeclaration {
        let bnd: StructureBinding[] = [];
        for (let i = 0; i < this.structureBinding.length; ++i) {
            bnd.push(this.structureBinding[i].simplify());
        }
        return new StructureDeclaration(this.position, bnd);
    }

    toString(): string {
        let res = 'structure';
        for (let i = 0; i < this.structureBinding.length; ++i) {
            res += ' ' + this.structureBinding[i];
        }
        return res + ';';
    }
}

export class SignatureDeclaration extends Declaration {
// signature sigbind
    constructor(public position: number, public signatureBinding: SignatureBinding[]) {
        super();
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]> = new Map<string, [Type, boolean]>(),
              nextName: string = '\'t0'): [State, Warning[], Map<string, [Type, boolean]>, string] {
        // TODO
        return [state, [new Warning(this.position, 'Skipped elaborating signature.\n')], tyVarBnd, nextName];
    }

    evaluate(state: State): [State, boolean, Value|undefined, Warning[]] {
        for (let i = 0; i < this.signatureBinding.length; ++i) {
            state = this.signatureBinding[i].evaluate(state);
        }
        return [state, false, undefined, []];
    }

    simplify(): SignatureDeclaration {
        let bnd: SignatureBinding[] = [];
        for (let i = 0; i < this.signatureBinding.length; ++i) {
            bnd.push(this.signatureBinding[i].simplify());
        }
        return new SignatureDeclaration(this.position, bnd);
    }

    toString(): string {
        let res = 'structure';
        for (let i = 0; i < this.signatureBinding.length; ++i) {
            res += ' ' + this.signatureBinding[i];
        }
        return res + ';';
    }
}

export class FunctorDeclaration extends Declaration {
// functor funbind
    constructor(public position: number, public functorBinding: FunctorBinding[]) {
        super();
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]> = new Map<string, [Type, boolean]>(),
              nextName: string = '\'t0'): [State, Warning[], Map<string, [Type, boolean]>, string] {
        // TODO
        return [state, [new Warning(this.position, 'Skipped elaborating functor.\n')], tyVarBnd, nextName];
    }

    evaluate(state: State): [State, boolean, Value|undefined, Warning[]] {
        for (let i = 0; i < this.functorBinding.length; ++i) {
            state = this.functorBinding[i].evaluate(state);
        }
        return [state, false, undefined, []];
    }

    simplify(): FunctorDeclaration {
        let bnd: FunctorBinding[] = [];
        for (let i = 0; i < this.functorBinding.length; ++i) {
            bnd.push(this.functorBinding[i].simplify());
        }
        return new FunctorDeclaration(this.position, bnd);
    }

    toString(): string {
        let res = 'functor';
        for (let i = 0; i < this.functorBinding.length; ++i) {
            res += ' ' + this.functorBinding[i];
        }
        return res + ';';
    }
}


export class StructureBinding {
// strid = strexp
    constructor(public position: number, public name: IdentifierToken,
                public binding: Expression & Structure) {
    }

    simplify(): StructureBinding {
        return new StructureBinding(this.position, this.name,
            <Expression & Structure> this.binding.simplify());
    }

    evaluate(state: State): [State, boolean, Value|undefined, Warning[]] {
        let tmp = this.binding.computeStructure(state);
        for (let i = 0; i < tmp[2].length; ++i) {
            state.setCell(tmp[2][i][0], tmp[2][i][1]);
        }
        if (tmp[0] instanceof Value) {
            return [state, true, <Value> tmp[0], tmp[1]];
        }
        state.setDynamicStructure(this.name.getText(), <DynamicBasis> tmp[0]);
        return [state, false, undefined, tmp[1]];
    }

    toString(): string {
        return this.name.getText() + ' = ' + this.binding;
    }
}

export class SignatureBinding {
// sigid = sigexp
    constructor(public position: number, public name: IdentifierToken,
                public binding: Expression & Signature) {
    }

    simplify(): SignatureBinding {
        return new SignatureBinding(this.position, this.name,
            <Expression & Signature> this.binding.simplify());
    }

    evaluate(state: State): State {
        state.setDynamicSignature(this.name.getText(), this.binding.computeInterface(state));
        return state;
    }

    toString(): string {
        return this.name.getText() + ' = ' + this.binding;
    }
}

export class FunctorBinding {
// funid ( strid : sigexp ) = strexp
    constructor(public position: number, public name: IdentifierToken,
                public signatureName: IdentifierToken,
                public signatureBinding: Expression & Signature,
                public binding: Expression & Structure) {
    }

    simplify(): FunctorBinding {
        return new FunctorBinding(this.position, this.name, this.signatureName,
            <Expression & Signature> this.signatureBinding.simplify(),
            <Expression & Structure> this.binding.simplify());
    }

    evaluate(state: State): State {
        let inter = this.signatureBinding.computeInterface(state);
        let nstate = getInitialState().getNestedState(state.id);
        nstate.dynamicBasis = state.getDynamicChanges(-1);

        state.setDynamicFunctor(this.name.getText(),
            new DynamicFunctorInformation(this.signatureName, inter, this.binding, nstate));

        return state;
    }

    toString(): string {
        return this.name.getText() + '( ' + this.signatureName + ' : ' + this.signatureBinding
            + ' ) = ' + this.binding;
    }
}



// Specifications

export abstract class Specification {
    abstract computeInterface(state: State): DynamicInterface;
}

export class ValueSpecification extends Specification {
// val valdesc
    constructor(public position: number, public valueDescription: [IdentifierToken, Type][]) {
        super();
    }

    computeInterface(state: State): DynamicInterface {
        let res: DynamicValueInterface = {};
        for (let i = 0; i < this.valueDescription.length; ++i) {
            res[this.valueDescription[i][0].getText()] = IdentifierStatus.VALUE_VARIABLE;
        }
        return new DynamicInterface({}, res, {});
    }
}

export class TypeSpecification extends Specification {
// type [tyvarseq tycon][]
    constructor(public position: number, public typeDescription: [TypeVariable[], IdentifierToken][]) {
        super();
    }

    computeInterface(state: State): DynamicInterface {
        let res: DynamicTypeInterface = {};
        for (let i = 0; i < this.typeDescription.length; ++i) {
            res[this.typeDescription[i][1].getText()] = [];
        }
        return new DynamicInterface(res, {}, {});
    }
}

export class EqualityTypeSpecification extends Specification {
// eqtype [tyvarseq tycon][]
    constructor(public position: number, public typeDescription: [TypeVariable[], IdentifierToken][]) {
        super();
    }

    computeInterface(state: State): DynamicInterface {
        let res: DynamicTypeInterface = {};
        for (let i = 0; i < this.typeDescription.length; ++i) {
            res[this.typeDescription[i][1].getText()] = [];
        }
        return new DynamicInterface(res, {}, {});
    }
}

export class DatatypeSpecification extends Specification {
// datatype [tyvarseq tycon = [vid <of ty>][]][]
    constructor(public position: number, public datatypeDescription: [TypeVariable[],
        IdentifierToken, [IdentifierToken, Type|undefined][]][]) {
        super();
    }

    computeInterface(state: State): DynamicInterface {
        let vi: DynamicValueInterface = {};
        let ti: DynamicTypeInterface = {};

        for (let i = 0; i < this.datatypeDescription.length; ++i) {
            let cns: string[] = [];
            for (let j = 0; j < this.datatypeDescription[i][2].length; ++j) {
                vi[this.datatypeDescription[i][2][j][0].getText()]
                    = IdentifierStatus.VALUE_CONSTRUCTOR;
                cns.push(this.datatypeDescription[i][2][j][0].getText());
            }
            ti[this.datatypeDescription[i][1].getText()] = cns;
        }
        return new DynamicInterface(ti, vi, {});
    }
}

export class DatatypeReplicationSpecification extends Specification {
// datatype tycon = datatype longtycon
    constructor(public position: number, public name: IdentifierToken, public oldname: Token) {
        super();
    }

    computeInterface(state: State): DynamicInterface {
        let st = state.dynamicBasis;
        let tp: string[] | undefined = [];
        if (this.oldname instanceof LongIdentifierToken) {
            for (let i = 0; i < (<LongIdentifierToken> this.oldname).qualifiers.length; ++i) {
                let tmp: DynamicBasis | undefined;
                if (i === 0) {
                    tmp = state.getDynamicStructure(
                        (<LongIdentifierToken> this.oldname).qualifiers[i].getText());
                } else {
                    tmp = st.getStructure(
                        (<LongIdentifierToken> this.oldname).qualifiers[i].getText());
                }
                if (tmp === undefined) {
                    throw new EvaluationError(this.position, 'Undefined module "'
                        + (<LongIdentifierToken> this.oldname).qualifiers[i].getText() + '"');
                }
                st = <DynamicBasis> tmp;
            }
            tp = <string[]> st.getType((<LongIdentifierToken> this.oldname).id.getText());
        } else {
            tp = <string[]> state.getDynamicType(this.oldname.getText());
        }

        if (tp === undefined) {
            throw new EvaluationError(this.position, 'The datatype "'
                + this.oldname.getText() + '" does not exist.');
        }

        let vi: DynamicValueInterface = {};
        for (let i = 0; i < (<string[]> tp).length; ++i) {
            vi[(<string[]> tp)[i]] = IdentifierStatus.VALUE_CONSTRUCTOR;
        }
        let ti: DynamicTypeInterface = {};
        ti[this.name.getText()] = <string[]> tp;
        return new DynamicInterface(ti, vi, {});
    }
}

export class ExceptionSpecification extends Specification {
// exception [vid <of ty>][]
    constructor(public position: number, public exceptionDescription: [IdentifierToken, Type|undefined][]) {
        super();
    }

    computeInterface(state: State): DynamicInterface {
        let res: DynamicValueInterface = {};
        for (let i = 0; i < this.exceptionDescription.length; ++i) {
            res[this.exceptionDescription[i][0].getText()] = IdentifierStatus.EXCEPTION_CONSTRUCTOR;
        }
        return new DynamicInterface({}, res, {});
    }
}

export class StructureSpecification extends Specification {
// structure [strid: sigexp][]
    constructor(public position: number, public structureDescription: [IdentifierToken, Expression & Signature][]) {
        super();
    }

    computeInterface(state: State): DynamicInterface {
        let res: DynamicStructureInterface = {};
        for (let i = 0; i < this.structureDescription.length; ++i) {
            res[this.structureDescription[i][0].getText()] = this.structureDescription[i][1].computeInterface(state);
        }
        return new DynamicInterface({}, {}, res);
    }
}

export class IncludeSpecification extends Specification {
// include sigexp
    constructor(public position: number, public expression: Expression & Signature) {
        super();
    }

    computeInterface(state: State): DynamicInterface {
        return this.expression.computeInterface(state);
    }
}

export class EmptySpecification extends Specification {
//
    constructor(public position: number) {
        super();
    }

    computeInterface(state: State): DynamicInterface {
        return new DynamicInterface({}, {}, {});
    }
}

export class SequentialSpecification extends Specification {
// spec[]
    constructor(public position: number, public specifications: Specification[]) {
        super();
    }

    computeInterface(state: State): DynamicInterface {
        let res = new DynamicInterface({}, {}, {});
        for (let i = 0; i < this.specifications.length; ++i) {
            res = res.extend(this.specifications[i].computeInterface(state));
        }
        return res;
    }
}

export class SharingSpecification extends Specification {
// spec sharing type longtycon = ... = longtycon
    constructor(public position: number, public specification: Specification,
                public typeNames: Token[]) {
        super();
    }

    computeInterface(state: State): DynamicInterface {
        return this.specification.computeInterface(state);
    }
}
