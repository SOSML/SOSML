import { ASTNode } from './ast';
import { Expression, Pattern, Tuple, Constant, ValueIdentifier, Wildcard,
         LayeredPattern, FunctionApplication, TypedExpression, Record, List,
         Sequence, LocalDeclaration, RecordSelector, Lambda, Conjunction,
         Disjunction, Conditional, CaseAnalysis, RaiseException,
         HandleException, Match } from './expressions';
import { Type, RecordType, TypeVariable, TupleType, CustomType, FunctionType } from './types';
import { InternalInterpreterError, InterpreterError, Position } from './errors';
import { Token, KeywordToken, IdentifierToken, ConstantToken,
         TypeVariableToken } from './lexer';
import { State } from './state';

export class ParserError extends InterpreterError {
    constructor(message: string, position: Position) {
        super(message, position);
        Object.setPrototypeOf(this, ParserError.prototype);
    }
}

export class Parser {
    private position: number = 0; // position of the next not yet parsed token
    //    private tmpTree: ASTNode; // Temporary storage for a subtree.

    constructor(private tokens: Token[], private state: State) {}

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
    checkKeywordToken(tok: Token, text: string | undefined = undefined): boolean {
        if (!(tok instanceof KeywordToken)) {
            return false;
        }
        if (text !== undefined && tok.text !== text) {
            return false;
        }
        return true;
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
         *           let dec in exp1, …, expn end   LocalDeclaration(pos, decl:Decl, exp)
         *              KeywordToken dec KeywordToken exp [KeywordToken exp]* KeywordToken
         *           ( exp )                        Expression
         *              KeywordToken exp KeywordToken
         */
        if (this.position >= this.tokens.length) {
            throw new ParserError('Unexpected end of token stream', -1);
        }
        let curTok = this.currentToken();
        if (this.checkKeywordToken(curTok, 'op')) {
            ++this.position;
            let nextCurTok = this.currentToken();

            this.assertIdentifierToken(nextCurTok);

            // TODO check wath happens if the identifier doesn't exist.
            let idInf = this.state.getIdentifierInformation(nextCurTok);
            if (!idInf.infix) {
                throw new ParserError('Cannot use "op" on non-infix identifier', nextCurTok.position);
            }
            return new ValueIdentifier(curTok.position, nextCurTok);
        }
        if (this.checkKeywordToken(curTok, '{')) {
            // Record pattern
            ++this.position;
            let result = this.parseExpressionRow();
            return result;
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
            // TODO think about how to handle changes made to the state.
            let oldState = this.state.clone();
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
            this.state = oldState;
            return new LocalDeclaration(curTok.position, dec, new Sequence(curTok.position, res));
        } else if (curTok instanceof ConstantToken) {
            return new Constant(curTok.position, curTok);
        } else if (curTok instanceof IdentifierToken) {
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
        let res = this.parseAtomicExpression();
        while (true) {
            let oldPos = this.position;
            try {
                let newExp = this.parseAtomicExpression();
                // TODO position
                res = new FunctionApplication(-1, res, newExp);
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
                if (!this.state.getIdentifierInformation(curTok).infix) {
                    // TODO handle case where the identifier doesn't exist
                    break;
                } else {
                    ++this.position;
                    ops.push([curTok, cnt++]);
                }
            } else {
                break;
            }
        }

        ops.sort(([a, p1], [b, p2]) => {
            let sta = this.state.getIdentifierInformation(a);
            let stb = this.state.getIdentifierInformation(b);
            if (sta.precedence > stb.precedence) {
                return -1;
            }
            if (sta.precedence < stb.precedence) {
                return 1;
            }
            if (sta.rightAssociative) {
                if (p1 < p2) {
                    return -1;
                }
                if (p1 > p2) {
                    return 1;
                }
            } else {
                if (p1 < p2) {
                    return 1;
                }
                if (p1 > p2) {
                    return -1;
                }
            }
            return 0;
        });

        // Using copy by reference to make this work whithout shrinking the array
        for (let i = 0; i < ops.length; ++i) {
            let left = exps[ops[i][1]];
            let right = exps[ops[i][1] + 1];
            let com = new FunctionApplication(ops[i][0].position,
                                              new ValueIdentifier(ops[i][0].position, ops[i][0]),
                                              new Tuple(ops[i][0].position, [left, right]));
            exps[ops[i][1]] = com;
            exps[ops[i][1] + 1] = com;
        }
        return exps[0];
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
            if (curTok instanceof KeywordToken && curTok.text === '}') {
                ++this.position;
                return res;
            }
            if (!res.complete) {
                throw new ParserError('Record wildcard must appear as last element of the record.', curTok.position);
            }
            if (!firstIt && curTok instanceof KeywordToken && curTok.text === ',') {
                ++this.position;
                continue;
            }
            firstIt = false;

            if (curTok instanceof KeywordToken && curTok.text === '...') {
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
        if (curTok instanceof KeywordToken) {
            if (curTok.text === 'op') {
                ++this.position;
                let nextCurTok = this.currentToken();

                if (nextCurTok instanceof IdentifierToken) {
                    // TODO check wath happens if the identifier doesn't exist.
                    let idInf = this.state.getIdentifierInformation(nextCurTok);
                    if (!idInf.infix) {
                        throw new ParserError('Cannot use "op" on non-infix identifier', nextCurTok.position);
                    }
                    return new ValueIdentifier(curTok.position, nextCurTok);
                }
                throw new ParserError('Expected identifier after op',
                                      nextCurTok.position);
            }
            if (curTok.text === '_') {
                // Wildcard pattern
                ++this.position;
                return new Wildcard(curTok.position);
            }
            if (curTok.text === '{') {
                // Record pattern
                ++this.position;
                let result = this.parsePatternRow();
                return result;
            }
            if (curTok.text === '(') {
                // Tuple pattern
                let results: Pattern[] = [];
                let length: number = 0;
                while (true) {
                    let nextCurTok = this.currentToken();
                    if (nextCurTok instanceof KeywordToken) {
                        if (nextCurTok.text === '('
                            && length === 0) {
                            ++this.position;
                        } else if (nextCurTok.text === ','
                            && length > 0) {
                            ++this.position;
                        } else if (nextCurTok.text === ')') {
                            ++this.position;
                            if (length === 1) {
                                return results[0];
                            } else {
                                return new Tuple(curTok.position, results);
                            }
                        } else {
                            throw new ParserError('Expected "," or ")".', nextCurTok.position);
                        }
                    } else {
                        throw new ParserError('Expected "," or ")".', nextCurTok.position);
                    }
                    results.push(this.parsePattern());
                    length++;
                }
            }
            if (curTok.text === '[') {
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
                            // TODO this oughtn't be a tuple
                            return new List(curTok.position, results);
                        } else {
                            throw new ParserError('Expected "," or "]".', nextCurTok.position);
                        }
                    } else {
                        throw new ParserError('Expected "," or "]".', nextCurTok.position);
                    }
                    results.push(this.parsePattern());
                }
            }
        }else if (curTok instanceof ConstantToken) {
            return new Constant(curTok.position, curTok);
        } else if (curTok instanceof IdentifierToken) {
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
        if (curTok instanceof KeywordToken) {
            if (curTok.text === 'op') {
                let oldPos = this.position;
                ++this.position;
                let nextTok = this.currentToken();
                if (!(nextTok instanceof IdentifierToken)) {
                    throw new ParserError('Expected identifier after "op".', nextTok.position);
                } else if (!this.state.getIdentifierInformation(nextTok).infix) {
                    throw new ParserError('Cannot "op" prefix non-infix id.', nextTok.position);
                }
                ++this.position;
                try {
                    // Check whether layered pattern
                    let newTok = this.currentToken();
                    if (newTok instanceof KeywordToken) {
                        let tp: Type | undefined;
                        if (newTok.text === ':') {
                            ++this.position;
                            tp = this.parseType();
                            newTok = this.currentToken();
                        }
                        if (!(newTok instanceof KeywordToken)
                            || !(newTok.text === 'as')) {
                            throw new ParserError('Expected "as" keyword.', newTok.position);
                        }
                        ++this.position;
                        return new LayeredPattern(curTok.position,
                                                  nextTok,
                                                  tp,
                                                  this.parsePattern());
                    }

                    // Try if it is a FunctionApplication instead
                    return new FunctionApplication(curTok.position,
                                                   new ValueIdentifier(nextTok.position, nextTok),
                                                   this.parseAtomicPattern());
                } catch (ParserError) {
                    this.position = oldPos;
                    return this.parseAtomicPattern();
                }
            }
        }
        if (curTok instanceof IdentifierToken) {
            let oldPos = this.position;
            ++this.position;
            try {
                // Check whether layered pattern
                let newTok = this.currentToken();
                if (newTok instanceof KeywordToken) {
                    let tp: Type | undefined;
                    if (newTok.text === ':') {
                        ++this.position;
                        tp = this.parseType();
                        newTok = this.currentToken();
                    }
                    if (!(newTok instanceof KeywordToken)
                        || !(newTok.text === 'as')) {
                        throw new ParserError('Expected "as" keyword.', newTok.position);
                    }
                    ++this.position;
                    return new LayeredPattern(curTok.position,
                        curTok,
                        tp,
                        this.parsePattern());
                }

                // Try if it is a FunctionApplication instead
                return new FunctionApplication(curTok.position,
                    new ValueIdentifier(curTok.position, curTok),
                    this.parseAtomicPattern());
            } catch (ParserError) {
                this.position = oldPos;
                return this.parseAtomicPattern();
            }
        }

        let res = this.parseAtomicPattern();
        curTok = this.currentToken();
        if (curTok instanceof KeywordToken && curTok.text === ':') {
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
                if (!this.state.getIdentifierInformation(curTok).infix) {
                    // TODO handle case where the identifier doesn't exist
                    break;
                } else {
                    ++this.position;
                    ops.push([curTok, cnt++]);
                }
            } else {
                break;
            }
        }

        ops.sort(([a, p1], [b, p2]) => {
            let sta = this.state.getIdentifierInformation(a);
            let stb = this.state.getIdentifierInformation(b);
            if (sta.precedence > stb.precedence) {
                return -1;
            }
            if (sta.precedence < stb.precedence) {
                return 1;
            }
            if (sta.rightAssociative) {
                if (p1 < p2) {
                    return -1;
                }
                if (p1 > p2) {
                    return 1;
                }
            } else {
                if (p1 < p2) {
                    return 1;
                }
                if (p1 > p2) {
                    return -1;
                }
            }
            return 0;
        });

        // Using copy by reference to make this work whithout shrinking the array
        for (let i = 0; i < ops.length; ++i) {
            let left = pats[ops[i][1]];
            let right = pats[ops[i][1] + 1];
            let com = new FunctionApplication(ops[i][0].position,
                                              new ValueIdentifier(ops[i][0].position, ops[i][0]),
                                              new Tuple(ops[i][0].position, [left, right]));
            pats[ops[i][1]] = com;
            pats[ops[i][1] + 1] = com;
        }
        return pats[0];
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
            if (curTok instanceof KeywordToken && curTok.text === '}') {
                ++this.position;
                return res;
            }
            if (!firstIt && curTok instanceof KeywordToken && curTok.text === ',') {
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
            // TODO Nicely handle long identifiers
            if (!(curTok instanceof IdentifierToken)) {
                throw new ParserError('Expected an identifier', curTok.position);
            }
            ++this.position;
            // TODO replace the string arg with something more sensible
            return new CustomType(curTok.position, curTok.text, tyvars);
        }

        if (curTok instanceof KeywordToken) {
            if (curTok.text === '{') {
                ++this.position;
                return this.parseTypeRow();
            }
            if (curTok.text === '(') {
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
        throw new ParserError('Expected a simple type.', curTok.position);
    }

    parseArrowType(): Type {
        /*
         * ty ::= ty1 -> ty2        Function(param:Type, return:Type)
         */
        let curTy = this.parseSimpleType();
        let curTok = this.currentToken();
        if (!(curTok instanceof KeywordToken)
            || curTok.text !== '->') {
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
        while (curTok instanceof KeywordToken && curTok.text === '*') {
            ++this.position;
            curTy.push(this.parseArrowType());
        }
        return new TupleType(pos, curTy);
    }

    parseDeclaration(): ASTNode {
        /*
         * dec ::= val tyverseq valbind                 TODO value declaration
         *         fun tyvarseq fvalbind                TODO function declaration
         *         type typbind                         TODO type declaration
         *         datatype datbind [withtype typbind]  TODO datatype declaration
         *         abstype datbind [withtype typbind]
         *              with dec end                    TODO abstype declaration
         *         exception axbind                     TODO exception declaration
         *         local dec1 in dec2 end               TODO local declaration
         *         open longstrid1 … longstr1dn         TODO open declaration
         *         infix [d] vid1 … vidn                TODO infix L
         *         infixr [d] vid1 … vidn               TODO infix R
         *         nonfix vid1 … vidn                   TODO nonfix
         */
        throw new InternalInterpreterError(0, 'not yet implemented');
    }

    finished(): boolean {
        return this.position === this.tokens.length;
    }

    private currentToken(): Token {
        return this.tokens[ this.position ];
    }
}

export function parse(tokens: Token[], state: State): ASTNode[] {
    let p: Parser = new Parser(tokens, state);
    let result: ASTNode[] = [];
    while (!p.finished()) {
        result.push(p.parseDeclaration());
    }
    return result;
}
