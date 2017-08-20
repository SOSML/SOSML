import { Expression } from './expressions';
import { Declaration } from './declarations';
import { IdentifierToken, LongIdentifierToken, Token } from './tokens';
import { Type, TypeVariable } from './types';

// Module Expressions

// Structure Expressions

export class StructureExpression extends Expression {
// struct <strdec> end
    constructor(public position: number, public structureDeclaration: Declaration) {
        super();
    }

    simplify(): StructureExpression {
        // TODO
        return this;
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
}

export class TransparentConstraint extends Expression {
// strexp : sigexp
    constructor(public position: number, public structureExpression: Expression,
                public signatureExpression: Expression) {
        super();
    }

    simplify(): TransparentConstraint {
        // TODO
        return this;
    }
}

export class OpaqueConstraint extends Expression {
// strexp :> sigexp
    constructor(public position: number, public structureExpression: Expression,
                public signatureExpression: Expression) {
        super();
    }

    simplify(): OpaqueConstraint {
        // TODO
        return this;
    }
}

export class FunctorApplication extends Expression {
// funid ( strexp )
    constructor(public position: number, public functorId: IdentifierToken,
                public structureExpression: Expression) {
        super();
    }

    simplify(): FunctorApplication {
        // TODO
        return this;
    }
}

// Signature Expressions

export class SignatureExpression extends Expression {
// sig spec end
    constructor(public position: number, public specification: Specification) {
        super();
    }

    simplify(): SignatureExpression {
        return this;
    }
}

export class SignatureIdentifier extends Expression {
// sigid
    constructor(public position: number, public identifier: Token) {
        super();
    }

    simplify(): SignatureIdentifier {
        return this;
    }
}

export class TypeRealisation extends Expression {
// sigexp where type tyvarseq longtycon = ty
    constructor(public position: number, public signatureExpression: Expression,
                public tyvarseq: TypeVariable[], public name: Token,
                public type: Type) {
        super();
    }

    simplify(): TypeRealisation {
        // TODO
        return this;
    }
}


// Module declarations and bindings

// Sutrcture declaration

export class StructureDeclaration extends Declaration {
// structure strbind
    constructor(public position: number, public structureBinding: StructureBinding[]) {
        super();
    }
}

export class SignatureDeclaration extends Declaration {
// signature sigbind
    constructor(public position: number, public signatureBinding: SignatureBinding[]) {
        super();
    }
}

export class FunctorDeclaration extends Declaration {
// functor funbind
    constructor(public position: number, public functorBinding: FunctorBinding[]) {
        super();
    }
}


export class StructureBinding {
// strid = strexp
    constructor(public position: number, public name: IdentifierToken,
                public binding: Expression) {
    }
}

export class SignatureBinding {
// sigid = sigexp
    constructor(public position: number, public name: IdentifierToken,
                public binding: Expression) {
    }
}

export class FunctorBinding {
// funid ( strid : sigexp ) = strexp
    constructor(public position: number, public name: IdentifierToken,
                public signatureName: IdentifierToken, public signatureBinding: Expression,
                public binding: Expression) {
    }
}



// Specifications

export class Specification {

}

export class ValueSpecification extends Specification {
// val valdesc
    constructor(public position: number, public valueDescription: [IdentifierToken, Type][]) {
        super();
    }
}

export class TypeSpecification extends Specification {
// type [tyvarseq tycon][]
    constructor(public position: number, public typeDescription: [TypeVariable[], IdentifierToken][]) {
        super();
    }
}

export class EqualityTypeSpecification extends Specification {
// eqtype [tyvarseq tycon][]
    constructor(public position: number, public typeDescription: [TypeVariable[], IdentifierToken][]) {
        super();
    }
}

export class DatatypeSpecification extends Specification {
// datatype [tyvarseq tycon = [vid <of ty>][]][]
    constructor(public position: number, public datatypeDescription: [TypeVariable[],
        IdentifierToken, [IdentifierToken, Type|undefined][]][]) {
        super();
    }
}

export class DatatypeReplicationSpecification extends Specification {
// datatype tycon = datatype longtycon
    constructor(public position: number, public name: IdentifierToken,
                public oldname: LongIdentifierToken) {
        super();
    }
}

export class ExceptionSpecification extends Specification {
// exception [vid <of ty>][]
    constructor(public position: number, public exceptionDescription: [IdentifierToken, Type|undefined][]) {
        super();
    }
}

export class StructureSpecification extends Specification {
// structure [strid: sigexp][]
    constructor(public position: number, public structureDescription: [IdentifierToken, Expression][]) {
        super();
    }
}

export class IncludeSpecification extends Specification {
// include sigexp
    constructor(public position: number, public expression: Expression) {
        super();
    }
}

export class EmptySpecification extends Specification {
//
    constructor(public position: number) {
        super();
    }
}

export class SequentialSpecification extends Specification {
// spec[]
    constructor(public position: number, public specifications: Specification[]) {
        super();
    }
}

export class SharingSpecification extends Specification {
// spec sharing type longtycon = ... = longtycon
    constructor(public position: number, public specification: Specification,
                public typeNames: LongIdentifierToken[]) {
        super();
    }
}
