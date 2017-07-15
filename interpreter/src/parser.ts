import { Expression, Tuple, Constant, ValueIdentifier, Wildcard,
         LayeredPattern, FunctionApplication, TypedExpression, Record, List,
         Sequence, RecordSelector, Lambda, Conjunction, LocalDeclarationExpression,
         Disjunction, Conditional, CaseAnalysis, RaiseException,
         HandleException, Match, InfixExpression, PatternExpression
} from './expressions';
import { Type, RecordType, TypeVariable, TupleType, CustomType, FunctionType } from './types';
import { InterpreterError, InternalInterpreterError, IncompleteError, Position } from './errors';
import { Token, KeywordToken, IdentifierToken, ConstantToken,
         TypeVariableToken, LongIdentifierToken, IntegerConstantToken,
         AlphanumericIdentifierToken, NumericToken } from './lexer';
import { EmptyDeclaration, Declaration, ValueBinding, ValueDeclaration,
         FunctionValueBinding, FunctionDeclaration, TypeDeclaration,
         DatatypeReplication, DatatypeDeclaration, SequentialDeclaration,
         DatatypeBinding, TypeBinding, AbstypeDeclaration, LocalDeclaration,
         ExceptionBinding, DirectExceptionBinding, ExceptionAlias, NonfixDeclaration,
         ExceptionDeclaration, OpenDeclaration, InfixDeclaration, InfixRDeclaration } from './declarations';
import { State } from './state';

export class ParserError extends InterpreterError {
    constructor(message: string, position: Position) {
        super(position, message);
        Object.setPrototypeOf(this, ParserError.prototype);
    }
}

export class Parser {
    private position: number = 0; // position of the next not yet parsed token

    constructor(private tokens: Token[], private state: State) {
        if (this.state === undefined) {
            throw new InternalInterpreterError(-1, 'What are you, stupid? Hurry up and give me ' +
                'a state already!');
        }
    }

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
    assertIdentifierOrNumericToken(tok: Token) {
        if (!(tok instanceof IdentifierToken)
            && !(tok instanceof NumericToken)) {
            throw new ParserError('Expected an identifier, got \"'
                + tok.getText() + '\" ('
                + tok.constructor.name + ').', tok.position);
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
                } else if (this.checkKeywordToken(nextCurTok, ';') && !isTuple) {
                    ++this.position;
                    isSequence = true;
                } else if (this.checkKeywordToken(nextCurTok, ')')) {
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
            // List pattern
            let results: Expression[] = [];
            let length = 0;
            while (true) {
                let nextCurTok = this.currentToken();
                if (this.checkKeywordToken(nextCurTok, '[') && length === 0) {
                    ++this.position;
                } else if (this.checkKeywordToken(nextCurTok, ',') && length > 0) {
                    ++this.position;
                } else if (this.checkKeywordToken(nextCurTok, ']')) {
                    ++this.position;
                    return new List(curTok.position, results);
                } else {
                    throw new ParserError('Expected "," or "]" but found "' +
                        nextCurTok.getText() + '".', nextCurTok.position);
                }
                ++length;
                results.push(this.parseExpression());
            }
        }
        if (this.checkKeywordToken(curTok, '#')) {
            ++this.position;
            let nextTok = this.currentToken();
            this.assertIdentifierOrNumericToken(nextTok);
            ++this.position;
            return new RecordSelector(curTok.position, <NumericToken | IdentifierToken> nextTok);
        }
        if (this.checkKeywordToken(curTok, 'let')) {
            ++this.position;

            let nstate = this.state;
            this.state = this.state.getNestedState();

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

            this.state = nstate;

            return new LocalDeclarationExpression(curTok.position, dec, new Sequence(curTok.position, res));
        } else if (curTok instanceof ConstantToken) {
            ++this.position;
            return new Constant(curTok.position, curTok);
        } else if (curTok instanceof IdentifierToken
                   || curTok instanceof LongIdentifierToken) {
            ++this.position;
            if (this.state.getIdentifierInformation(curTok) !== undefined
                && this.state.getIdentifierInformation(curTok).infix) {
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

            if (curTok.isValidRecordLabel()) {
                ++this.position;
                let nextTok = this.currentToken();
                this.assertKeywordToken(nextTok, '=');

                ++this.position;
                res.entries.push([curTok.getText(), this.parseExpression()]);
                continue;
            }
            throw new ParserError('Expected "}", or identifier, got "'
                + curTok.getText() + '".', curTok.position);
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
            if (this.checkIdentifierOrLongToken(nextTok)
                && this.state.getIdentifierInformation(nextTok) !== undefined
                && this.state.getIdentifierInformation(nextTok).infix) {
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
            if (this.checkIdentifierOrLongToken(curTok)
                && this.state.getIdentifierInformation(curTok) !== undefined
                && this.state.getIdentifierInformation(curTok).infix) {
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
            ++this.position;
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
        return exp;
    }

    parseMatch(): Match {
        /*
         * match ::= pat => exp [| match]       Match(pos, [Pattern, Expression][])
         */
        let curTok = this.currentToken();
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
            if (curTok.isValidRecordLabel()) {
                ++this.position;
                let nextTok = this.currentToken();
                if (!(nextTok instanceof KeywordToken)) {
                    throw new ParserError('Expected ":", "as", ",", or "=", got ' +
                        nextTok.getText() + '".', nextTok.position);
                }

                if (nextTok.text === '=') {
                    // lab = pat
                    ++this.position;
                    res.entries.push([curTok.text, this.parsePattern()]);
                    continue;
                }

                let tp: Type|undefined = undefined;
                let pat: PatternExpression = new Wildcard(curTok.position);
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
                if (tp !== undefined) {
                    pat = new TypedExpression(curTok.position, pat, tp);
                }
                res.entries.push([curTok.text, pat]);
                continue;
            }
            throw new ParserError('Expected "}", "...", or identifier.', curTok.position);
        }
    }

    parseAtomicPattern(): PatternExpression {
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
            let results: PatternExpression[] = [];
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
            let length = 0;
            let results: PatternExpression[] = [];
            while (true) {
                let nextCurTok = this.currentToken();
                if (this.checkKeywordToken(nextCurTok, '[') && length === 0) {
                    ++this.position;
                } else if (this.checkKeywordToken(nextCurTok, ',') && length > 0) {
                    ++this.position;
                } else if (this.checkKeywordToken(nextCurTok, ']')) {
                    ++this.position;
                    return new List(curTok.position, results);
                } else {
                    throw new ParserError('Expected "," or "]" but found "' +
                        nextCurTok.getText() + '".', nextCurTok.position);
                }
                results.push(this.parsePattern());
                ++length;
            }
        } else if (curTok instanceof ConstantToken) {
            ++this.position;
            return new Constant(curTok.position, curTok);
        } else if (curTok instanceof IdentifierToken
            || curTok instanceof LongIdentifierToken) {
            ++this.position;
            return new ValueIdentifier(curTok.position, curTok);
        }
        throw new ParserError('Expected atomic pattern but got "'
            + curTok.getText() + '".', curTok.position);
    }

    parseSimplePattern(): PatternExpression {
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

    parsePattern(): PatternExpression {
        /*
         * pat ::= pat1 vid pat2            FunctionApplication(pos, vid, (pat1, pat2))
         */
        let pats: PatternExpression[] = [];
        let ops: [IdentifierToken, number][] = [];
        let cnt: number = 0;

        while (true) {
            pats.push(this.parseSimplePattern());

            let curTok = this.currentToken();
            if (this.checkIdentifierOrLongToken(curTok)
                && this.state.getIdentifierInformation(curTok) !== undefined
                && this.state.getIdentifierInformation(curTok).infix) {
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
            return new CustomType(curTok as (IdentifierToken | LongIdentifierToken), [], curTok.position);
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
                    return new CustomType(name as (IdentifierToken | LongIdentifierToken), res, curTok.position);
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
            if (this.checkIdentifierOrLongToken(nextTok)) {
                ++this.position;
                ty = new CustomType(nextTok as (IdentifierToken | LongIdentifierToken), [ty], curTok.position);
                continue;
            }
            return ty;
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
                ++this.position;
                let left = this.parseAtomicPattern();

                this.assertIdentifierOrLongToken(this.currentToken());
                nm = new ValueIdentifier(this.currentToken().position, this.currentToken());

                if (this.state.getIdentifierInformation(this.currentToken()) === undefined
                    || !this.state.getIdentifierInformation(this.currentToken()).infix) {
                    throw new ParserError('"' + this.currentToken().getText()
                        + '" does not have infix status.', this.currentToken().position);
                }
                ++this.position;

                let right = this.parseAtomicPattern();
                args.push(new Tuple(-1, [left, right]));
                this.assertKeywordToken(this.currentToken(), ')');
                ++this.position;
            } else {
                let oldPos = this.position;
                let throwError = false;
                try {
                    let tok = this.parseOpIdentifierToken();
                    nm = new ValueIdentifier(tok.position, tok);
                    if (this.state.getIdentifierInformation(nm.name) !== undefined
                        && this.state.getIdentifierInformation(nm.name).infix
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
                        args.push(pat);
                    }
                } catch (e) {
                    if (throwError) {
                        throw e;
                    }

                    // Again infix
                    this.position = oldPos;
                    let left = this.parseAtomicPattern();

                    this.assertIdentifierOrLongToken(this.currentToken());
                    nm = new ValueIdentifier(this.currentToken().position, this.currentToken());

                    if (this.state.getIdentifierInformation(this.currentToken()) === undefined
                        || !this.state.getIdentifierInformation(this.currentToken()).infix) {
                        throw new ParserError(
                            '"' + this.currentToken().getText() + '" does not have infix status.',
                            this.currentToken().position);
                    }
                    ++this.position;

                    let right = this.parseAtomicPattern();
                    args.push(new Tuple(-1, [left, right]));
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
        while (this.position < this.tokens.length) {
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
            let tyvar = <TypeVariable[]> this.parseTypeVarSequence();
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

            let nstate = this.state;
            this.state = this.state.getNestedState();

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

            let nstate = this.state;
            this.state = this.state.getNestedState();

            let dec: Declaration = this.parseDeclaration();
            this.assertKeywordToken(this.currentToken(), 'in');
            ++this.position;
            let dec2: Declaration = this.parseDeclaration();
            this.assertKeywordToken(this.currentToken(), 'end');
            ++this.position;

            this.state = nstate;

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

                this.state.addIdentifierInformation(
                    <IdentifierToken> this.currentToken(), precedence, false, true);

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

                this.state.addIdentifierInformation(
                    <IdentifierToken> this.currentToken(), precedence, true, true);

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

                this.state.addIdentifierInformation(
                    <IdentifierToken> this.currentToken(), 0, true, false);

                ++this.position;
            }

            if (res.length === 0) {
                throw new ParserError('Empty "nonfix" declaration.',
                                      this.currentToken().position);
            }
            return new NonfixDeclaration(curTok.position, res);
        }

        if (this.checkKeywordToken(curTok, ';')) {
            ++this.position;
            return new EmptyDeclaration();
        }

        let exp = this.parseExpression();
        let valbnd = new ValueBinding(curTok.position, false,
            new ValueIdentifier(-1, new AlphanumericIdentifierToken('it', -1)), exp);
        this.assertKeywordToken(this.currentToken(), ';');
        return new ValueDeclaration(curTok.position, [], [valbnd]);
    }

    private currentToken(): Token {
        if (this.position >= this.tokens.length) {
            throw new IncompleteError(-1, 'More input, I\'m starving. ~nyan.');
        }
        return this.tokens[ this.position ];
    }
}

export function parse(tokens: Token[], state: State): Declaration {
    let p: Parser = new Parser(tokens, state);
    return p.parseDeclaration();
}
