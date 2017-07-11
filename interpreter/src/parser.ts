import { Expression, Pattern, Tuple, Constant, ValueIdentifier, Wildcard,
         LayeredPattern, FunctionApplication, TypedExpression, Record, List,
         Sequence, RecordSelector, Lambda, Conjunction, LocalDeclarationExpression,
         Disjunction, Conditional, CaseAnalysis, RaiseException,
         HandleException, Match, InfixExpression } from './expressions';
import { Type, RecordType, TypeVariable, TupleType, CustomType, FunctionType } from './types';
import { InterpreterError, IncompleteError, Position } from './errors';
import { Token, KeywordToken, IdentifierToken, ConstantToken,
         TypeVariableToken, LongIdentifierToken, IntegerConstantToken } from './lexer';
import { EmptyDeclaration, Declaration, ValueBinding, ValueDeclaration,
         FunctionValueBinding, FunctionDeclaration, TypeDeclaration,
         DatatypeReplication, DatatypeDeclaration, SequentialDeclaration,
         DatatypeBinding, TypeBinding, AbstypeDeclaration, LocalDeclaration,
         ExceptionBinding, DirectExceptionBinding, ExceptionAlias, NonfixDeclaration,
         ExceptionDeclaration, OpenDeclaration, InfixDeclaration, InfixRDeclaration } from './declarations';

export class ParserError extends InterpreterError {
    constructor(message: string, position: Position) {
        super(message, position);
        Object.setPrototypeOf(this, ParserError.prototype);
    }
}

export class Parser {
    private position: number = 0; // position of the next not yet parsed token
    //    private tmpTree: ASTNode; // Temporary storage for a subtree.

    constructor(private tokens: Token[]) {}

    assertKeywordToken(tok: Token, text: string | undefined = undefined) {
        if (!(tok instanceof KeywordToken)) {
            throw new ParserError('Expected a reserved word.', tok.position);
        }
        if (text !== undefined && tok.text !== text) {
            throw new ParserError('Expected "' + text + '" but got "' + tok.text + '".', tok.position);
        }
    }
    assertIdentifierToken(tok: Token) {
        if (!(tok instanceof IdentifierToken)) {
            throw new ParserError('Expected an identifier.', tok.position);
        }
    }
    assertIdentifierOrLongToken(tok: Token) {
        if (!(tok instanceof IdentifierToken)
            && !(tok instanceof LongIdentifierToken)) {
            throw new ParserError('Expected a (long) identifier.', tok.position);
        }
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
            this.assertIdentifierOrLongToken(nextCurTok);
            (<IdentifierToken|LongIdentifierToken> nextCurTok).opPrefixed = true;
            ++this.position;
            return new ValueIdentifier(curTok.position, nextCurTok);
        }
        if (this.checkKeywordToken(curTok, '{')) {
            // Record pattern
            ++this.position;
            return this.parseExpressionRow();
        }
        if (this.checkKeywordToken(curTok, '(')) {
            // Tuple pattern
            let results: Expression[] = [];
            let length: number = 0;
            let isSequence = false;
            let isTuple = false;
            while (true) {
                let nextCurTok = this.currentToken();
                if (this.checkKeywordToken(curTok, '(') && length === 0) {
                    ++this.position;
                } else if (this.checkKeywordToken(curTok, ',') && length > 0 && !isSequence) {
                    ++this.position;
                    isTuple = true;
                } else if (this.checkKeywordToken(curTok, ';') && length > 0 && !isTuple) {
                    ++this.position;
                    isSequence = true;
                } else if (this.checkKeywordToken(curTok, ')')) {
                    ++this.position;
                    if (length === 1) {
                        return results[0];
                    } else {
                        if (isTuple) {
                            return new Tuple(curTok.position, results);
                        } else if (isSequence) {
                            return new Sequence(curTok.position, results);
                        }
                    }
                } else {
                    // TODO more specific error messages
                    throw new ParserError('Expected ",",";" or ")".', nextCurTok.position);
                }
                results.push(this.parseExpression());
                length++;
            }
        }
        if (this.checkKeywordToken(curTok, '[')) {
            // List pattern
            let results: Expression[] = [];
            while (true) {
                let nextCurTok = this.currentToken();
                if (this.checkKeywordToken(curTok, '[') && length === 0) {
                    ++this.position;
                } else if (this.checkKeywordToken(curTok, ',') && length > 0) {
                    ++this.position;
                } else if (this.checkKeywordToken(curTok, ']')) {
                    ++this.position;
                    return new List(curTok.position, results);
                } else {
                    throw new ParserError('Expected "," or "]".', nextCurTok.position);
                }
                results.push(this.parseExpression());
            }
        }
        if (this.checkKeywordToken(curTok, '#')) {
            ++this.position;
            let nextTok = this.currentToken();
            this.assertIdentifierToken(nextTok);
            return new RecordSelector(curTok.position, nextTok);
        }
        if (this.checkKeywordToken(curTok, 'let')) {
            ++this.position;
            let dec = this.parseDeclaration();
            this.assertKeywordToken(this.currentToken(), 'in');
            ++this.position;
            let res: Expression[] = [this.parseExpression()];
            let newTok = this.currentToken();
            while (this.checkKeywordToken(curTok, ',')) {
                ++this.position;
                res.push(this.parseExpression());
                newTok = this.currentToken();
            }
            this.assertKeywordToken(newTok, 'end');
            ++this.position;
            return new LocalDeclarationExpression(curTok.position, dec, new Sequence(curTok.position, res));
        } else if (curTok instanceof ConstantToken) {
            return new Constant(curTok.position, curTok);
        } else if (curTok instanceof IdentifierToken
                   || curTok instanceof LongIdentifierToken) {
            return new ValueIdentifier(curTok.position, curTok);
        }
        throw new ParserError('Expected atomic expression.', curTok.position);
    }

    parseExpressionRow(): Expression {
        /*
         * Parses Record expression, munches closing }
         * exprow ::= lab = exp [, exprow]  Record(position, complete: boolean,
         *                                         entries: [string, (Pattern|Expression)][])
         *              IdentifierToken KeywordToken exp [KeywordToken exp]*
         */
        let curTok = this.currentToken();
        let res = new Record(curTok.position, true, []);
        let firstIt = true;
        while (true) {
            curTok = this.currentToken();
            if (this.checkKeywordToken(curTok, '}')) {
                ++this.position;
                return res;
            }
            if (!firstIt && this.checkKeywordToken(curTok, ',')) {
                ++this.position;
                continue;
            }
            firstIt = false;

            if (curTok instanceof IdentifierToken) {
                ++this.position;
                let nextTok = this.currentToken();
                this.assertKeywordToken(nextTok, '=');

                ++this.position;
                res.entries.push([curTok.text, this.parsePattern(), undefined]);
                continue;
            }
            throw new ParserError('Expected "}", or identifier', curTok.position);
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
            try {
                let newExp = this.parseAtomicExpression();
                res = new FunctionApplication(curTok.position, res, newExp);
            } catch (ParserError) {
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
            if (curTok instanceof IdentifierToken) {
                // We don't know anything about identifiers yet, so just assume they are infix
                ++this.position;
                ops.push([curTok, cnt++]);
            } else {
                break;
            }
        }

        return new InfixExpression(exps, ops);
    }

    parseExpression(): Expression {
        /*
         * exp ::= infexp
         *         exp : ty                         TypedExpression(position, exp, type)
         *          exp KeywordToken type
         *         exp1 andalso exp2                Conjunction(pos, exp1, exp2)
         *          exp KeywordToken exp
         *         exp1 orelse exp2                 Disjunction(pos, exp1, exp2)
         *          exp KeywordToken exp
         *         exp handle match                 HandleException(position, exp, match)
         *          exp KeywordToken exp
         *         raise exp                        RaiseException(position, exp)
         *          KeywordToken exp
         *         if exp1 then exp2 else exp3      Conditional(pos, exp1, exp2, exp3)
         *          KeywordToken exp KeywordToken exp KeywordToken exp
         *         case exp of match                CaseAnalysis(pos, exp, match)
         *          KeywordToken exp KeywordToken match
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
            this.assertKeywordToken(this.currentToken(), 'else');
            return new Conditional(curTok.position, cond, cons, this.parseExpression());
        } else if (this.checkKeywordToken(curTok, 'case')) {
            ++this.position;
            let cond = this.parseExpression();
            this.assertKeywordToken(this.currentToken(), 'of');
            ++this.position;
            return new CaseAnalysis(curTok.position, cond, this.parseMatch());
        } else if (this.checkKeywordToken(curTok, 'fn')) {
            ++this.position;
            return new Lambda(curTok.position, this.parseMatch());
        }

        let exp = this.parseInfixExpression();
        let nextTok = this.currentToken();
        if (this.checkKeywordToken(nextTok, ':')) {
            ++this.position;
            return new TypedExpression(curTok.position, exp, this.parseType());
        } else if (this.checkKeywordToken(nextTok, 'andalso')) {
            ++this.position;
            return new Conjunction(curTok.position, exp, this.parseExpression());
        } else if (this.checkKeywordToken(nextTok, 'orelse')) {
            ++this.position;
            return new Disjunction(curTok.position, exp, this.parseExpression());
        } else if (this.checkKeywordToken(nextTok, 'handle')) {
            ++this.position;
            return new HandleException(curTok.position, exp, this.parseMatch());
        }
        throw new ParserError('Expected "orelse", "andalso" or "handle".', nextTok.position);
    }

    parseMatch(): Match {
        /*
         * match ::= pat => exp [| match]       Match(pos, [Pattern, Expression][])
         */
        let curTok = this.currentToken();
        let res: [Pattern, Expression][] = [];
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
        let res = new Record(curTok.position, true, []);
        let firstIt = true;
        while (true) {
            curTok = this.currentToken();
            if (this.checkKeywordToken(curTok, '}')) {
                ++this.position;
                return res;
            }
            if (!res.complete) {
                throw new ParserError('Record wildcard must appear as last element of the record.', curTok.position);
            }
            if (!firstIt && this.checkKeywordToken(curTok, ',')) {
                ++this.position;
                continue;
            }
            firstIt = false;

            if (this.checkKeywordToken(curTok, '...')) {
                // A wildcard may only occur as the last entry of a record.
                res.complete = false;
                ++this.position;
                continue;
            }
            if (curTok instanceof IdentifierToken) {
                ++this.position;
                let nextTok = this.currentToken();
                if (!(nextTok instanceof KeywordToken)) {
                    throw new ParserError('Expected ":", "as", or ","', nextTok.position);
                }

                if (nextTok.text === '=') {
                    // lab = pat
                    ++this.position;
                    res.entries.push([curTok.text, this.parsePattern(), undefined]);
                    continue;
                }

                let tp: Type|undefined = undefined;
                let pat: Pattern = new Wildcard(curTok.position);
                let hasPat = false;
                let hasType = false;

                for (let i = 0; i < 2; ++i) {
                    if (nextTok.text === 'as') {
                        if (hasPat) {
                            throw new ParserError('More than one "as" encountered.', nextTok.position);
                        }
                        ++this.position;
                        pat = this.parsePattern();
                        nextTok = this.currentToken();
                        hasPat = true;
                    } else if (nextTok.text === ':') {
                        if (hasType) {
                            throw new ParserError('More than one type encountered.', nextTok.position);
                        }
                        ++this.position;
                        tp = this.parseType();
                        nextTok = this.currentToken();
                        hasType = true;
                    }
                }
                res.entries.push([curTok.text, pat, tp]);
                continue;
            }
            throw new ParserError('Expected "}", "...", or identifier', curTok.position);
        }
    }

    parseAtomicPattern(): Pattern {
        /*
         * atpat ::= _                      Wildcard(pos)
         *           scon                   Constant(pos, token)
         *           [op] longvid           ValueIdentifier(pos, name:Taken)
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
            let results: Pattern[] = [];
            let length: number = 0;
            while (true) {
                let nextCurTok = this.currentToken();
                if (this.checkKeywordToken(nextCurTok, '(')
                    && length === 0) {
                    ++this.position;
                } else if (this.checkKeywordToken(nextCurTok, ',')
                    && length > 0) {
                    ++this.position;
                } else if (this.checkKeywordToken(nextCurTok, ')')) {
                    ++this.position;
                    if (length === 1) {
                        return results[0];
                    } else {
                        return new Tuple(curTok.position, results);
                    }
                } else {
                    throw new ParserError('Expected "," or ")".', nextCurTok.position);
                }
                results.push(this.parsePattern());
                length++;
            }
        }
        if (this.checkKeywordToken(curTok, '[')) {
            // List pattern
            let results: Pattern[] = [];
            while (true) {
                let nextCurTok = this.currentToken();
                if (nextCurTok instanceof KeywordToken) {
                    if (nextCurTok.text === '[' && length === 0) {
                        ++this.position;
                    } else if (nextCurTok.text === ',' && length > 0) {
                        ++this.position;
                    } else if (nextCurTok.text === ']') {
                        ++this.position;
                        return new List(curTok.position, results);
                    } else {
                        throw new ParserError('Expected "," or "]".', nextCurTok.position);
                    }
                } else {
                    throw new ParserError('Expected "," or "]".', nextCurTok.position);
                }
                results.push(this.parsePattern());
            }
        } else if (curTok instanceof ConstantToken) {
            return new Constant(curTok.position, curTok);
        } else if (curTok instanceof IdentifierToken
                   || curTok instanceof LongIdentifierToken) {
            return new ValueIdentifier(curTok.position, curTok);
        }
        throw new ParserError('Expected atomic pattern.', curTok.position);
    }

    parseSimplePattern(): Pattern {
        /*
         *  pat ::= atpat
         *          [op] longvid atpat      FunctionApplication(pos, func, argument)
         *          pat : ty                TypedExpression(pos, exp, type)
         *          [op] vid [:ty] as pat   LayeredPattern(pos, IdentifierToken, type, pattern)
         */
        let curTok = this.currentToken();
        let oldPos = this.position;
        let opPrefixed = false;
        let isLong = false;
        if (this.checkKeywordToken(curTok, 'op')) {
            opPrefixed = true;
            ++this.position;
        }
        let nextTok = this.currentToken();
        if (nextTok instanceof LongIdentifierToken) {
            isLong = true;
        }
        if (nextTok instanceof IdentifierToken || nextTok instanceof LongIdentifierToken) {
            let name: IdentifierToken|LongIdentifierToken = nextTok;
            name.opPrefixed = opPrefixed;
            ++this.position;
            try {
                // Check whether layered pattern
                if (!isLong) {
                    let newTok = this.currentToken();
                    let tp: Type | undefined;
                    if (this.checkKeywordToken(newTok, ':')) {
                        ++this.position;
                        tp = this.parseType();
                        newTok = this.currentToken();
                    }
                    this.assertKeywordToken(newTok, 'as');
                    ++this.position;
                    return new LayeredPattern(curTok.position, name, tp, this.parsePattern());
                }

                // Try if it is a FunctionApplication instead
                return new FunctionApplication(curTok.position,
                                               new ValueIdentifier(name.position, name),
                                               this.parseAtomicPattern());
            } catch (ParserError) {
                // It seems we were wrong, so try the other possibilities instead
                this.position = oldPos;
            }
        }

        let res = this.parseAtomicPattern();
        nextTok = this.currentToken();
        if (this.checkKeywordToken(nextTok, ':')) {
            ++this.position;
            let tp = this.parseType();
            return new TypedExpression(curTok.position, res, tp);
        }
        return res;
    }

    parsePattern(): Pattern {
        /*
         * pat ::= pat1 vid pat2            FunctionApplication(pos, vid, (pat1, pat2))
         */
        let pats: Pattern[] = [];
        let ops: [IdentifierToken, number][] = [];
        let cnt: number = 0;

        while (true) {
            pats.push(this.parseSimplePattern());

            let curTok = this.currentToken();
            if (curTok instanceof IdentifierToken) {
                ++this.position;
                ops.push([curTok, cnt++]);
            } else {
                break;
            }
        }
        return new InfixExpression(pats, ops);
    }

    parseTypeRow(): RecordType {
        /*
         * Parses Record type, munches closing }
         * tyrow ::= lab : ty [, tyrow]     Record(comp:boolean, entries: [string, Type])
         */
        let curTok = this.currentToken();
        let res = new RecordType(curTok.position, true, []);
        let firstIt = true;
        while (true) {
            curTok = this.currentToken();
            if (this.checkKeywordToken(curTok, '}')) {
                ++this.position;
                return res;
            }
            if (!firstIt && this.checkKeywordToken(curTok, ',')) {
                ++this.position;
                continue;
            }
            firstIt = false;

            if (curTok instanceof IdentifierToken) {
                ++this.position;
                let nextTok = this.currentToken();
                if (!(nextTok instanceof KeywordToken)) {
                    throw new ParserError('Expected ":".', nextTok.position);
                }

                if (nextTok.text === ':') {
                    // lab = pat
                    ++this.position;
                    res.entries.push([curTok.text, this.parseType()]);
                    continue;
                }
                throw new ParserError('Expected ":".', nextTok.position);
            }
            throw new ParserError('Expected "}", or identifier', curTok.position);
        }
    }

    parseSimpleType(): Type {
        /*
         * ty ::= tyvar             TypeVariable(name:string)
         *        ty[] longtycon    CustomType(fullName:String, tyArg:TypeVariable[])
         *        { [tyrow] }
         *        ( ty )
         */
        let curTok = this.currentToken();
        if (curTok instanceof TypeVariableToken) {
            let tyvars: TypeVariable[] = [new TypeVariable(curTok.position, curTok.text)];
            ++this.position;
            curTok = this.currentToken();
            while (curTok instanceof TypeVariableToken) {
                tyvars.push(new TypeVariable(curTok.position, curTok.text));
                ++this.position;
                curTok = this.currentToken();
            }
            if (tyvars.length === 1) {
                return tyvars[0];
            }
            this.assertIdentifierOrLongToken(curTok);
            ++this.position;
            return new CustomType(curTok.position, curTok, tyvars);
        }

        if (this.checkKeywordToken(curTok, '{')) {
            ++this.position;
            return this.parseTypeRow();
        }
        if (this.checkKeywordToken(curTok, '(')) {
            ++this.position;
            let res = this.parseType();
            curTok = this.currentToken();
            if (!(curTok instanceof KeywordToken)
                || curTok.text !== ')') {
                throw new ParserError('Missing closing ")"', curTok.position);
            }
            ++this.position;
            return res;
        }
        throw new ParserError('Expected either "(" or "{".', curTok.position);
    }

    parseArrowType(): Type {
        /*
         * ty ::= ty1 -> ty2        Function(param:Type, return:Type)
         */
        let curTy = this.parseSimpleType();
        let curTok = this.currentToken();
        if (!this.checkKeywordToken(curTok, '->')) {
            return curTy;
        }
        ++this.position;
        let tgTy = this.parseType();
        return new FunctionType(curTok.position, curTy, tgTy);
    }

    parseType(): Type {
        /*
         * ty ::= ty1 * … * tyn     TupleType(types:Type[])
         */
        let curTy = [this.parseArrowType()];
        let curTok = this.currentToken();
        let pos = curTok.position;
        while (this.checkKeywordToken(curTok, '*')) {
            ++this.position;
            curTy.push(this.parseArrowType());
        }
        return new TupleType(pos, curTy);
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
        let result: [Pattern[], Type|undefined, Expression][] = [];
        let argcnt = -1;
        while (true) {
            // We cannot decide which of the arguments is the name yet
            // ([op]vid is also an atomic pattern.)
            // Thus we will do this later, in the second parsing step.
            let args: Pattern[] = [];
            let ty: Type | undefined = undefined;
            while (true) {
                if (this.checkKeywordToken(this.currentToken(), '=')
                    || this.checkKeywordToken(this.currentToken(), ':')) {
                    break;
                }
                let pat = this.parseAtomicPattern();
                args.push(pat);
            }
            if (this.checkKeywordToken(this.currentToken(), ':')) {
                ++this.position;
                ty = this.parseType();
            }

            this.assertKeywordToken(this.currentToken(), '=');
            ++this.position;

            if (argcnt === -1) {
                argcnt = args.length;
            } else if (argcnt !== args.length) {
                throw new ParserError('Different number of arguments.', curTok.position);
            }

            result.push([args, ty, this.parseExpression()]);
            if (this.checkKeywordToken(this.currentToken(), '|')) {
                ++this.position;
                continue;
            }
            break;
        }
        return new FunctionValueBinding(curTok.position, result);
    }

    parseTypeBinding(): TypeBinding {
        /*
         * tybind ::= tyvarseq tycon = ty       TypeBinding(pos, TypeVariable[], IdentifierToken, Type)
         */
        let curTok = this.currentToken();
        let tyvar  = this.parseTypeVarSequence();
        this.assertIdentifierToken(this.currentToken());

        let vid = this.currentToken();
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
        let tyvars = this.parseTypeVarSequence();
        this.assertIdentifierToken(curTok);
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

    parseTypeVarSequence(): TypeVariable[] {
        /*
         * ε                    []
         * tyvar                [TypeVariable]
         * (tyvar1,…,tyvarn)    TypeVariable[]
         */
        let curTok = this.currentToken();
        let res: TypeVariable[] = [];
        if (curTok instanceof TypeVariableToken) {
            res.push(new TypeVariable(curTok.position, curTok.text));
            ++this.position;
            return res;
        }
        if (this.checkKeywordToken(curTok, '(')) {
            ++this.position;
            while (true) {
                curTok = this.currentToken();
                if (!(curTok instanceof TypeVariableToken)) {
                    throw new ParserError('Expexted a type varible.', curTok.position);
                }
                res.push(new TypeVariable(curTok.position, curTok.text));
                ++this.position;
                curTok = this.currentToken();
                if (this.checkKeywordToken(curTok, ',')) {
                    ++this.position;
                } else if (this.checkKeywordToken(curTok, ')')) {
                    ++this.position;
                    break;
                }
                throw new ParserError('Expected "(" or ","', curTok.position);
            }
        }
        return res;
    }

    parseDeclaration(): Declaration {
        /*
         * dec ::= dec [;] dec                          SequentialDeclaration(pos, Declaration[])
         */
        let res: Declaration[] = [];
        let curTok = this.currentToken();
        while (true) {
            let cur = this.parseSimpleDeclaration();
            if (cur instanceof EmptyDeclaration) {
                break;
            }
            res.push(cur);
            if (this.checkKeywordToken(this.currentToken(), ';')) {
                ++this.position;
            }
        }
        return new SequentialDeclaration(curTok.position, res);
    }

    parseSimpleDeclaration(): Declaration {
        /*
         * dec ::= val tyvarseq valbind                 ValueDeclaration(pos, tyvarseq, ValueBinding[])
         *         fun tyvarseq fvalbind                FunctionDeclaration(pos, tyvarseq, FunctionValueBinding[])
         *         type typbind                         TypeDeclaration(pos, TypeBinding[])
         *         datatype datbind [withtype typbind]  DatatypeDeclaration(pos, DTBind[], TypeBind[]|undefined)
         *         datatype tycon -=- datatype ltycon   DatatypeReplication(pos, IdentifierToken, oldname: Token)
         *         abstype datbind [withtype typbind]
         *              with dec end                    AbstypeDeclaration(pos, DTBind[], TypeBing[]|undef, Decl)
         *         exception exbind                     ExceptionDeclaration(pos, ExceptionBinding[])
         *         local dec1 in dec2 end               LocalDeclaration(pos, Declaration, body:Declaration)
         *         open longstrid1 … longstr1dn         OpenDeclaration(pos, names: Token[])
         *         infix [d] vid1 … vidn                InfixDeclaration(pos, ValueIdentifier[], d=0)
         *         infixr [d] vid1 … vidn               InfixRDeclaration(pos, ValueIdentifier[], d=0)
         *         nonfix vid1 … vidn                   NonfixDeclaration(pos, ValueIdentifier[])
         *         (empty)                              EmptyDeclaration()
         *         exp                                  val it = exp
         */
        let curTok = this.currentToken();

        if (this.checkKeywordToken(curTok, 'val')) {
            ++this.position;
            let tyvar = this.parseTypeVarSequence();
            let valbinds: ValueBinding[] = [];
            while (true) {
                valbinds.push(this.parseValueBinding());
                if (this.checkKeywordToken(this.currentToken(), 'and')) {
                    ++this.position;
                } else {
                    break;
                }
            }
            return new ValueDeclaration(curTok.position, tyvar, valbinds);
        } else if (this.checkKeywordToken(curTok, 'fun')) {
            ++this.position;
            let tyvar = this.parseTypeVarSequence();
            let fvalbinds: FunctionValueBinding[] = [];
            while (true) {
                fvalbinds.push(this.parseFunctionValueBinding());
                if (this.checkKeywordToken(this.currentToken(), 'and')) {
                    ++this.position;
                } else {
                    break;
                }
            }
            return new FunctionDeclaration(curTok.position, tyvar, fvalbinds);
        } else if (this.checkKeywordToken(curTok, 'type')) {
            ++this.position;
            return new TypeDeclaration(curTok.position, this.parseTypeBindingSeq());
        } else if (this.checkKeywordToken(curTok, 'datatype')) {
            if (this.position + 2 < this.tokens.length &&
                this.tokens[this.position + 2] instanceof IdentifierToken &&
                this.tokens[this.position + 2].text === '-=-') {
                ++this.position;
                let nw = this.currentToken();
                this.assertIdentifierToken(nw);
                this.position += 2;
                let old = this.currentToken();
                this.assertIdentifierOrLongToken(old);
                return new DatatypeReplication(curTok.position, <IdentifierToken> nw,
                                               <IdentifierToken|LongIdentifierToken> old);
            } else {
                ++this.position;
                let datbind = this.parseDatatypeBindingSeq();
                if (this.checkKeywordToken(this.currentToken(), 'withtype')) {
                    ++this.position;
                    let tp = this.parseTypeBindingSeq();
                    return new DatatypeDeclaration(curTok.position, datbind, tp);
                }
                return new DatatypeDeclaration(curTok.position, datbind, undefined);
            }
        } else if (this.checkKeywordToken(curTok, 'abstype')) {
            ++this.position;
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
            return new AbstypeDeclaration(curTok.position, datbind, tybind, dec);
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
            return new ExceptionDeclaration(curTok.position, bnds);
        } else if (this.checkKeywordToken(curTok, 'local')) {
            ++this.position;
            let dec: Declaration = this.parseDeclaration();
            this.assertKeywordToken(this.currentToken(), 'in');
            ++this.position;
            let dec2: Declaration = this.parseDeclaration();
            this.assertKeywordToken(this.currentToken(), 'end');
            ++this.position;
            return new LocalDeclaration(curTok.position, dec, dec2);
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
            return new OpenDeclaration(curTok.position, res);

        } else if (this.checkKeywordToken(curTok, 'infix')) {
            ++this.position;
            let precedence = 0;
            if (this.currentToken() instanceof IntegerConstantToken) {
                precedence = (<IntegerConstantToken> this.currentToken()).value;
            }
            let res: IdentifierToken[] = [];
            while (this.currentToken() instanceof IdentifierToken) {
                res.push(<IdentifierToken> this.currentToken());
                ++this.position;
            }

            if (res.length === 0) {
                throw new ParserError('Empty "infix" declaration.',
                                      this.currentToken().position);
            }
            return new InfixDeclaration(curTok.position, res, precedence);
        } else if (this.checkKeywordToken(curTok, 'infixr')) {
            ++this.position;
            let precedence = 0;
            if (this.currentToken() instanceof IntegerConstantToken) {
                precedence = (<IntegerConstantToken> this.currentToken()).value;
            }
            let res: IdentifierToken[] = [];
            while (this.currentToken() instanceof IdentifierToken) {
                res.push(<IdentifierToken> this.currentToken());
                ++this.position;
            }

            if (res.length === 0) {
                throw new ParserError('Empty "infixr" declaration.',
                                      this.currentToken().position);
            }
            return new InfixRDeclaration(curTok.position, res, precedence);
        } else if (this.checkKeywordToken(curTok, 'nonfix')) {
            ++this.position;
            let res: IdentifierToken[] = [];
            while (this.currentToken() instanceof IdentifierToken) {
                res.push(<IdentifierToken> this.currentToken());
                ++this.position;
            }

            if (res.length === 0) {
                throw new ParserError('Empty "nonfix" declaration.',
                                      this.currentToken().position);
            }
            return new NonfixDeclaration(curTok.position, res);
        }

        try {
            let exp = this.parseExpression();

            let valbnd = new ValueBinding(curTok.position, false,
                new ValueIdentifier(-1, new IdentifierToken('it', -1)), exp);
            return new ValueDeclaration(curTok.position, [], [valbnd]);
        } catch (ParserError) {
            return new EmptyDeclaration();
        }
    }

    private currentToken(): Token {
        if (this.position >= this.tokens.length) {
            throw new IncompleteError(-1, 'More input, I\'m starving. ~nyan.');
        }
        return this.tokens[ this.position ];
    }
}

export function parse(tokens: Token[]): Declaration {
    let p: Parser = new Parser(tokens);
    return p.parseDeclaration();
}
