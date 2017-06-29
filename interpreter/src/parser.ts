import { ASTNode } from './ast';
import { Expression, Pattern, Tuple, Constant, ValueIdentifier, Wildcard } from './expressions';
import { Type } from './types';
import { InternalInterpreterError, InterpreterError, IncompleteError, Position } from './errors';
import { Token, KeywordToken, IdentifierToken, ConstantToken } from './lexer';
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

    constructor(private tokens: Token[], /*private*/ state: State) {}

    parseAtomicExpression(): Expression {
        /*
         * atexp ::= scon                           TODO Special Constant
         *           [op] longvid                   ValueIdentifier
         *           { [exprow] }                   exprow
         *           #lab                           TODO record selector
         *           ()                             Tuple
         *           (exp1, …, expn)                Tuple
         *           [exp1, …, expn]                TODO List
         *           (exp1; …; expn)                TODO Sequence
         *           let dec in exp1, …, expn end   TODO local declaration
         *           ( exp )                        Expression
         */
        throw new InternalInterpreterError(0, 'not yet implemented');
    }

    parseExpressionRow(): Expression {
        /*
         * exprow ::= lab = exp [, exprow]          TODO expression row (record)
         */
        throw new InternalInterpreterError(0, 'not yet implemented');
    }

    parseApplicationExpression(): Expression {
        /* appexp ::= atexp
         *            appexp atexp                  TODO ApplicationExpression
         */
        throw new InternalInterpreterError(0, 'not yet implemented');
    }

    parseInfixExpression(): Expression {
        /*
         * infexp ::= appexp
         *            infexp1 vid infexp2           TODO Infix, left/right asso, may have level
         */
        throw new InternalInterpreterError(0, 'not yet implemented');
    }

    parseExpression(): Expression {
        /*
         * exp ::= infexp
         *         exp : ty                         TODO typed (left ass)
         *         exp1 andalso exp2                TODO conjunction
         *         exp1 orelse exp2                 TODO disjunction
         *         exp handle match                 TODO handle expr
         *         raise exp                        TODO raise exception
         *         if exp1 then exp2 else exp3      TODO Conditional
         *         while exp1 do exp2               TODO iteration
         *         case exp of match                TODO case analysis
         *         fn match                         TODO function
         */
        throw new InternalInterpreterError(0, 'not yet implemented');
    }

    parsePatternRow(): Pattern {
        /*
         * patrow ::= ...                   Wildcard
         *            lab = pat [, patrow]
         *            vid [:ty] [as pat] [, patrow]
         */
        throw new InternalInterpreterError(0, 'not yet implemented');

    }

    parseAtomicPattern(): Pattern {
        /*
         * atpat ::= _                      Wildcard
         *           [op] longvid           ValueIdentifier
         *           { [patrow] }           patrow
         *           ()                     Tuple
         *           ( pat1, …, patn )      Tuple
         *           [ pat1, …, patn ]      TODO
         *           ( pat )                pat
         */

        if (this.position >= this.tokens.length) {
            throw new ParserError(-1, 'Unexpected end of token stream');
        }
        let curTok = this.currentToken();
        if (curTok instanceof KeywordToken) {
            if (curTok.text === 'op') {
                ++this.position;
                let nextCurTok = this.currentToken();
                if (nextCurTok instanceof IdentifierToken) {
                    return new ValueIdentifier(curTok.position, nextCurTok);
                }
                // TODO think about checking that the id can be op prefixed
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
                if (!(this.currentToken() instanceof KeywordToken)
                    || this.currentToken().text !== '}') {
                    throw new ParserError('Record pattern missing closing "}"',
                        this.currentToken().position);
                }
                ++this.position;
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
                            return new Tuple(curTok.position, results);
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
        throw new ParserError(curTok.position, 'Expected atomic pattern.');
    }

    parsePattern(): Pattern {
        /*
         *  pat ::= atpat                   atpat
         *          [op] longvid atpat      TODO Constructed value
         *          pat1 vid pat2           TODO Constructed value
         *          pat : ty                TODO typed pattern
         *          [op] vid [:ty] as pat   TODO Layered pattern
         */
        throw new InternalInterpreterError(0, 'not yet implemented');
        let curTok = this.currentToken();
        if (curTok instanceof KeywordToken) {
            if (curTok.text === 'op') {
                if (++this.position === this.tokens.length
                    || !(this.currentToken instanceof IdentifierToken)) {
                    throw new ParserError(curTok.Position, 'expected identifier after op');
                }
                let oldpos = this.position;
                ++this.position;
                try {
                    let atpat = this.parseAtomicPattern();
                    // return
                } catch (ParserError) {
                    throw;
                }
            }
        }
    }

    parseTypeRow(): TypeRow {
        /*
         * tyrow ::= lab : ty [, tyrow]
         */
        throw new InternalInterpreterError(0, 'not det implemented');
    }

    parseType(): Type {
        /*
         * ty ::= tyvar             TODO Type variable
         *        { [tyrow] }       tyrow
         *        ty[] longtycon    TODO type construction
         *        ty1 * … * tyn     TODO Tuple type
         *        ty1 -> ty2        TODO Function type
         *        ( ty )            Type
         */
        throw new InternalInterpreterError(0, 'not yet implemented');
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
