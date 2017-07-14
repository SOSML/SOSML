import {
    Expression, ValueIdentifier, CaseAnalysis, Lambda, Match,
    Pattern, TypedExpression, Tuple, PatternExpression
} from './expressions';
import { IdentifierToken, LongIdentifierToken, Token } from './lexer';
import { Type, TypeVariable } from './types';
import { State } from './state';
import { InternalInterpreterError, Position } from './errors';
import { ASTNode } from './ast';
import { ParserError } from './parser';


export abstract class Declaration extends ASTNode {
    checkStaticSemantics(state: State): void {
        throw new InternalInterpreterError( -1, 'Not yet implemented.');
    }
    evaluate(state: State): void {
        throw new InternalInterpreterError( -1, 'Not yet implemented.');
    }
    prettyPrint(indentation: number, oneLine: boolean): string {
        throw new InternalInterpreterError( -1, 'Not yet implemented.');
    }
    simplify(): ASTNode {
        throw new InternalInterpreterError( -1, 'Not yet implemented.');
    }
    reParse(state: State): ASTNode {
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
    public name: ValueIdentifier|undefined = undefined;

    constructor(public position: Position,
                public parameters: [PatternExpression[], Type|undefined, Expression][]) {
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

    reParse(state: State): FunctionValueBinding {
        if (this.name !== undefined) {
            // This FnBnd is already fully parsed
            return this;
        }

        let name: ValueIdentifier;
        let isInfix = false;

        if (this.parameters[0][0].length !== 3
            || !(this.parameters[0][0][1] instanceof ValueIdentifier)
            || !state.getIdentifierInformation((<ValueIdentifier> this.parameters[0][0][1]).name).infix) {
            // No infix stuff
            if (!(this.parameters[0][0][0] instanceof ValueIdentifier)) {
                throw new ParserError('Expected function name.', -1);
            }
            name = <ValueIdentifier> this.parameters[0][0][0];
        } else {
            name = <ValueIdentifier> this.parameters[0][0][1];
        }

        // Filter out the name everywhere.
        let params: [PatternExpression[], Type|undefined, Expression][] = [];

        for (let i = 0; i < this.parameters.length; ++i) {
            let nwargs: PatternExpression[] = [];

            if (this.parameters[i][0].length === 3) {
                // Could be infixed
                if (this.parameters[i][0][1] instanceof ValueIdentifier
                    && (<ValueIdentifier> this.parameters[i][0][1]).name.getText()
                        === name.name.getText()) {
                    if (!state.getIdentifierInformation((<ValueIdentifier> this.parameters[0][0][1]).name).infix) {
                        throw new ParserError('Cannot use \"' + name.name.getText()
                            + '\" as infix op.', this.parameters[0][0][1].position);
                    }
                    params.push([
                        [new Tuple(-1, [this.parameters[0][0][0], this.parameters[0][0][2]])],
                        this.parameters[0][1], this.parameters[0][2].reParse(state)
                    ]);
                    isInfix = true;
                    continue;
                }
            }

            if (!(this.parameters[i][0][0] instanceof ValueIdentifier)) {
                throw new ParserError('Expected an identifier.', this.parameters[i][0][0].position);
            }
            if (isInfix && !(<IdentifierToken|LongIdentifierToken>
                (<ValueIdentifier> this.parameters[i][0][0]).name).opPrefixed) {
                throw new ParserError('Expected an op-prefixed identifier.',
                    this.parameters[i][0][0].position);
            }
            if ((<ValueIdentifier> this.parameters[i][0][0]).name.getText() === name.name.getText()) {
                if (state.getIdentifierInformation((<ValueIdentifier> this.parameters[0][0][0]).name).infix) {
                    if (this.parameters[i][0].length !== 2) {
                        throw new ParserError('Invalid number of arguments.',
                            this.parameters[0][0][1].position);
                    }
                    isInfix = true;
                    if (!(<IdentifierToken|LongIdentifierToken>
                        (<ValueIdentifier> this.parameters[i][0][0]).name).opPrefixed) {
                        throw new ParserError('Expected an op-prefixed identifier.',
                            this.parameters[i][0][0].position);
                    }

                    params.push([[this.parameters[0][0][1]],
                        this.parameters[0][1],
                        this.parameters[0][2].reParse(state)]);
                    continue;
                }
                for (let j = 1; j < this.parameters[i][0].length; ++j) {
                    nwargs.push(this.parameters[i][0][j]);
                }
                params.push([nwargs, this.parameters[0][1], this.parameters[0][2].reParse(state)]);
                continue;
            }
            throw new ParserError('Expected the identifier \"' + name.name.getText() + '\" but got \"'
                + (<ValueIdentifier> this.parameters[i][0][0]).name.getText() + '\" instead.',
                this.parameters[i][0][0].position);
        }

        let res = new FunctionValueBinding(this.position, params);
        res.name = name;
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

    simplify(): ASTNode {
        return this;
    }
    reParse(state: State): ExceptionDeclaration {
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

    simplify(): ASTNode {
        let valBnd: ValueBinding[] = [];
        for (let i = 0; i < this.valueBinding.length; ++i) {
            valBnd.push(new ValueBinding(this.valueBinding[i].position,
                                         this.valueBinding[i].isRecursive,
                                         this.valueBinding[i].pattern.simplify(),
                                         this.valueBinding[i].expression.simplify()));
        }
        return new ValueDeclaration(this.position, this.typeVariableSequence, valBnd);
    }
    reParse(state: State): ValueDeclaration {
        let valBnd: ValueBinding[] = [];
        for (let i = 0; i < this.valueBinding.length; ++i) {
            valBnd.push(new ValueBinding(this.valueBinding[i].position,
                                         this.valueBinding[i].isRecursive,
                                         this.valueBinding[i].pattern,
                                         this.valueBinding[i].expression.reParse(state)));
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

    reParse(state: State): FunctionDeclaration {
        let valbnd: FunctionValueBinding[] = [];
        for (let i = 0; i < this.functionValueBinding.length; ++i) {
            valbnd.push(this.functionValueBinding[i].reParse(state));
        }
        return new FunctionDeclaration(this.position, this.typeVariableSequence, valbnd);
    }
    prettyPrint(indentation: number, oneLine: boolean): string {
        // TODO
        throw new InternalInterpreterError( -1, 'Not yet implemented.');
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
    reParse(state: State): TypeDeclaration {
        return this;
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
    reParse(state: State): DatatypeDeclaration {
        return this;
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
    reParse(state: State): DatatypeReplication {
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
    reParse(state: State): AbstypeDeclaration {
        return new AbstypeDeclaration(this.position, this.datatypeBinding, this.typeBinding,
            this.declaration.reParse(state));
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
    reParse(state: State): LocalDeclaration {
        let nstate = state.clone();
        return new LocalDeclaration(this.position, this.declaration.reParse(nstate), this.body.reParse(nstate));
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
    reParse(state: State): OpenDeclaration {
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
    reParse(state: State): SequentialDeclaration {
        let decls: Declaration[] = [];
        for (let i = 0; i < this.declarations.length; ++i) {
            decls.push(this.declarations[i].reParse(state));
            let decl = this.declarations[i].simplify();
            decl.checkStaticSemantics(state);
            decl.evaluate(state);
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
    reParse(state: State): InfixDeclaration {
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
    reParse(state: State): InfixRDeclaration {
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
    reParse(state: State): NonfixDeclaration {
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
    reParse(state: State): EmptyDeclaration {
        return this;
    }
    prettyPrint(indentation: number, oneLine: boolean): string {
        return ' ;';
    }
}
