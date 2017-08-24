import { Expression, Tuple, Constant, ValueIdentifier, Wildcard,
         LayeredPattern, FunctionApplication, TypedExpression, Record, List,
         Sequence, RecordSelector, Lambda, Conjunction, LocalDeclarationExpression,
         Disjunction, Conditional, CaseAnalysis, RaiseException,
         HandleException, Match, InfixExpression, PatternExpression, While } from './expressions';
import { Type, RecordType, TypeVariable, TupleType, CustomType, FunctionType } from './types';
import { InternalInterpreterError, IncompleteError, ParserError } from './errors';
import { Token, KeywordToken, IdentifierToken, ConstantToken,
         TypeVariableToken, LongIdentifierToken, IntegerConstantToken,
         AlphanumericIdentifierToken, NumericToken } from './tokens';
import { EmptyDeclaration, Declaration, ValueBinding, ValueDeclaration,
         FunctionValueBinding, FunctionDeclaration, TypeDeclaration, Evaluation,
         DatatypeReplication, DatatypeDeclaration, SequentialDeclaration,
         DatatypeBinding, TypeBinding, AbstypeDeclaration, LocalDeclaration,
         ExceptionBinding, DirectExceptionBinding, ExceptionAlias, NonfixDeclaration,
         ExceptionDeclaration, OpenDeclaration, InfixDeclaration, InfixRDeclaration } from './declarations';
import { FunctorDeclaration, StructureDeclaration, SignatureDeclaration, FunctorBinding,
         StructureBinding, SignatureBinding, StructureExpression, OpaqueConstraint,
         TransparentConstraint, FunctorApplication, StructureIdentifier, TypeRealisation,
         Specification, SignatureIdentifier, SignatureExpression, ValueSpecification,
         TypeSpecification, EqualityTypeSpecification, DatatypeSpecification,
         DatatypeReplicationSpecification, ExceptionSpecification, StructureSpecification,
         IncludeSpecification, EmptySpecification, SequentialSpecification, SharingSpecification,
         Signature } from './modules';
import { State } from './state';

export class Parser {
    private position: number = 0; // position of the next not yet parsed token

    constructor(private tokens: Token[], private state: State, private currentId: number,
                private options: { [name: string]: any }) {
        if (this.state === undefined) {
            throw new InternalInterpreterError(-1, 'What are you, stupid? Hurry up and give me ' +
                'a state already!');
        }
    }

    assertKeywordToken(tok: Token, text: string | undefined = undefined) {
        if (!(tok instanceof KeywordToken)) {
            throw new ParserError('Expected a reserved word, got "' + tok.getText()
                + '" (' + tok.constructor.name + ').' , tok.position);
        }
        if (text !== undefined && tok.text !== text) {
            throw new ParserError('Expected "' + text + '" but got "' + tok.text + '".', tok.position);
        }
    }
    assertVidToken(tok: Token) {
        if (!tok.isVid()) {
            throw new ParserError('Expected an identifier, got \"'
                + tok.getText() + '\" ('
                + tok.constructor.name + ').', tok.position);
        }
    }
    assertIdentifierToken(tok: Token) {
        if (!(tok instanceof IdentifierToken)) {
            throw new ParserError('Expected an identifier, got \"'
                + tok.getText() + '\" ('
                + tok.constructor.name + ').', tok.position);
        }
    }
    assertVidOrLongToken(tok: Token) {
        if (!tok.isVid() && !(tok instanceof LongIdentifierToken)) {
            throw new ParserError('Expected an identifier, got \"'
                + tok.getText() + '\" ('
                + tok.constructor.name + ').', tok.position);
        }
    }
    assertIdentifierOrLongToken(tok: Token) {
        if (!(tok instanceof IdentifierToken)
            && !(tok instanceof LongIdentifierToken)) {
            throw new ParserError('Expected an identifier, got \"'
                + tok.getText() + '\" ('
                + tok.constructor.name + ').', tok.position);
        }
    }
    assertRecordLabelToken(tok: Token) {
        if (!tok.isValidRecordLabel()) {
            throw new ParserError('Expected a record label \"'
                + tok.getText() + '\" ('
                + tok.constructor.name + ').', tok.position);
        }
    }
    checkVidOrLongToken(tok: Token) {
        return (tok.isVid() || (tok instanceof LongIdentifierToken));
    }
    checkIdentifierOrLongToken(tok: Token) {
        return ((tok instanceof IdentifierToken)
            || (tok instanceof LongIdentifierToken));
    }
    checkKeywordToken(tok: Token, text: string | undefined = undefined): boolean {
        if (!(tok instanceof KeywordToken)) {
            return false;
        }
        if (text !== undefined && tok.text !== text) {
            return false;
        }
        return true;
    }

    parseOpIdentifierToken(allowLong: boolean = false): IdentifierToken | LongIdentifierToken {
        let curTok = this.currentToken();
        let opPrefixed = this.checkKeywordToken(curTok, 'op');
        if (opPrefixed) {
            ++this.position;
        }
        if (allowLong) {
            this.assertIdentifierOrLongToken(this.currentToken());
        } else {
            this.assertIdentifierToken(this.currentToken());
        }
        let name = this.currentToken();
        (<IdentifierToken|LongIdentifierToken> name).opPrefixed = opPrefixed;
        ++this.position;
        return <IdentifierToken|LongIdentifierToken> name;
    }

    parseAtomicExpression(): Expression {
        /*
         * atexp ::= scon                           Constant(position, token)
         *              ConstantToken
         *           [op] longvid                   ValueIdentifier(position, name:Token)
         *              [KeywordToken] IdentifierToken
         *           { [exprow] }
         *           #lab                           RecordSelector(pos, label:Token)
         *              KeywordToken IdentifierToken
         *           ()                             Tuple(pos, [])
         *              KeywordToken KeywordToken
         *           (exp1, …, expn)                Tuple(pos, exps: (Pattern|Exp)[])
         *              KeywordToken exp [KeywordToken exp]* KeywordToken
         *           [exp1, …, expn]                List(pos, exps: (Pattern|Exp)[])
         *              KeywordToken exp [KeywordToken exp]* KeywordToken
         *           (exp1; …; expn)                Sequence(pos, exps:Exp[])
         *              KeywordToken exp [KeywordToken exp]* KeywordToken
         *           let dec in exp1, …, expn end   LocalDeclarationExpression(pos, decl:Decl, exp)
         *              KeywordToken dec KeywordToken exp [KeywordToken exp]* KeywordToken
         *           ( exp )                        Expression
         *              KeywordToken exp KeywordToken
         */
        let curTok = this.currentToken();
        if (this.checkKeywordToken(curTok, 'op')) {
            ++this.position;
            let nextCurTok = this.currentToken();
            this.assertVidOrLongToken(nextCurTok);
            (<IdentifierToken|LongIdentifierToken> nextCurTok).opPrefixed = true;
            ++this.position;
            return new ValueIdentifier(curTok.position, nextCurTok);
        }
        if (this.checkKeywordToken(curTok, '{')) {
            // Record expression
            ++this.position;
            return this.parseExpressionRow();
        }
        if (this.checkKeywordToken(curTok, '(')) {
            // Tuple expression
            ++this.position;
            if (this.checkKeywordToken(this.currentToken(), ')')) {
                ++this.position;
                return new Tuple(curTok.position, []);
            }
            let results: Expression[] = [this.parseExpression()];
            let isSequence = false;
            let isTuple = false;
            while (true) {
                let nextCurTok = this.currentToken();
                if (this.checkKeywordToken(nextCurTok, ',') && !isSequence) {
                    ++this.position;
                    isTuple = true;
                    results.push(this.parseExpression());
                    continue;
                } else if (this.checkKeywordToken(nextCurTok, ';') && !isTuple) {
                    ++this.position;
                    isSequence = true;

                    if (!this.options.allowSuccessorML
                        || !this.checkKeywordToken(this.currentToken(), ')')) {
                        results.push(this.parseExpression());
                        continue;
                    }
                }
                if (this.checkKeywordToken(nextCurTok, ')')) {
                    ++this.position;
                    if (results.length === 1) {
                        return results[0];
                    } else {
                        if (isTuple) {
                            return new Tuple(curTok.position, results);
                        } else if (isSequence) {
                            return new Sequence(curTok.position, results);
                        }
                    }
                } else {
                    throw new ParserError('Expected ",", ";" or ")" but got \"' +
                        nextCurTok.getText() + '\".', nextCurTok.position);
                }
                results.push(this.parseExpression());
            }
        }
        if (this.checkKeywordToken(curTok, '[')) {
            // List expression
            ++this.position;
            if (this.checkKeywordToken(this.currentToken(), ']')) {
                ++this.position;
                return new List(curTok.position, []);
            }
            let results: Expression[] = [this.parseExpression()];
            while (true) {
                let nextCurTok = this.currentToken();
                if (this.checkKeywordToken(nextCurTok, ',')) {
                    ++this.position;
                } else if (this.checkKeywordToken(nextCurTok, ']')) {
                    ++this.position;
                    return new List(curTok.position, results);
                } else {
                    throw new ParserError('Expected "," or "]" but found "' +
                        nextCurTok.getText() + '".', nextCurTok.position);
                }
                results.push(this.parseExpression());
            }
        }
        if (this.checkKeywordToken(curTok, '#')) {
            ++this.position;
            let nextTok = this.currentToken();
            this.assertRecordLabelToken(nextTok);
            ++this.position;
            return new RecordSelector(curTok.position, <NumericToken | IdentifierToken> nextTok);
        }
        if (this.checkKeywordToken(curTok, 'let')) {
            ++this.position;

            let nstate = this.state;
            this.state = this.state.getNestedState(this.state.id);

            let dec = this.parseDeclaration();
            this.assertKeywordToken(this.currentToken(), 'in');
            ++this.position;
            let res: Expression[] = [this.parseExpression()];
            let newTok = this.currentToken();
            let tpos = newTok.position;
            while (this.checkKeywordToken(newTok, ';')) {
                ++this.position;
                res.push(this.parseExpression());
                newTok = this.currentToken();
            }
            this.assertKeywordToken(newTok, 'end');
            ++this.position;

            this.state = nstate;

            if (res.length >= 2) {
                return new LocalDeclarationExpression(curTok.position, dec,
                    new Sequence(tpos, res));
            } else {
                return new LocalDeclarationExpression(curTok.position, dec, res[0]);
            }
        } else if (curTok instanceof ConstantToken) {
            ++this.position;
            return new Constant(curTok.position, curTok);
        } else if (curTok.isVid() || curTok instanceof LongIdentifierToken) {
            ++this.position;
            if (this.state.getInfixStatus(curTok) !== undefined
                && this.state.getInfixStatus(curTok).infix) {
                throw new ParserError('Infix operator "' + curTok.getText()
                    + '" appeared in non-infix context without "op".', curTok.position);
            }
            return new ValueIdentifier(curTok.position, curTok);
        }
        throw new ParserError('Expected atomic expression, "' +
            curTok.getText() + '" found.', curTok.position);
    }

    parseExpressionRow(): Expression {
        /*
         * Parses Record expression, munches closing }
         * exprow ::= lab = exp [, exprow]  Record(position, complete: boolean,
         *                                         entries: [string, (Pattern|Expression)][])
         *              IdentifierToken KeywordToken exp [KeywordToken exp]*
         */
        let curTok = this.currentToken();
        let res: [string, Expression][] = [];
        let firstIt = true;
        while (true) {
            let newTok = this.currentToken();
            if (this.checkKeywordToken(newTok, '}')) {
                ++this.position;
                return new Record(curTok.position, true, res);
            }
            if (!firstIt && this.checkKeywordToken(newTok, ',')) {
                ++this.position;
                continue;
            }
            firstIt = false;

            if (newTok.isValidRecordLabel()) {
                ++this.position;
                let nextTok = this.currentToken();
                this.assertKeywordToken(nextTok, '=');

                ++this.position;
                res.push([newTok.getText(), this.parseExpression()]);
                continue;
            }
            throw new ParserError('Expected "}", or identifier, got "'
                + newTok.getText() + '".', newTok.position);
        }
    }

    parseApplicationExpression(): Expression {
        /* appexp ::= atexp
         *            appexp atexp      FunctionApplication(position, func:exp, arg:exp)
         *              exp exp
         */
        let curTok = this.currentToken();
        let res = this.parseAtomicExpression();
        while (true) {
            let oldPos = this.position;
            let nextTok = this.currentToken();
            if (this.checkVidOrLongToken(nextTok)
                && this.state.getInfixStatus(nextTok) !== undefined
                && this.state.getInfixStatus(nextTok).infix) {
                break;
            }

            try {
                let newExp = this.parseAtomicExpression();
                res = new FunctionApplication(curTok.position, res, newExp);
            } catch (e) {
                this.position = oldPos;
                break;
            }
        }
        return res;
    }

    parseInfixExpression(): Expression {
        /*
         * infexp ::= appexp
         *            infexp1 vid infexp2   FunctionApplication(pos, ValueIdentifier, (exp1,exp2))
         *              exp IdentifierToken exp
         */
        let exps: Expression[] = [];
        let ops: [IdentifierToken, number][] = [];
        let cnt: number = 0;

        while (true) {
            exps.push(this.parseApplicationExpression());

            let curTok = this.currentToken();
            if (this.checkVidOrLongToken(curTok)
                && this.state.getInfixStatus(curTok) !== undefined
                && this.state.getInfixStatus(curTok).infix) {
                // We don't know anything about identifiers yet, so just assume they are infix
                ++this.position;
                ops.push([<IdentifierToken> curTok, cnt++]);
            } else {
                break;
            }
        }

        if (cnt === 0) {
            return exps[0];
        }

        return new InfixExpression(exps, ops).reParse(this.state);
    }

    parseAppendedExpression(): Expression {
        /*
         * exp ::= infexp
         *         exp : ty                         TypedExpression(position, exp, type)
         *          exp KeywordToken type
         *         exp handle match                 HandleException(position, exp, match)
         *          exp KeywordToken exp
         *         raise exp                        RaiseException(position, exp)
         *          KeywordToken exp
         *         if exp1 then exp2 else exp3      Conditional(pos, exp1, exp2, exp3)
         *          KeywordToken exp KeywordToken exp KeywordToken exp
         *         case exp of match                CaseAnalysis(pos, exp, match)
         *          KeywordToken exp KeywordToken match
         *         while exp do exp                 While(pos, exp, exp)
         *          KeywordToken exp KeywordToken exp
         *         fn match                         Lambda(position, match)
         *          KeywordToken match
         */
        let curTok = this.currentToken();

        if (this.checkKeywordToken(curTok, 'raise')) {
            ++this.position;
            return new RaiseException(curTok.position, this.parseExpression());
        } else if (this.checkKeywordToken(curTok, 'if')) {
            ++this.position;
            let cond = this.parseExpression();
            this.assertKeywordToken(this.currentToken(), 'then');
            ++this.position;
            let cons = this.parseExpression();
            if (this.options.allowSuccessorML
                && !this.checkKeywordToken(this.currentToken(), 'else')) {
                return new Conditional(curTok.position, cond, cons, new Tuple(-1, []));
            } else {
                this.assertKeywordToken(this.currentToken(), 'else');
                ++this.position;
                return new Conditional(curTok.position, cond, cons, this.parseExpression());
            }
        } else if (this.checkKeywordToken(curTok, 'case')) {
            ++this.position;
            let cond = this.parseExpression();
            this.assertKeywordToken(this.currentToken(), 'of');
            ++this.position;
            return new CaseAnalysis(curTok.position, cond, this.parseMatch());
        } else if (this.checkKeywordToken(curTok, 'while')) {
            ++this.position;
            let cond = this.parseExpression();
            this.assertKeywordToken(this.currentToken(), 'do');
            ++this.position;
            return new While(curTok.position, cond, this.parseExpression());
        } else if (this.checkKeywordToken(curTok, 'fn')) {
            ++this.position;
            return new Lambda(curTok.position, this.parseMatch());
        }

        let exp = this.parseInfixExpression();
        let nextTok = this.currentToken();
        while (this.checkKeywordToken(nextTok, ':')) {
            ++this.position;
            exp = new TypedExpression(curTok.position, exp, this.parseType());
            nextTok = this.currentToken();
        }
        return exp;
    }

    parseExpression(): Expression {
        /*
         * exp ::= exp1 andalso exp2                Conjunction(pos, exp1, exp2)
         *          exp KeywordToken exp
         *         exp1 orelse exp2                 Disjunction(pos, exp1, exp2)
         *          exp KeywordToken exp
         */
        let exp = this.parseAppendedExpression();
        let nextTok = this.currentToken();
        let curTok = nextTok;
        if (this.checkKeywordToken(nextTok, 'andalso')
            || this.checkKeywordToken(nextTok, 'orelse') ) {
            let exps: [Expression, number[]][] = [[exp, [0]]];
            let ops: [number, number][] = [];
            let cnt = 0;

            while (true) {
                if (this.checkKeywordToken(nextTok, 'orelse')) {
                    ops.push([1, cnt++]);
                    ++this.position;
                } else if (this.checkKeywordToken(nextTok, 'andalso')) {
                    ops.push([0, cnt++]);
                    ++this.position;
                } else {
                    break;
                }
                exps.push([this.parseAppendedExpression(), [cnt]]);
                nextTok = this.currentToken();
            }

            ops.sort();

            for (let i = 0; i < ops.length; ++i) {
                // Using pointers or something similar could speed up this stuff here
                // and achieve linear running time
                let left = exps[ops[i][1]][0];
                let right = exps[ops[i][1] + 1][0];
                let res: Expression;
                if (ops[i][0] === 0) {
                    res = new Conjunction(left.position, left, right);
                } else {
                    res = new Disjunction(left.position, left, right);
                }

                let npos = exps[ops[i][1]][1];
                for (let j of exps[ops[i][1] + 1][1]) {
                    npos.push(j);
                }
                for (let j of npos) {
                    exps[j] = [res, npos];
                }
            }
            exp = exps[0][0];
        }
        nextTok = this.currentToken();
        while (this.checkKeywordToken(nextTok, 'handle')) {
            ++this.position;
            exp = new HandleException(curTok.position, exp, this.parseMatch());
            nextTok = this.currentToken();
        }

        return exp;
    }


    parseSimpleStructureExpression(): Expression {
        /*
         * strexp ::= struct strdec end         StructureExpression(pos, dec)
         *            longstrid                 StructureIdentifier(pos, token)
         *            funid ( strexp )          FunctorApplication(pos, funid, exp)
         *            let strdec in strexp end  LocalDeclarationExpression(pos, dec, exp)
         */
        let curTok = this.currentToken();

        if (this.checkKeywordToken(curTok, 'struct')) {
            ++this.position;
            let dec = this.parseDeclaration(false, true);
            this.assertKeywordToken(this.currentToken(), 'end');
            ++this.position;
            return new StructureExpression(curTok.position, dec);
        } else if (this.checkKeywordToken(curTok, 'let')) {
            ++this.position;
            let dec = this.parseDeclaration(false, true);
            this.assertKeywordToken(this.currentToken(), 'in');
            ++this.position;
            let exp = this.parseStructureExpression();
            this.assertKeywordToken(this.currentToken(), 'end');
            ++this.position;
            return new LocalDeclarationExpression(curTok.position, dec, exp);
        }

        if (curTok instanceof IdentifierToken) {
            ++this.position;
            if (this.checkKeywordToken(this.currentToken(), '(')) {
                ++this.position;
                let exp = this.parseStructureExpression();
                this.assertKeywordToken(this.currentToken(), ')');
                ++this.position;
                return new FunctorApplication(curTok.position, <IdentifierToken> curTok, exp);
            } else {
                --this.position;
            }
        }

        if (this.checkIdentifierOrLongToken(curTok)) {
            ++this.position;
            return new StructureIdentifier(curTok.position, curTok);
        }

        throw new ParserError('Expected a simple structure expression.', curTok.position);
    }

    parseStructureExpression(): Expression {
        /*
         * strexp ::= strexp : sigexp           TransparentConstraint(pos, strexp, sigexp)
         *            strexp :> sigexp          OpaqueConstraint(pos, strexp, sigexp)
         */

        let curTok = this.currentToken();

        let exp = this.parseSimpleStructureExpression();

        while (true) {
            if (this.checkKeywordToken(this.currentToken(), ':')) {
                ++this.position;
                exp = new TransparentConstraint(curTok.position, exp, this.parseSignatureExpression());
            } else if (this.checkKeywordToken(this.currentToken(), ':>')) {
                ++this.position;
                exp = new OpaqueConstraint(curTok.position, exp, this.parseSignatureExpression());
            } else {
                break;
            }
        }
        return exp;
    }

    parseSimpleSignatureExpression(): Expression & Signature {
        /*
         * sigexp ::= sig spec end              SignatureExpression
         *            sigid                     SignatureIdentifier
         */
        let curTok = this.currentToken();

        if (this.checkKeywordToken(curTok, 'sig')) {
            ++this.position;
            let spec = this.parseSpecification();
            this.assertKeywordToken(this.currentToken(), 'end');
            ++this.position;
            return new SignatureExpression(curTok.position, spec);
        }

        if (curTok instanceof IdentifierToken) {
            ++this.position;
            return new SignatureIdentifier(curTok.position, <IdentifierToken> curTok);
        }

        throw new ParserError('Expected a simple signature expression.', curTok.position);
    }

    parseSignatureExpression(): Expression & Signature {
        /*
         * sigexp ::= sigexp where type tyvarseq longtycon = ty TypeRealisation(pos, exp, tyvar, ty)
         */
        let curTok = this.currentToken();

        let sig = this.parseSimpleSignatureExpression();

        while (this.checkKeywordToken(this.currentToken(), 'where')) {
            ++this.position;
            this.assertKeywordToken(this.currentToken(), 'type');
            ++this.position;
            let tyvarseq = <TypeVariable[]> this.parseTypeVarSequence();
            this.assertIdentifierOrLongToken(this.currentToken());
            let token = this.currentToken();
            ++this.position;
            this.assertKeywordToken(this.currentToken(), '=');
            ++this.position;
            sig = new TypeRealisation(curTok.position, sig, tyvarseq, token, this.parseType());
        }
        return sig;
    }

    parseSimpleSpecification(): Specification {
        /*
         * spec ::= val vid : ty <and valdesc>          ValueSpecification(pos, [Token, Type][])
         *          type tyvarseq tycon <and tydesc>    TypeSpecification(pos, [tyvar, tycon][])
         *          eqtype tyvarseq tycon <and tydesc>  EqualityTypeSpecification(ps, [tyva, tycn][])
         *          datatype datdesc
         *          datatype tycon = datatype longtycon
         *          exception exdesc
         *          structure strdesc
         *          include sigexp
         *
         */
        let curTok = this.currentToken();

        if (this.checkKeywordToken(curTok, 'val')) {
            ++this.position;
            let res: [IdentifierToken, Type][] = [];

            while (true) {
                this.assertIdentifierOrLongToken(this.currentToken());
                let tkn = <IdentifierToken> this.currentToken();
                ++this.position;
                this.assertKeywordToken(this.currentToken(), ':');
                ++this.position;

                res.push([tkn, this.parseType()]);

                if (this.checkKeywordToken(this.currentToken(), 'and')) {
                    ++this.position;
                    continue;
                }
                break;
            }
            return new ValueSpecification(curTok.position, res);

        } else if (this.checkKeywordToken(curTok, 'type')) {
            ++this.position;
            let res: [TypeVariable[], IdentifierToken][] = [];
            while (true) {
                let tyvar = <TypeVariable[]> this.parseTypeVarSequence();
                this.assertIdentifierToken(this.currentToken());
                res.push([tyvar, <IdentifierToken> this.currentToken()]);
                ++this.position;
                if (this.checkKeywordToken(this.currentToken(), 'and')) {
                    ++this.position;
                    continue;
                }
                break;
            }
            return new TypeSpecification(curTok.position, res);

        } else if (this.checkKeywordToken(curTok, 'eqtype')) {
            ++this.position;
            let res: [TypeVariable[], IdentifierToken][] = [];
            while (true) {
                let tyvar = <TypeVariable[]> this.parseTypeVarSequence();
                this.assertIdentifierToken(this.currentToken());
                res.push([tyvar, <IdentifierToken> this.currentToken()]);
                ++this.position;
                if (this.checkKeywordToken(this.currentToken(), 'and')) {
                    ++this.position;
                    continue;
                }
                break;
            }
            return new EqualityTypeSpecification(curTok.position, res);

        } else if (this.checkKeywordToken(curTok, 'datatype')) {
            ++this.position;

            if (this.position + 2 < this.tokens.length &&
                this.checkKeywordToken(this.tokens[this.position + 2], 'datatype')) {
                this.assertIdentifierToken(this.currentToken());
                let tk = <IdentifierToken> this.currentToken();
                ++this.position;
                this.assertKeywordToken(this.currentToken(), '=');
                ++this.position;
                this.assertKeywordToken(this.currentToken(), 'datatype');
                ++this.position;
                this.assertIdentifierOrLongToken(this.currentToken());
                let on = this.currentToken();
                ++this.position;
                return new DatatypeReplicationSpecification(curTok.position, tk, on);
            }

            // Yeah I know that this stuff is ugly
            let res: [TypeVariable[], IdentifierToken, [IdentifierToken, Type|undefined][]][] = [];

            while (true) {
                let tyvar = <TypeVariable[]> this.parseTypeVarSequence();
                this.assertIdentifierToken(this.currentToken());
                let tk = <IdentifierToken> this.currentToken();
                ++this.position;
                this.assertKeywordToken(this.currentToken(), '=');
                ++this.position;

                let cons: [IdentifierToken, Type|undefined][] = [];
                while (true) {
                    this.assertIdentifierToken(this.currentToken());
                    let cn = <IdentifierToken> this.currentToken();
                    ++this.position;
                    let tp: Type | undefined = undefined;

                    if (this.checkKeywordToken(this.currentToken(), 'of')) {
                        ++this.position;
                        tp = this.parseType();
                    }
                    cons.push([cn, tp]);

                    if (this.checkKeywordToken(this.currentToken(), '|')) {
                        ++this.position;
                        continue;
                    }
                    break;
                }

                res.push([tyvar, tk, cons]);

                if (this.checkKeywordToken(this.currentToken(), 'and')) {
                    ++this.position;
                    continue;
                }
                break;
            }

            return new DatatypeSpecification(curTok.position, res);
        } else if (this.checkKeywordToken(curTok, 'exception')) {
            ++this.position;
            let res: [IdentifierToken, Type|undefined][] = [];

            while (true) {
                this.assertIdentifierToken(this.currentToken());
                let tk = <IdentifierToken> this.currentToken();
                ++this.position;

                let tp: Type | undefined = undefined;

                if (this.checkKeywordToken(this.currentToken(), 'of')) {
                    ++this.position;
                    tp = this.parseType();
                }

                res.push([tk, tp]);

                if (this.checkKeywordToken(this.currentToken(), 'and')) {
                    ++this.position;
                    continue;
                }
                break;
            }
            return new ExceptionSpecification(curTok.position, res);

        } else if (this.checkKeywordToken(curTok, 'structure')) {
            ++this.position;
            let res: [IdentifierToken, Expression & Signature][] = [];

            while (true) {
                this.assertIdentifierToken(this.currentToken());
                let tk = <IdentifierToken> this.currentToken();
                ++this.position;
                this.assertKeywordToken(this.currentToken(), ':');
                ++this.position;

                res.push([tk, this.parseSignatureExpression()]);

                if (this.checkKeywordToken(this.currentToken(), 'and')) {
                    ++this.position;
                    continue;
                }
                break;
            }

            return new StructureSpecification(curTok.position, res);
        } else if (this.checkKeywordToken(curTok, 'include')) {
            ++this.position;
            return new IncludeSpecification(curTok.position, this.parseSignatureExpression());
        }

        return new EmptySpecification(curTok.position);
    }

    parseSequentialSpecification(): Specification {
        /*
         * spec ::= spec <;> spec       SequentialSpecification(pos, Spec[])
         */
        let curTok = this.currentToken();
        let res: Specification[] = [];

        while (true) {
            let cur = this.parseSimpleSpecification();

            if (cur instanceof EmptySpecification) {
                break;
            }

            res.push(cur);

            if (this.checkKeywordToken(this.currentToken(), ';')) {
                ++this.position;
            }
        }
        return new SequentialSpecification(curTok.position, res);
    }

    parseSpecification(): Specification {
        /*
         * spec ::= spec sharing type longtycon = ... = longtycon
         */
        let curTok = this.currentToken();
        let spec = this.parseSequentialSpecification();

        while (this.checkKeywordToken(this.currentToken(), 'sharing')) {
            ++this.position;
            this.assertKeywordToken(this.currentToken(), 'type');
            ++this.position;
            this.assertIdentifierOrLongToken(this.currentToken());
            let tkn: Token[] = [this.currentToken()];
            ++this.position;
            while (this.checkKeywordToken(this.currentToken(), '=')) {
                ++this.position;
                this.assertIdentifierOrLongToken(this.currentToken());
                tkn.push(this.currentToken());
                ++this.position;
            }

            if (tkn.length < 2) {
                throw new ParserError('A "sharing" expression requires at least 2 type names.',
                    curTok.position);
            }
            spec = new SharingSpecification(curTok.position, spec, tkn);
        }

        return spec;
    }

    parseMatch(): Match {
        /*
         * match ::= pat => exp [| match]       Match(pos, [Pattern, Expression][])
         */
        let curTok = this.currentToken();
        if (this.options.allowSuccessorML && this.checkKeywordToken(this.currentToken(), '|')) {
            ++this.position;
        }
        let res: [PatternExpression, Expression][] = [];
        while (true) {
            let pat = this.parsePattern();
            this.assertKeywordToken(this.currentToken(), '=>');
            ++this.position;
            let exp = this.parseExpression();
            res.push([pat, exp]);
            if (!this.checkKeywordToken(this.currentToken(), '|')) {
                break;
            }
            ++this.position;
        }
        return new Match(curTok.position, res);
    }

    parsePatternRow(): Record {
        /*
         * Parses Record patterns, munches closing }
         * patrow ::= ...
         *              KeywordToken
         *            lab = pat [, patrow]
         *              IdentifierToken KeywordToken pat
         *            vid [:ty] [as pat] [, patrow]
         *              IdentifierToken [KeywordToken type] [KeywordToken pat]
         */
        let curTok = this.currentToken();
        let res: [string, PatternExpression][] = [];
        let firstIt = true;
        let complete = true;
        while (true) {
            let newTok = this.currentToken();
            if (this.checkKeywordToken(newTok, '}')) {
                ++this.position;
                return new Record(curTok.position, complete, res);
            }
            if (!complete) {
                throw new ParserError('Record wildcard must appear as last element of the record.', newTok.position);
            }
            if (!firstIt && this.checkKeywordToken(newTok, ',')) {
                ++this.position;
                continue;
            }
            firstIt = false;

            if (this.checkKeywordToken(newTok, '...')) {
                // A wildcard may only occur as the last entry of a record.
                complete = false;
                ++this.position;
                continue;
            }
            if (newTok.isValidRecordLabel()) {
                ++this.position;
                let nextTok = this.currentToken();
                if (!(nextTok instanceof KeywordToken)) {
                    throw new ParserError('Expected ":", "as", ",", or "=", got ' +
                        nextTok.getText() + '".', nextTok.position);
                }

                if (nextTok.text === '=') {
                    // lab = pat
                    ++this.position;
                    res.push([newTok.getText(), this.parsePattern()]);
                    continue;
                }

                let tp: Type|undefined = undefined;

                if (newTok instanceof NumericToken) {
                    throw new ParserError('You cannot assign to "' + newTok.getText() + '".',
                        newTok.position);
                }

                let pat: PatternExpression = new ValueIdentifier(newTok.position, newTok);
                if (nextTok.text === ':') {
                    ++this.position;
                    tp = this.parseType();
                    nextTok = this.currentToken();
                }
                if (nextTok.text === 'as') {
                    ++this.position;
                    pat = new LayeredPattern(pat.position, <IdentifierToken> (<ValueIdentifier> pat).name,
                        tp, this.parsePattern());
                    nextTok = this.currentToken();
                } else if (tp !== undefined) {
                    pat = new TypedExpression(pat.position, pat, tp);
                }
                res.push([newTok.getText(), pat]);
                continue;
            }
            throw new ParserError('Expected "}", "...", or identifier.', newTok.position);
        }
    }

    parseAtomicPattern(): PatternExpression {
        /*
         * atpat ::= _                      Wildcard(pos)
         *           scon                   Constant(pos, token)
         *           [op] longvid           ValueIdentifier(pos, name:Taken)
         *           [op] vid [:ty] as pat  LayeredPattern(pos, IdentifierToken, type, pattern)
         *           { [patrow] }
         *           ()                     Tuple(pos, [])
         *           ( pat1, …, patn )      Tuple(pos, (Pattern|Exp)[])
         *           [ pat1, …, patn ]      List(pos, (Pattern|Exp)[])
         *           ( pat )
         */

        if (this.position >= this.tokens.length) {
            throw new ParserError('Unexpected end of token stream', -1);
        }
        let curTok = this.currentToken();
        if (this.checkKeywordToken(curTok, 'op')) {
            ++this.position;
            let nextCurTok = this.currentToken();
            this.assertIdentifierOrLongToken(nextCurTok);
            (<IdentifierToken|LongIdentifierToken> nextCurTok).opPrefixed = true;
            ++this.position;

            let newOldPos = this.position;
            try {
                if (!(nextCurTok instanceof LongIdentifierToken)) {
                    let newTok = this.currentToken();
                    let tp: Type | undefined;
                    if (this.checkKeywordToken(newTok, ':')) {
                        ++this.position;
                        tp = this.parseType();
                        newTok = this.currentToken();
                    }
                    this.assertKeywordToken(newTok, 'as');
                    ++this.position;
                    return new LayeredPattern(curTok.position, <IdentifierToken> nextCurTok, tp, this.parsePattern());
                }
            } catch (f) {
                this.position = newOldPos;
            }

            return new ValueIdentifier(curTok.position, nextCurTok);
        }
        if (this.checkKeywordToken(curTok, '_')) {
            // Wildcard pattern
            ++this.position;
            return new Wildcard(curTok.position);
        }
        if (this.checkKeywordToken(curTok, '{')) {
            // Record pattern
            ++this.position;
            let result = this.parsePatternRow();
            return result;
        }
        if (this.checkKeywordToken(curTok, '(')) {
            // Tuple pattern
            ++this.position;
            if (this.checkKeywordToken(this.currentToken(), ')')) {
                ++this.position;
                return new Tuple(curTok.position, []);
            }
            let results: PatternExpression[] = [this.parsePattern()];
            while (true) {
                let nextCurTok = this.currentToken();
                if (this.checkKeywordToken(nextCurTok, ',')) {
                    ++this.position;
                } else if (this.checkKeywordToken(nextCurTok, ')')) {
                    ++this.position;
                    if (results.length === 1) {
                        return results[0];
                    } else {
                        return new Tuple(curTok.position, results);
                    }
                } else {
                    throw new ParserError('Expected "," or ")", but got "'
                        + nextCurTok.getText() + '".', nextCurTok.position);
                }
                results.push(this.parsePattern());
            }
        }
        if (this.checkKeywordToken(curTok, '[')) {
            // List pattern
            ++this.position;
            if (this.checkKeywordToken(this.currentToken(), ']')) {
                ++this.position;
                return new List(curTok.position, []);
            }
            let results: PatternExpression[] = [this.parsePattern()];
            while (true) {
                let nextCurTok = this.currentToken();
                if (this.checkKeywordToken(nextCurTok, ',')) {
                    ++this.position;
                } else if (this.checkKeywordToken(nextCurTok, ']')) {
                    ++this.position;
                    return new List(curTok.position, results);
                } else {
                    throw new ParserError('Expected "," or "]" but found "' +
                        nextCurTok.getText() + '".', nextCurTok.position);
                }
                results.push(this.parsePattern());
            }
        } else if (curTok instanceof ConstantToken) {
            ++this.position;
            return new Constant(curTok.position, curTok);
        } else if (curTok instanceof IdentifierToken
            || curTok instanceof LongIdentifierToken) {
            ++this.position;

            let newOldPos = this.position;
            try {
                if (!(curTok instanceof LongIdentifierToken)) {
                    let newTok = this.currentToken();
                    let tp: Type | undefined;
                    if (this.checkKeywordToken(newTok, ':')) {
                        ++this.position;
                        tp = this.parseType();
                        newTok = this.currentToken();
                    }
                    this.assertKeywordToken(newTok, 'as');
                    ++this.position;
                    return new LayeredPattern(curTok.position, <IdentifierToken> curTok, tp, this.parsePattern());
                }
            } catch (f) {
                this.position = newOldPos;
            }

            return new ValueIdentifier(curTok.position, curTok);
        }
        throw new ParserError('Expected atomic pattern but got "'
            + curTok.getText() + '".', curTok.position);
    }

    parseApplicationPattern(): PatternExpression {
        /*
         *  pat ::= atpat
         *          [op] longvid atpat      FunctionApplication(pos, func, argument)
         */
        let curTok = this.currentToken();
        let res = this.parseAtomicPattern();
        while (true) {
            let oldPos = this.position;
            let nextTok = this.currentToken();
            if (this.checkVidOrLongToken(nextTok)
                && this.state.getInfixStatus(nextTok) !== undefined
                && this.state.getInfixStatus(nextTok).infix) {
                break;
            }

            try {
                let newExp = this.parseAtomicPattern();
                res = new FunctionApplication(curTok.position, res, newExp);
            } catch (e) {
                this.position = oldPos;
                break;
            }
        }
        return res;


    }

    parseInfixPattern(): PatternExpression {
        /*
         * pat ::= pat1 vid pat2            FunctionApplication(pos, vid, (pat1, pat2))
         */
        let pats: PatternExpression[] = [];
        let ops: [IdentifierToken, number][] = [];
        let cnt: number = 0;

        while (true) {
            pats.push(this.parseApplicationPattern());

            let curTok = this.currentToken();
            if (this.checkIdentifierOrLongToken(curTok)
                && this.state.getInfixStatus(curTok) !== undefined
                && this.state.getInfixStatus(curTok).infix) {
                ++this.position;
                ops.push([<IdentifierToken> curTok, cnt++]);
            } else {
                break;
            }
        }
        if (cnt === 0) {
            return pats[0];
        }
        return new InfixExpression(pats, ops).reParse(this.state);
    }

    parsePattern(): PatternExpression {
        /*
         *          pat : ty                TypedExpression(pos, exp, type)
         */

        let curTok = this.currentToken();
        let pat = this.parseInfixPattern();

        while (this.checkKeywordToken(this.currentToken(), ':')) {
            ++this.position;
            pat = new TypedExpression(curTok.position, pat, this.parseType());
        }
        return pat;
    }

    parseTypeRow(): RecordType {
        /*
         * Parses Record type, munches closing }
         * tyrow ::= lab : ty [, tyrow]     Record(comp:boolean, entries: [string, Type])
         */
        let firstTok = this.currentToken();
        let elements = new Map<string, Type>();
        let firstIt = true;
        while (true) {
            let curTok = this.currentToken();
            if (this.checkKeywordToken(curTok, '}')) {
                ++this.position;
                return new RecordType(elements, true, firstTok.position);
            }
            if (!firstIt && this.checkKeywordToken(curTok, ',')) {
                ++this.position;
                continue;
            }
            firstIt = false;

            if (curTok.isValidRecordLabel()) {
                ++this.position;
                let nextTok = this.currentToken();
                if (!(nextTok instanceof KeywordToken)) {
                    throw new ParserError('Expected ":".', nextTok.position);
                }

                if (nextTok.text === ':') {
                    // lab: type
                    ++this.position;
                    if (elements.has(curTok.getText())) {
                        throw new ParserError('Duplicate record label "' + curTok.getText()
                            + '".', curTok.position);
                    }
                    elements.set(curTok.getText(), this.parseType());
                    continue;
                }
                throw new ParserError('Expected ":".', nextTok.position);
            }
            throw new ParserError('Expected "}", or an identifier, got "' +
                curTok.getText() + '".', curTok.position);
        }
    }

    parseSimpleType(): Type {
        /*
         * ty ::= tyvar                     TypeVariable(name:string)
         *        longtycon                 CustomType
         *        (ty1,..., tyn) longtycon  CustomType
         *        { [tyrow] }
         *        ( ty )
         */
        let curTok = this.currentToken();

        if (curTok instanceof TypeVariableToken) {
            ++this.position;
            return new TypeVariable(curTok.getText(), curTok.position);
        }

        if (this.checkIdentifierOrLongToken(curTok)) {
            ++this.position;
            return new CustomType(curTok.getText(), [], curTok.position);
        }

        if (this.checkKeywordToken(curTok, '{')) {
            ++this.position;
            return this.parseTypeRow();
        }
        if (this.checkKeywordToken(curTok, '(')) {
            ++this.position;
            if (this.checkKeywordToken(this.currentToken(), ')')) {
                throw new ParserError('Use "{}" or "unit" to denote the unit type.',
                    this.currentToken().position);
            }
            let res = [this.parseType()];
            while (true) {
                let nextTok = this.currentToken();
                if (this.checkKeywordToken(nextTok, ',')) {
                    ++this.position;
                    res.push(this.parseType());
                    continue;
                }
                if (this.checkKeywordToken(nextTok, ')')) {
                    ++this.position;
                    if (res.length === 1) {
                        return res[0];
                    }
                    this.assertIdentifierOrLongToken(this.currentToken());
                    let name = this.currentToken();
                    ++this.position;
                    return new CustomType(name.getText(), res, curTok.position);
                }
                throw new ParserError('Expected "," or ")", got "' +
                    nextTok.getText() + '".', nextTok.position);
            }
        }

        throw new ParserError('Expected either "(" or "{" got \"'
            + curTok.getText() + '\".', curTok.position);
    }

    parseType(): Type {
        /*
         * ty ::= ty1 -> ty2        Function(param:Type, return:Type)
         */
        let curTy = this.parseTupleType();
        let curTok = this.currentToken();
        if (!this.checkKeywordToken(curTok, '->')) {
            return curTy;
        }
        ++this.position;
        let tgTy = this.parseType();
        return new FunctionType(curTy, tgTy, curTok.position);
    }

    parseTupleType(): Type {
        /*
         * ty ::= ty1 * … * tyn     TupleType(types:Type[])
         */
        let curTy = [this.parseCustomType()];
        let curTok = this.currentToken();
        let pos = curTok.position;
        while (this.checkKeywordToken(this.currentToken(), '*')) {
            ++this.position;
            curTy.push(this.parseCustomType());
        }
        if (curTy.length === 1) {
            return curTy[0];
        }
        return new TupleType(curTy, pos);
    }

    parseCustomType(): Type {
        /*
         * ty ::= ty longtycon    CustomType(fullName:String, tyArg:Type[])
         */
        let curTok = this.currentToken();
        let ty = this.parseSimpleType();
        while (this.position < this.tokens.length) {
            let nextTok = this.currentToken();
            if (!this.checkIdentifierOrLongToken(nextTok)) {
                return ty;
            }
            ++this.position;
            ty = new CustomType(nextTok.getText(), [ty], curTok.position);
            continue;
        }
        return ty;
    }

    parseValueBinding(): ValueBinding {
        /*
         *  valbind ::= pat = exp       ValueBinding(pos, isRec, pat, exp)
         *              rec valbind     isRecursive = true
         */
        let curTok = this.currentToken();
        if (this.checkKeywordToken(curTok, 'rec')) {
            ++this.position;
            let res = this.parseValueBinding();
            res.position = curTok.position;
            res.isRecursive = true;
            return res;
        }
        let pat = this.parsePattern();
        this.assertKeywordToken(this.currentToken(), '=');
        ++this.position;
        return new ValueBinding(curTok.position, false, pat, this.parseExpression());
    }

    parseFunctionValueBinding(): FunctionValueBinding {
        let curTok = this.currentToken();
        let result: [PatternExpression[], Type|undefined, Expression][] = [];
        let argcnt = -1;
        let name: ValueIdentifier|undefined = undefined;
        while (true) {
            let args: PatternExpression[] = [];
            let ty: Type | undefined = undefined;
            let nm: ValueIdentifier;

            if (this.checkKeywordToken(this.currentToken(), '(')) {
                let pat = this.parsePattern();

                if ((!(pat instanceof FunctionApplication))
                    || (!((<FunctionApplication> pat).argument.simplify() instanceof Record))
                    || ((<Record> ((<FunctionApplication> pat).argument.simplify())).entries.length !== 2)
                    || (!((<FunctionApplication> pat).func instanceof ValueIdentifier))) {
                    throw new ParserError('If you start a function declaration with a "(",'
                        + ' some infix expression should follow. But you gave me "'
                        + pat + '" (' + pat.constructor.name + ').', pat.position);
                }
                nm = <ValueIdentifier> (<FunctionApplication> pat).func;
                args.push(<PatternExpression> (<FunctionApplication> pat).argument);
            } else {
                let oldPos = this.position;
                let throwError = false;
                let throwIfError = false;
                try {
                    let tok = this.parseOpIdentifierToken();
                    nm = new ValueIdentifier(tok.position, tok);
                    if (this.state.getInfixStatus(nm.name) !== undefined
                        && this.state.getInfixStatus(nm.name).infix
                        && !(<IdentifierToken | LongIdentifierToken> nm.name).opPrefixed) {
                        throwError = true;
                        throw new ParserError('Missing "op".', nm.name.position);
                    }

                    while (true) {
                        if (this.checkKeywordToken(this.currentToken(), '=')
                            || this.checkKeywordToken(this.currentToken(), ':')) {
                            break;
                        }
                        let pat = this.parseAtomicPattern();
                        if (pat instanceof ValueIdentifier
                            && this.state.getInfixStatus((<ValueIdentifier> pat).name) !== undefined
                            && this.state.getInfixStatus((<ValueIdentifier> pat).name).infix) {

                            throwIfError = true;
                            throw new ParserError('Cute little infix identifiers such as "' +
                                pat + '" sure should play somewhere else.', pat.position);
                        }

                        args.push(pat);
                    }
                } catch (e) {
                    if (throwError) {
                        throw e;
                    }

                    throwError = false;
                    try {
                        // Again infix
                        this.position = oldPos;
                        let left = this.parseAtomicPattern();

                        this.assertIdentifierOrLongToken(this.currentToken());
                        nm = new ValueIdentifier(this.currentToken().position, this.currentToken());

                        if (this.state.getInfixStatus(this.currentToken()) === undefined
                            || !this.state.getInfixStatus(this.currentToken()).infix) {
                            if (throwIfError) {
                                throwError = true;
                                throw e;
                            }
                            throw new ParserError('"' + this.currentToken().getText()
                                + '" does not have infix status.',
                                this.currentToken().position);
                        }
                        ++this.position;

                        let right = this.parseAtomicPattern();
                        args.push(new Tuple(-1, [left, right]));
                    } catch (f) {
                        // It wasn't infix at all, but simply wrong.
                        throw e;
                    }
                }
            }
            if (this.checkKeywordToken(this.currentToken(), ':')) {
                ++this.position;
                ty = this.parseType();
            }

            this.assertKeywordToken(this.currentToken(), '=');
            ++this.position;

            if (argcnt === -1) {
                argcnt = args.length;
            } else if (argcnt !== 2 && argcnt !== 3 && argcnt !== args.length) {
                throw new ParserError('Different number of arguments.', curTok.position);
            }

            if (argcnt === 0) {
                throw new ParserError('Functions need arguments to survive. Rely on "val" instead.',
                    curTok.position);
            }

            if (name === undefined) {
                name = nm;
            } else if (nm.name.getText() !== name.name.getText()) {
                throw new ParserError(
                    'Different function names in different cases ("' + nm.name.getText()
                    + '" vs. "' + name.name.getText() + '")', curTok.position);
            }

            result.push([args, ty, this.parseExpression()]);
            if (this.checkKeywordToken(this.currentToken(), '|')) {
                ++this.position;
                continue;
            }
            break;
        }
        return new FunctionValueBinding(curTok.position, result, name);
    }

    parseTypeBinding(): TypeBinding {
        /*
         * tybind ::= tyvarseq tycon = ty       TypeBinding(pos, TypeVariable[], IdentifierToken, Type)
         */
        let curTok = this.currentToken();
        let tyvar  = <TypeVariable[]> this.parseTypeVarSequence();
        this.assertIdentifierToken(this.currentToken());

        let vid = this.currentToken();
        ++this.position;
        this.assertKeywordToken(this.currentToken(), '=');
        ++this.position;

        return new TypeBinding(curTok.position, tyvar, <IdentifierToken> vid, this.parseType());
    }

    parseTypeBindingSeq(): TypeBinding[] {
        let tybinds: TypeBinding[] = [];
        while (true) {
            tybinds.push(this.parseTypeBinding());
            if (this.checkKeywordToken(this.currentToken(), 'and')) {
                ++this.position;
            } else {
                break;
            }
        }
        return tybinds;
    }

    parseExceptionBinding(): ExceptionBinding {
        let curTok = this.currentToken();
        let name = this.parseOpIdentifierToken();

        if (this.checkKeywordToken(this.currentToken(), 'of')) {
            ++this.position;
            let ty = this.parseType();
            return new DirectExceptionBinding(curTok.position,
                                              <IdentifierToken> name, ty);
        }
        if (this.checkKeywordToken(this.currentToken(), '=')) {
            ++this.position;
            let oldname = this.parseOpIdentifierToken(true);
            return new ExceptionAlias(curTok.position, <IdentifierToken> name, oldname);
        }
        return new DirectExceptionBinding(curTok.position, name, undefined);
    }

    parseDatatypeBinding(): DatatypeBinding {
        let curTok = this.currentToken();
        let tyvars = <TypeVariable[]> this.parseTypeVarSequence();
        this.assertIdentifierToken(this.currentToken());
        let tycon = this.currentToken();
        ++this.position;
        this.assertKeywordToken(this.currentToken(), '=');
        ++this.position;
        let constrs: [IdentifierToken, Type|undefined][] = [];

        while (true) {
            let name = this.parseOpIdentifierToken();
            if (this.checkKeywordToken(this.currentToken(), 'of')) {
                ++this.position;
                let ty = this.parseType();
                constrs.push([name, ty]);
            } else {
                constrs.push([name, undefined]);
            }

            if (this.checkKeywordToken(this.currentToken(), '|')) {
                ++this.position;
            } else {
                break;
            }
        }
        return new DatatypeBinding(curTok.position, tyvars, <IdentifierToken> tycon, constrs);
    }

    parseDatatypeBindingSeq(): DatatypeBinding[] {
        let datbinds: DatatypeBinding[] = [];
        while (true) {
            datbinds.push(this.parseDatatypeBinding());
            if (this.checkKeywordToken(this.currentToken(), 'and')) {
                ++this.position;
            } else {
                break;
            }
        }
        return datbinds;
    }

    parseStructureBinding(): StructureBinding {
        /*
         * strbind ::= strid = strexp
         */
        let curTok = this.currentToken();
        this.assertIdentifierToken(this.currentToken());
        let tycon = <IdentifierToken> this.currentToken();
        ++this.position;
        this.assertKeywordToken(this.currentToken(), '=');
        ++this.position;
        return new StructureBinding(curTok.position, tycon, this.parseStructureExpression());
    }

    parseStructureBindingSeq(): StructureBinding[] {
        let strbinds: StructureBinding[] = [];
        while (true) {
            strbinds.push(this.parseStructureBinding());
            if (this.checkKeywordToken(this.currentToken(), 'and')) {
                ++this.position;
            } else {
                break;
            }
        }
        return strbinds;
    }

    parseSignatureBinding(): SignatureBinding {
        /*
         * sigbind ::= sigid = sigexp
         */
        let curTok = this.currentToken();
        this.assertIdentifierToken(this.currentToken());
        let tycon = <IdentifierToken> this.currentToken();
        ++this.position;
        this.assertKeywordToken(this.currentToken(), '=');
        ++this.position;
        return new SignatureBinding(curTok.position, tycon, this.parseSignatureExpression());
    }

    parseSignatureBindingSeq(): SignatureBinding[] {
        let sigbinds: SignatureBinding[] = [];
        while (true) {
            sigbinds.push(this.parseSignatureBinding());
            if (this.checkKeywordToken(this.currentToken(), 'and')) {
                ++this.position;
            } else {
                break;
            }
        }
        return sigbinds;
    }

    parseFunctorBinding(): FunctorBinding {
        /*
         * funbind ::= funid (tycon : sigexp) = strexp
         */
        let curTok = this.currentToken();
        this.assertIdentifierToken(this.currentToken());
        let funid = <IdentifierToken> this.currentToken();
        ++this.position;

        this.assertKeywordToken(this.currentToken(), '(');
        ++this.position;

        this.assertIdentifierToken(this.currentToken());
        let tycon = <IdentifierToken> this.currentToken();
        ++this.position;
        this.assertKeywordToken(this.currentToken(), ':');
        ++this.position;
        let sigexp = this.parseSignatureExpression();

        this.assertKeywordToken(this.currentToken(), ')');
        ++this.position;

        this.assertKeywordToken(this.currentToken(), '=');
        ++this.position;
        return new FunctorBinding(curTok.position, funid, tycon, sigexp,
            this.parseStructureExpression());
    }

    parseFunctorBindingSeq(): FunctorBinding[] {
        let funbinds: FunctorBinding[] = [];
        while (true) {
            funbinds.push(this.parseFunctorBinding());
            if (this.checkKeywordToken(this.currentToken(), 'and')) {
                ++this.position;
            } else {
                break;
            }
        }
        return funbinds;
    }

    parseTypeVarSequence(allowFail: boolean = false): TypeVariable[] | undefined {
        /*
         * ε                    []
         * tyvar                [TypeVariable]
         * (tyvar1,…,tyvarn)    TypeVariable[]
         */
        let curTok = this.currentToken();
        let res: TypeVariable[] = [];
        if (curTok instanceof TypeVariableToken) {
            res.push(new TypeVariable(curTok.text, curTok.position));
            ++this.position;
            return res;
        }
        if (this.checkKeywordToken(curTok, '(')) {
            ++this.position;
            while (true) {
                curTok = this.currentToken();
                if (!(curTok instanceof TypeVariableToken)) {
                    if (allowFail) {
                        return undefined;
                    }
                    throw new ParserError('Expected a type varible.', curTok.position);
                }
                res.push(new TypeVariable(curTok.text, curTok.position));
                ++this.position;
                curTok = this.currentToken();
                if (this.checkKeywordToken(curTok, ',')) {
                    ++this.position;
                    continue;
                } else if (this.checkKeywordToken(curTok, ')')) {
                    ++this.position;
                    break;
                }
                throw new ParserError('Expected "," or ")" but got "'
                    + curTok.getText() + '".', curTok.position);
            }
        }
        return res;
    }

    parseDeclaration(topLevel: boolean = false, strDec: boolean = false): Declaration {
        /*
         * dec ::= dec [;] dec                          SequentialDeclaration(pos, Declaration[])
         */
        let res: Declaration[] = [];
        let curTok = this.currentToken();
        let curId = this.currentId++;
        while (this.position < this.tokens.length) {
            let cur = this.parseSimpleDeclaration(topLevel, strDec);
            if (cur instanceof EmptyDeclaration) {
                if (this.position >= this.tokens.length
                    || this.checkKeywordToken(this.currentToken(), 'in')
                    || this.checkKeywordToken(this.currentToken(), 'end')) {
                    break;
                }
                continue;
            }
            res.push(cur);
            if (this.checkKeywordToken(this.currentToken(), ';')) {
                ++this.position;
            }
        }
        return new SequentialDeclaration(curTok.position, res, curId);
    }

    parseSimpleDeclaration(topLevel: boolean = false, strDec: boolean = false): Declaration {
        /*
         * dec ::= val tyvarseq valbind                 ValueDeclaration(pos, tyvarseq, ValueBinding[])
         *         fun tyvarseq fvalbind                FunctionDeclaration(pos, tyvarseq, FunctionValueBinding[])
         *         type typbind                         TypeDeclaration(pos, TypeBinding[])
         *         datatype datbind [withtype typbind]  DatatypeDeclaration(pos, DTBind[], TypeBind[]|undefined)
         *         datatype tycon = datatype ltycon   DatatypeReplication(pos, IdentifierToken, oldname: Token)
         *         abstype datbind [withtype typbind]
         *              with dec end                    AbstypeDeclaration(pos, DTBind[], TypeBing[]|undef, Decl)
         *         exception exbind                     ExceptionDeclaration(pos, ExceptionBinding[])
         *         local dec1 in dec2 end               LocalDeclaration(pos, Declaration, body:Declaration)
         *         open longstrid1 … longstr1dn         OpenDeclaration(pos, names: Token[])
         *         infix [d] vid1 … vidn                InfixDeclaration(pos, ValueIdentifier[], d=0)
         *         infixr [d] vid1 … vidn               InfixRDeclaration(pos, ValueIdentifier[], d=0)
         *         nonfix vid1 … vidn                   NonfixDeclaration(pos, ValueIdentifier[])
         *
         *         structure strbind                    StructureDeclaration(pos, StrBind[])
         *         signature sigbind                    SignatureDeclaration(pos, SigBind[])
         *         functor funbind                      FunctorDeclaration(pos, FunBind[])
         *
         *         do exp                               Evaluation(pos, exp) [succML]
         *
         *         (empty)                              EmptyDeclaration()
         *         exp                                  val it = exp
         */
        let curTok = this.currentToken();
        let curId = this.currentId++;

        if (this.checkKeywordToken(curTok, 'val')) {
            ++this.position;
            let tyvar = this.parseTypeVarSequence(true);
            if (tyvar === undefined) {
                --this.position;
                tyvar = [];
            }
            let valbinds: ValueBinding[] = [];
            let isRec = false;
            while (true) {
                let curbnd = this.parseValueBinding();
                if (curbnd.isRecursive) {
                    isRec = true;
                    if (!(curbnd.expression instanceof Lambda)) {
                        throw new ParserError('Using "rec" requires binding a lambda.',
                            curbnd.position);
                    }
                    if (!(curbnd.pattern instanceof ValueIdentifier)
                        && !(curbnd.pattern instanceof Wildcard)) {
                        throw new ParserError('Using "rec" requires binding to a single identifier'
                            + ' and not "' + curbnd.pattern.toString(0, true) + '".',
                            curbnd.position);
                    }
                }
                curbnd.isRecursive = isRec;
                valbinds.push(curbnd);
                if (this.checkKeywordToken(this.currentToken(), 'and')) {
                    ++this.position;
                } else {
                    break;
                }
            }
            return new ValueDeclaration(curTok.position, <TypeVariable[]> tyvar, valbinds, curId);
        } else if (this.checkKeywordToken(curTok, 'fun')) {
            ++this.position;
            let tyvar = this.parseTypeVarSequence(true);
            if (tyvar === undefined) {
                --this.position;
                tyvar = [];
            }
            let fvalbinds: FunctionValueBinding[] = [];
            while (true) {
                fvalbinds.push(this.parseFunctionValueBinding());
                if (this.checkKeywordToken(this.currentToken(), 'and')) {
                    ++this.position;
                } else {
                    break;
                }
            }
            return new FunctionDeclaration(curTok.position, tyvar, fvalbinds, curId);
        } else if (this.checkKeywordToken(curTok, 'type')) {
            ++this.position;
            return new TypeDeclaration(curTok.position, this.parseTypeBindingSeq(), curId);
        } else if (this.checkKeywordToken(curTok, 'datatype')) {
            if (this.position + 3 < this.tokens.length &&
                this.checkKeywordToken(this.tokens[this.position + 3], 'datatype')) {
                ++this.position;
                let nw = this.currentToken();
                this.assertIdentifierToken(nw);
                this.position += 2;
                let old = this.currentToken();
                this.assertIdentifierOrLongToken(old);
                return new DatatypeReplication(curTok.position, <IdentifierToken> nw,
                                               <IdentifierToken|LongIdentifierToken> old, curId);
            } else {
                ++this.position;
                let datbind = this.parseDatatypeBindingSeq();
                if (this.checkKeywordToken(this.currentToken(), 'withtype')) {
                    ++this.position;
                    let tp = this.parseTypeBindingSeq();
                    return new DatatypeDeclaration(curTok.position, datbind, tp, curId);
                }
                return new DatatypeDeclaration(curTok.position, datbind, undefined, curId);
            }
        } else if (this.checkKeywordToken(curTok, 'abstype')) {
            ++this.position;

            let nstate = this.state;
            this.state = this.state.getNestedState(this.state.id);

            let datbind = this.parseDatatypeBindingSeq();
            let tybind: TypeBinding[]|undefined = undefined;
            if (this.checkKeywordToken(this.currentToken(), 'withtype')) {
                ++this.position;
                tybind = this.parseTypeBindingSeq();
            }
            this.assertKeywordToken(this.currentToken(), 'with');
            ++this.position;
            let dec = this.parseDeclaration();
            this.assertKeywordToken(this.currentToken(), 'end');
            ++this.position;

            this.state = nstate;

            return new AbstypeDeclaration(curTok.position, datbind, tybind, dec, curId);
        } else if (this.checkKeywordToken(curTok, 'exception')) {
            ++this.position;
            let bnds: ExceptionBinding[] = [];
            while (true) {
                bnds.push(this.parseExceptionBinding());
                if (this.checkKeywordToken(this.currentToken(), 'and')) {
                    ++this.position;
                } else {
                    break;
                }
            }
            return new ExceptionDeclaration(curTok.position, bnds, curId);
        } else if (this.checkKeywordToken(curTok, 'local')) {
            ++this.position;

            let nstate = this.state;
            this.state = this.state.getNestedState(this.state.id);

            let dec: Declaration = this.parseDeclaration(false, strDec);
            this.assertKeywordToken(this.currentToken(), 'in');
            ++this.position;
            let dec2: Declaration = this.parseDeclaration(false, strDec);
            this.assertKeywordToken(this.currentToken(), 'end');
            ++this.position;

            this.state = nstate;

            return new LocalDeclaration(curTok.position, dec, dec2, curId);
        } else if (this.checkKeywordToken(curTok, 'open')) {
            ++this.position;
            let res: Token[] = [];
            while (this.checkIdentifierOrLongToken(this.currentToken())) {
                res.push(this.currentToken());
                ++this.position;
            }
            if (res.length === 0) {
                throw new ParserError('Empty "open" declaration.',
                                      this.currentToken().position);
            }
            return new OpenDeclaration(curTok.position, res, curId);

        } else if (this.checkKeywordToken(curTok, 'infix')) {
            ++this.position;
            let precedence = 0;
            if (this.currentToken() instanceof IntegerConstantToken) {
                if (this.currentToken().text.length !== 1) {
                    throw new ParserError('Precedences may only be single digits.',
                        this.currentToken().position);
                }
                precedence = (<IntegerConstantToken> this.currentToken()).value;
                ++this.position;
            }
            let res: IdentifierToken[] = [];
            while (this.currentToken().isVid()) {
                res.push(<IdentifierToken> this.currentToken());
                ++this.position;
            }

            if (res.length === 0) {
                throw new ParserError('Empty "infix" declaration.',
                                      this.currentToken().position);
            }
            let resdec = new InfixDeclaration(curTok.position, res, precedence, curId);
            this.state = resdec.evaluate(this.state)[0];
            return resdec;
        } else if (this.checkKeywordToken(curTok, 'infixr')) {
            ++this.position;
            let precedence = 0;
            if (this.currentToken() instanceof IntegerConstantToken) {
                if (this.currentToken().text.length !== 1) {
                    throw new ParserError('Precedences may only be single digits.',
                        this.currentToken().position);
                }
                precedence = (<IntegerConstantToken> this.currentToken()).value;
                ++this.position;
            }
            let res: IdentifierToken[] = [];
            while (this.currentToken().isVid()) {
                res.push(<IdentifierToken> this.currentToken());
                ++this.position;
            }

            if (res.length === 0) {
                throw new ParserError('Empty "infixr" declaration.',
                                      this.currentToken().position);
            }
            let resdec = new InfixRDeclaration(curTok.position, res, precedence, curId);
            this.state = resdec.evaluate(this.state)[0];
            return resdec;
        } else if (this.checkKeywordToken(curTok, 'nonfix')) {
            ++this.position;
            let res: IdentifierToken[] = [];
            while (this.currentToken().isVid()) {
                res.push(<IdentifierToken> this.currentToken());
                ++this.position;
            }

            if (res.length === 0) {
                throw new ParserError('Empty "nonfix" declaration.',
                                      this.currentToken().position);
            }
            let resdec = new NonfixDeclaration(curTok.position, res, curId);
            this.state = resdec.evaluate(this.state)[0];
            return resdec;
        }

        if (this.options.allowSuccessorML && this.checkKeywordToken(curTok, 'do')) {
            ++this.position;
            return new Evaluation(curTok.position, this.parseExpression());
        }

        if (this.options.allowStructuresAnywhere === true || strDec) {
            if (this.checkKeywordToken(curTok, 'structure')) {
                ++this.position;
                return new StructureDeclaration(curTok.position, this.parseStructureBindingSeq());
            }
        }

        if (this.options.allowSignaturesAnywhere === true || topLevel) {
            if (this.checkKeywordToken(curTok, 'signature')) {
                ++this.position;
                return new SignatureDeclaration(curTok.position, this.parseSignatureBindingSeq());
            }
        }

        if (this.options.allowFunctorsAnywhere === true || topLevel) {
            if (this.checkKeywordToken(curTok, 'functor')) {
                ++this.position;
                return new FunctorDeclaration(curTok.position, this.parseFunctorBindingSeq());
            }
        }

        if (this.checkKeywordToken(curTok, ';')) {
            ++this.position;
            return new EmptyDeclaration(curId);
        } else if (this.checkKeywordToken(curTok, 'in')
                || this.checkKeywordToken(curTok, 'end')) {
            return new EmptyDeclaration(curId);
        }

        if (topLevel) {
            let exp = this.parseExpression();
            let valbnd = new ValueBinding(curTok.position, false,
                new ValueIdentifier(-1, new AlphanumericIdentifierToken('it', -1)), exp);
            this.assertKeywordToken(this.currentToken(), ';');
            return new ValueDeclaration(curTok.position, [], [valbnd], curId);
        }
        throw new ParserError('Expected a declaration.', curTok.position);
    }

    private currentToken(): Token {
        if (this.position >= this.tokens.length) {
            throw new IncompleteError(-1, 'More input, I\'m starving. ~nyan.');
        }
        return this.tokens[ this.position ];
    }
}

export function parse(tokens: Token[], state: State, options: {[name: string]: any} = {}): Declaration {
    let p: Parser = new Parser(tokens, state, state.id, options);
    return p.parseDeclaration(true, true);
}
