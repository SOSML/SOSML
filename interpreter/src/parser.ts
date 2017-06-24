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

    private currentToken(): Token {
        return this.tokens[ this.position ];
    }

    parseExpression(): Expression {
        throw new InternalInterpreterError(0, 'not yet implemented');
    }

    parsePatternRow(): Pattern {
        throw new InternalInterpreterError(0, 'not yet implemented');

    }

    parseAtomicPattern(): Pattern {
		if (this.position >= this.tokens.length) {
            throw new IncompleteError(-1);
        }
        let curTok = this.currentToken();
        if (curTok instanceof KeywordToken) {
            if (curTok.text === "op") {
                ++this.position;
                let nextCurTok = this.currentToken();
                if (nextCurTok instanceof IdentifierToken) {
                    return new ValueIdentifier(curTok.position, nextCurTok);
                }
                // TODO think about checking that the id can be op prefixed
                throw new ParserError("Expected identifier after op",
                    nextCurTok.position);
            }
            if (curTok.text === "_") {
                // Wildcard pattern
                ++this.position;
                return new Wildcard(curTok.position);
            }
            if (curTok.text === "{") {
                // Record pattern
                ++this.position;
                let result = this.parsePatternRow();
                if (!(this.currentToken() instanceof KeywordToken)
                    || this.currentToken().text !== "}") {
                    throw new ParserError("Record pattern missing closing '}'",
                        this.currentToken().position);
                }
                ++this.position;
                return result;
            }
            if (curTok.text === "(") {
                // Tuple pattern
                let results: Pattern[] = [];
                let length: number = 0;
                while (true) {
                    let nextCurTok = this.currentToken();
                    if (nextCurTok instanceof KeywordToken) {
                        if (nextCurTok.text === "("
                            && length === 0) {
                            ++this.position;
                        } else if (nextCurTok.text === ","
                            && length > 0) {
                            ++this.position;
                        } else if (nextCurTok.text === ")") {
                            ++this.position;
                            if (length === 1) {
                                return results[0];
                            } else {
                                return new Tuple(curTok.position, results);
                            }
                        } else {
                            throw new ParserError("Expected ',' or ')'.", nextCurTok.position);
                        }
                    } else {
                        throw new ParserError("Expected ',' or ')'.", nextCurTok.position);
                    }
                    results.push(this.parsePattern());
                    length++;
                }
            }
            if (curTok.text === "[") {
                // List pattern
                let results: Pattern[] = [];
                while (true) {
                    let nextCurTok = this.currentToken();
                    if (nextCurTok instanceof KeywordToken) {
                        if (nextCurTok.text === "[" && length === 0) {
                            ++this.position;
                        } else if (nextCurTok.text === "," && length > 0) {
                            ++this.position;
                        } else if (nextCurTok.text === "]") {
                            ++this.position;
                            return new Tuple(curTok.position, results);
                        } else {
                            throw new ParserError("Expected ',' or ']'.", nextCurTok.position);
                        }
                    } else {
                        throw new ParserError("Expected ',' or ']'.", nextCurTok.position);
                    }
                    results.push(this.parsePattern());
                }
            }
        } else if (curTok instanceof ConstantToken) {
            return new Constant(curTok.position, curTok);
        }

        throw new ParserError("Expected atomic pattern start.", curTok.position);
    }

    parsePattern(): Pattern {
        throw new InternalInterpreterError(0, 'not yet implemented');

    }

    parseType(): Type {
        throw new InternalInterpreterError(0, 'not yet implemented');
    }

    parseDeclaration(): ASTNode {
        throw new InternalInterpreterError(0, 'not yet implemented');
    }

    finished(): boolean {
        return this.position === this.tokens.length;
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
