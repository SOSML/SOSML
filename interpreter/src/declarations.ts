import {
    Expression, ValueIdentifier, CaseAnalysis, Lambda, Match,
    Pattern, TypedExpression, Tuple, PatternExpression
} from './expressions';
import { IdentifierToken, Token } from './lexer';
import { Type, TypeVariable } from './types';
import { State } from './state';
import { InternalInterpreterError, Position } from './errors';


export abstract class Declaration {
    checkStaticSemantics(state: State): void {
        throw new InternalInterpreterError( -1, 'Not yet implemented.');
    }
    evaluate(state: State): void {
        throw new InternalInterpreterError( -1, 'Not yet implemented.');
    }
    prettyPrint(indentation: number, oneLine: boolean): string {
        throw new InternalInterpreterError( -1, 'Not yet implemented.');
    }
    simplify(): Declaration {
        throw new InternalInterpreterError( -1, 'Not yet implemented.');
    }
}

export interface ExceptionBinding {
}

export class ValueBinding {
// <rec> pattern = expression
    constructor(public position: Position, public isRecursive: boolean,
                public pattern: Pattern, public expression: Expression) {
    }

    prettyPrint(indentation: number, oneLine: boolean): string {
        // TODO nicify this
        let res = '';
        if (this.isRecursive) {
            res += 'rec ';
        }
        res += this.pattern.prettyPrint(indentation, oneLine);
        res += ' = ';
        return res + this.expression.prettyPrint(indentation, oneLine);
    }
}

export class FunctionValueBinding {

    constructor(public position: Position,
                public parameters: [PatternExpression[], Type|undefined, Expression][],
                public name: ValueIdentifier) {
    }

    simplify(): ValueBinding {
        if (this.name === undefined) {
            throw new InternalInterpreterError(this.position,
                'This function isn\'t ready to be simplified yet.');
        }

        // Build the case analysis, starting with the (vid1,...,vidn)
        let arr: ValueIdentifier[] = [];
        let matches: [PatternExpression, Expression][] = [];
        for (let i = 0; i < this.parameters.length; ++i) {
            arr.push(new ValueIdentifier(-1, new IdentifierToken('__arg' + i, -1)));
            if (this.parameters[i][1] === undefined) {
                matches.push([new Tuple(-1, this.parameters[i][0]), this.parameters[i][2]]);
            } else {
                matches.push([new Tuple(-1, this.parameters[i][0]),
                    new TypedExpression(-1, this.parameters[i][2], <Type> this.parameters[i][1])]);
            }
        }
        let pat = new Tuple(-1, arr).simplify();
        let mat = new Match(-1, matches);
        let exp: Expression = new CaseAnalysis(-1, pat, mat);

        // Now build the lambdas around
        for (let i = this.parameters.length - 1; i >= 0; --i) {
            exp = new Lambda(-1, new Match(-1, [[
                new ValueIdentifier(-1, new IdentifierToken('__arg' + i, -1)),
                exp]]));
        }

        return new ValueBinding(this.position, true, this.name, exp);
    }

    prettyPrint(indentation: number, oneLine: boolean): string {
        // TODO
        // public parameters: [PatternExpression[], Type|undefined, Expression][]
        let res = '';
        for (let i = 0; i < this.parameters.length; ++i) {
            if (i > 0) {
                res += ' | ';
            }
            res += this.name.name.getText();
            for (let j = 0; j < this.parameters[i][0].length; ++j) {
                res += ' ' + this.parameters[i][0][j].prettyPrint(indentation, oneLine);
            }
            if (this.parameters[i][1] !== undefined) {
                res += ': ' + (<Type> this.parameters[i][1]).prettyPrint();
            }
            res += ' = ' + this.parameters[i][2].prettyPrint(indentation, oneLine);
        }
        return res;
    }
}

export class TypeBinding {
// typeVariableSequence name = type
    constructor(public position: Position, public typeVariableSequence: TypeVariable[],
                public name: IdentifierToken, public type: Type) {
    }
}

export class DatatypeBinding {
// typeVariableSequence name = <op> constructor <of type>
    // type: [constructorName, <type>]
    constructor(public position: Position, public typeVariableSequence: TypeVariable[],
                public name: IdentifierToken, public type: [IdentifierToken, Type | undefined][]) {
    }
}

export class DirectExceptionBinding implements ExceptionBinding {
// <op> name <of type>
    constructor(public position: Position, public name: IdentifierToken, public type: Type | undefined) {
    }
}

export class ExceptionAlias implements ExceptionBinding {
// <op> name = <op> oldname
    constructor(public position: Position, public name: IdentifierToken, public oldname: Token) {
    }
}

export class ExceptionDeclaration extends Declaration {
    constructor(public position: Position, public bindings: ExceptionBinding[]) {
        super();
    }

    simplify(): ExceptionDeclaration {
        return this;
    }

    prettyPrint(indentation: number, oneLine: boolean): string {
        // TODO
        throw new InternalInterpreterError( -1, 'Not yet implemented.');
    }
}

// Declaration subclasses
export class ValueDeclaration extends Declaration {
// val typeVariableSequence valueBinding
    constructor(public position: Position, public typeVariableSequence: TypeVariable[],
                public valueBinding: ValueBinding[]) {
        super();
    }

    simplify(): ValueDeclaration {
        let valBnd: ValueBinding[] = [];
        for (let i = 0; i < this.valueBinding.length; ++i) {
            valBnd.push(new ValueBinding(this.valueBinding[i].position,
                                         this.valueBinding[i].isRecursive,
                                         this.valueBinding[i].pattern.simplify(),
                                         this.valueBinding[i].expression.simplify()));
        }
        return new ValueDeclaration(this.position, this.typeVariableSequence, valBnd);
    }

    prettyPrint(indentation: number, oneLine: boolean): string {
        // TODO
        let res = 'val <stuff>';
        for (let i = 0; i < this.valueBinding.length; ++i) {
            if (i > 0) {
                res += ' and';
            }
            res += ' ' + this.valueBinding[i].prettyPrint(indentation, oneLine);
        }
        return res += ';';
    }
}

export class FunctionDeclaration extends Declaration {
// fun typeVariableSequence functionValueBinding
    constructor(public position: Position, public typeVariableSequence: TypeVariable[],
                public functionValueBinding: FunctionValueBinding[]) {
        super();
    }

    simplify(): ValueDeclaration {
        let valbnd: ValueBinding[] = [];
        for (let i = 0; i < this.functionValueBinding.length; ++i) {
            valbnd.push(this.functionValueBinding[i].simplify());
        }
        return new ValueDeclaration(this.position, this.typeVariableSequence, valbnd);
    }

    prettyPrint(indentation: number, oneLine: boolean): string {
        // TODO
        let res = 'fun <stuff>';
        for (let i = 0; i < this.functionValueBinding.length; ++i) {
            if (i > 0) {
                res += ' and';
            }
            res += ' ' + this.functionValueBinding[i].prettyPrint(indentation, oneLine);
        }
        return res + ';';
    }
}

export class TypeDeclaration extends Declaration {
// type typeBinding
    constructor(public position: Position, public typeBinding: TypeBinding[]) {
        super();
    }

    simplify(): TypeDeclaration {
        let bnds: TypeBinding[] = [];
        for (let i = 0; i < this.typeBinding.length; ++i) {
            bnds.push(new TypeBinding(this.typeBinding[i].position,
                                      this.typeBinding[i].typeVariableSequence,
                                      this.typeBinding[i].name,
                                      this.typeBinding[i].type.simplify()));
        }
        return new TypeDeclaration(this.position, bnds);
    }

    prettyPrint(indentation: number, oneLine: boolean): string {
        // TODO
        let res = 'type';
        for (let i = 0; i < this.typeBinding.length; ++i) {
            if (i > 0) {
                res += ' and';
            }
            res += ' <stuff> ' + this.typeBinding[i].name.getText();
            res += ' = ' + this.typeBinding[i].type.prettyPrint();
        }
        return res + ';';
    }
}

export class DatatypeDeclaration extends Declaration {
// datatype datatypeBinding <withtype typeBinding>
    constructor(public position: Position, public datatypeBinding: DatatypeBinding[],
                public typeBinding: (TypeBinding[]) | undefined) {
        super();
    }

    simplify(): Declaration {
        let datbnd: DatatypeBinding[] = [];

        for (let i = 0; i < this.datatypeBinding.length; ++i) {
            let ntype: [IdentifierToken, Type|undefined][] = [];
            for (let j = 0; j < this.datatypeBinding[i].type.length; ++j) {
                if (this.datatypeBinding[i].type[j][1] !== undefined) {
                    ntype.push([this.datatypeBinding[i].type[j][0],
                               (<Type> this.datatypeBinding[i].type[j][1]).simplify()]);
                } else {
                    ntype.push(this.datatypeBinding[i].type[j]);
                }
            }
            datbnd.push(new DatatypeBinding(this.datatypeBinding[i].position,
                this.datatypeBinding[i].typeVariableSequence,
                this.datatypeBinding[i].name,
                ntype));
        }

        // TODO Correctly implement the withtype ~> type transition
        /*
        if (this.typeBinding) {
            return new SequentialDeclaration(this.position, [
                new DatatypeDeclaration(this.position, datbnd, undefined),
                new TypeDeclaration(this.position, this.typeBinding).simplify()]);
        } else { */
        return new DatatypeDeclaration(this.position, datbnd, undefined);
        /* } */
    }

    prettyPrint(indentation: number, oneLine: boolean): string {
        // TODO
        let res = 'datatype';
        for (let i = 0; i < this.datatypeBinding.length; ++i) {
            if (i > 0) {
                res += ' and';
            }
            res += ' <stuff> ' + this.datatypeBinding[i].name.getText() + ' =';
            for (let j = 0; j < this.datatypeBinding[i].type.length; ++j) {
                if (j > 0) {
                    res += ' | ';
                }
                res += ' ' + this.datatypeBinding[i].type[j][0].getText();
                if (this.datatypeBinding[i].type[j][1] !== undefined) {
                    res += ' of ' + (<Type> this.datatypeBinding[i].type[j][1]).prettyPrint();
                }
            }
        }
        return res;
    }
}

export class DatatypeReplication extends Declaration {
// datatype name -=- datatype oldname
    constructor(public position: Position, public name: IdentifierToken,
                public oldname: Token) {
        super();
    }

    simplify(): DatatypeReplication {
        return this;
    }

    prettyPrint(indentation: number, oneLine: boolean): string {
        // TODO
        throw new InternalInterpreterError( -1, 'Not yet implemented.');
    }
}

export class AbstypeDeclaration extends Declaration {
// abstype datatypeBinding <withtype typeBinding> with declaration end
    constructor(public position: Position, public datatypeBinding: DatatypeBinding[],
                public typeBinding: (TypeBinding[]) | undefined, public declaration: Declaration) {
        super();
    }

    simplify(): AbstypeDeclaration {
        let datbnd: DatatypeBinding[] = [];

        for (let i = 0; i < this.datatypeBinding.length; ++i) {
            let ntype: [IdentifierToken, Type|undefined][] = [];
            for (let j = 0; j < this.datatypeBinding[i].type.length; ++j) {
                if (this.datatypeBinding[i].type[j][1] !== undefined) {
                    ntype.push([this.datatypeBinding[i].type[j][0],
                               (<Type> this.datatypeBinding[i].type[j][1]).simplify()]);
                } else {
                    ntype.push(this.datatypeBinding[i].type[j]);
                }
            }
            datbnd.push(new DatatypeBinding(this.datatypeBinding[i].position,
                this.datatypeBinding[i].typeVariableSequence,
                this.datatypeBinding[i].name,
                ntype));
        }

        // TODO Correctly implement the withtype ~> type transition
        /* if (this.typeBinding) {
            return new AbstypeDeclaration(this.position, datbnd, undefined,
                new SequentialDeclaration(this.position, [
                    new TypeDeclaration(this.position, this.typeBinding).simplify(),
                    this.declaration.simplify()]));
        } else { */
        return new AbstypeDeclaration(this.position, datbnd, this.typeBinding,
            this.declaration.simplify());
        /* } */

    }

    prettyPrint(indentation: number, oneLine: boolean): string {
        // TODO
        throw new InternalInterpreterError( -1, 'Not yet implemented.');
    }
}

export class LocalDeclaration extends Declaration {
// local declaration in body end
    constructor(public position: Position, public declaration: Declaration, public body: Declaration) {
        super();
    }

    simplify(): LocalDeclaration {
        return new LocalDeclaration(this.position, this.declaration.simplify(), this.body.simplify());
    }

    prettyPrint(indentation: number, oneLine: boolean): string {
        // TODO this is just something that works but not pretty
        let res = 'local ' + this.declaration.prettyPrint(indentation, oneLine);
        res += ' in ' + this.body.prettyPrint(indentation, oneLine);
        res += ' end;';
        return res;
    }
}

export class OpenDeclaration extends Declaration {
// open name_1 ... name_n
    constructor(public position: Position, public names: Token[]) {
        super();
    }

    simplify(): OpenDeclaration {
        return this;
    }

    prettyPrint(indentation: number, oneLine: boolean): string {
        // TODO this is just something that works but not pretty
        let res = 'open';
        for (let i = 0; i < this.names.length; ++i) {
            res += ' ' + this.names[i].getText();
        }
        return res + ';';
    }
}

export class SequentialDeclaration extends Declaration {
// declaration1 <;> declaration2
    constructor(public position: Position, public declarations: Declaration[]) {
        super();
    }

    simplify(): SequentialDeclaration {
        let decls: Declaration[] = [];
        for (let i = 0; i < this.declarations.length; ++i) {
            decls.push(this.declarations[i].simplify());
        }
        return new SequentialDeclaration(this.position, decls);
    }

    prettyPrint(indentation: number, oneLine: boolean): string {
        // TODO this is just something that works but not pretty
        let res = '';
        for (let i = 0; i < this.declarations.length; ++i) {
            if (i > 0) {
                res += ' ';
            }
            res += this.declarations[i].prettyPrint(indentation, oneLine);
        }
        return res;
    }
}

export class InfixDeclaration extends Declaration {
// infix <d> vid1 .. vidn
    constructor(public position: Position, public operators: IdentifierToken[],
                public precedence: number = 0) {
        super();
    }

    simplify(): InfixDeclaration {
        return this;
    }

    prettyPrint(indentation: number, oneLine: boolean): string {
        // TODO this is just something that works but not pretty
        let res = 'infix';
        res += ' ' + this.precedence;
        for (let i = 0; i < this.operators.length; ++i) {
            res += ' ' + this.operators[i].getText();
        }
        return res + ';';
    }
}

export class InfixRDeclaration extends Declaration {
// infixr <d> vid1 .. vidn
    constructor(public position: Position, public operators: IdentifierToken[],
                public precedence: number = 0) {
        super();
    }

    simplify(): InfixRDeclaration {
        return this;
    }

    prettyPrint(indentation: number, oneLine: boolean): string {
        // TODO this is just something that works but not pretty
        let res = 'infixr';
        res += ' ' + this.precedence;
        for (let i = 0; i < this.operators.length; ++i) {
            res += ' ' + this.operators[i].getText();
        }
        return res + ';';
    }
}

export class NonfixDeclaration extends Declaration {
// infix <d> vid1 .. vidn
    constructor(public position: Position, public operators: IdentifierToken[]) {
        super();
    }

    simplify(): NonfixDeclaration {
        return this;
    }

    prettyPrint(indentation: number, oneLine: boolean): string {
        // TODO use the params
        let res = 'nonfix';
        for (let i = 0; i < this.operators.length; ++i) {
            res += ' ' + this.operators[i].getText();
        }
        return res + ';';
    }
}

export class EmptyDeclaration extends Declaration {
// exactly what it sais on the tin.
    constructor() {
        super();
    }

    simplify(): EmptyDeclaration {
        return this;
    }

    prettyPrint(indentation: number, oneLine: boolean): string {
        return ' ;';
    }
}
