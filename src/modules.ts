import { Expression } from './expressions';
import { Declaration } from './declarations';
import { IdentifierToken, Token, LongIdentifierToken } from './tokens';
import { Type, TypeVariable } from './types';
import { State, DynamicInterface, DynamicStructureInterface, DynamicValueInterface,
         DynamicTypeInterface, IdentifierStatus, DynamicBasis } from './state';
import { Warning, EvaluationError } from './errors';
import { Value } from './values';

// Module Expressions

// Structure Expressions

export class StructureExpression extends Expression {
// struct <strdec> end
    constructor(public position: number, public structureDeclaration: Declaration) {
        super();
    }

    simplify(): StructureExpression {
        return new StructureExpression(this.position, this.structureDeclaration.simplify());
    }

    toString(): string {
        return 'struct ' + this.structureDeclaration + ' end';
    }
}

export class StructureIdentifier extends Expression {
// longstrid
    constructor(public position: number, public identifier: Token) {
        super();
    }

    simplify(): StructureIdentifier {
        return this;
    }

    toString(): string {
        return this.identifier.getText();
    }
}

export class TransparentConstraint extends Expression {
// strexp : sigexp
    constructor(public position: number, public structureExpression: Expression,
                public signatureExpression: Expression & Signature) {
        super();
    }

    simplify(): TransparentConstraint {
        return new TransparentConstraint(this.position, this.structureExpression.simplify(),
            <Expression & Signature> this.signatureExpression.simplify());
    }

    toString(): string {
        return this.structureExpression + ' : ' + this.signatureExpression;
    }
}

export class OpaqueConstraint extends Expression {
// strexp :> sigexp
    constructor(public position: number, public structureExpression: Expression,
                public signatureExpression: Expression & Signature) {
        super();
    }

    simplify(): OpaqueConstraint {
        return new OpaqueConstraint(this.position, this.structureExpression.simplify(),
            <Expression & Signature> this.signatureExpression.simplify());
    }

    toString(): string {
        return this.structureExpression + ' :> ' + this.signatureExpression;
    }
}

export class FunctorApplication extends Expression {
// funid ( strexp )
    constructor(public position: number, public functorId: IdentifierToken,
                public structureExpression: Expression ) {
        super();
    }

    simplify(): FunctorApplication {
        return new FunctorApplication(this.position, this.functorId, this.structureExpression.simplify());
    }

    toString(): string {
        return this.functorId.getText() + '( ' + this.structureExpression + ' )';
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
        // TODO move this in the state
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
        let rs = st.getSignature(this.identifier.getText());
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

    elaborate(state: State, tyVarBnd: Map<string, Type> = new Map<string, Type>(), nextName: string = '\'t0'):
    [State, Warning[], Map<string, Type>, string] {
        // TODO
        return [state, [new Warning(this.position, 'Skipped elaborating structure.\n')], tyVarBnd, nextName];
    }

    evaluate(state: State): [State, boolean, Value|undefined, Warning[]] {
        // TODO
        return [state, false, undefined, []];
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

    elaborate(state: State, tyVarBnd: Map<string, Type> = new Map<string, Type>(), nextName: string = '\'t0'):
    [State, Warning[], Map<string, Type>, string] {
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

    elaborate(state: State, tyVarBnd: Map<string, Type> = new Map<string, Type>(), nextName: string = '\'t0'):
    [State, Warning[], Map<string, Type>, string] {
        // TODO
        return [state, [new Warning(this.position, 'Skipped elaborating functor.\n')], tyVarBnd, nextName];
    }

    evaluate(state: State): [State, boolean, Value|undefined, Warning[]] {
        // TODO
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
                public binding: Expression) {
    }

    simplify(): StructureBinding {
        return new StructureBinding(this.position, this.name, this.binding.simplify());
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
                public binding: Expression) {
    }

    simplify(): FunctorBinding {
        return new FunctorBinding(this.position, this.name, this.signatureName,
            <Expression & Signature> this.signatureBinding.simplify(), this.binding.simplify());
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
            tp = <string[]> st.getType(this.oldname.getText());
        }

        if (tp === undefined) {
            throw new EvaluationError(this.position, 'Unbound type "'
                + this.oldname.getText() + '".');
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
