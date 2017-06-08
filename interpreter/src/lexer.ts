/*
 * TODO: Documentation for the lexer
 */

import {CompilerError, InternalCompilerError} from './errors';

// SML uses these types and we may have to emulate them more closely, in particular int
export type char = string;
export type int = number;

export interface Token {
    text: string;
    // TODO: add position
}

export class KeywordToken implements Token { constructor(public text: string) {} }
export class IdentifierToken implements Token { constructor(public text: string) {} }
export class IntegerConstantToken implements Token { constructor(public text: string, public value: int) {} }
export class RealConstantToken implements Token { constructor(public text: string, public value: number) {} }
export class WordConstantToken implements Token { constructor(public text: string, public value: int) {} }
export class CharacterConstantToken implements Token { constructor(public text: string, public value: char) {} }
export class StringConstantToken implements Token { constructor(public text: string, public value: string) {} }

// A star (*) can be used as an identifier in most, but not all places and thus must be separated.
// See SML definition, chapter 2.4 Identifiers
export class StarToken implements Token { public text: string = '*'; }

// Reserved words are generally not allowed as identifiers. "The only exception to this rule is that the symbol = ,
// which is a reserved word, is also allowed as an identifier to stand for the equality predicate.
// The identifier = may not be re-bound; this precludes any syntactic ambiguity." (Definition of SML, page 5)
export class EqualsToken implements Token { public text: string = '='; }

// A numeric constant not starting with 0
// Unlike other Integer constants, it can be used as a record label instead of a normal identifier.
export class NumericToken extends IntegerConstantToken {
    constructor(text: string, value: int) { super(text, value); }
}

// TODO: move this somewhere else, derive it from some general CompilerError class and give it an error message.
class LexerError extends CompilerError {
    constructor(message: string, position: number) { super(message, position); }
}

// TODO: maybe these should be static class members
let reservedWords: Set<string> = new Set<string>([
    'abstype', 'and', 'andalso', 'as', 'case', 'datatype', 'do', 'else', 'end', 'exception', 'fn', 'fun', 'handle',
    'if', 'in', 'infix', 'infixr', 'let', 'local', 'nonfix', 'of', 'op', 'open', 'orelse', 'raise', 'rec', 'then',
    'type', 'val', 'with', 'withtype', 'while',
    '(', ')', '[', ']', '{', '}', ',', ':', ';', '...', '_', '|', '=', '=>', '->', '#',
    'eqtype', 'functor', 'signature', 'struct', 'include', 'sharing', 'structure', 'where', 'sig', ':>'
]);
let symbolicCharacters: Set<string> = new Set<string>([
    '!', '%', '&', '$', '#', '+', '-', '/', ':', '<', '=', '>', '?', '@', '\'', '~', '`', '^', '|', '*'
]);

class Lexer {
    position: number = 0;
    tokenStart: number;
    input: string;

    static isAlphanumeric(c: char): boolean {
        return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c === '\'' || c === '_';
    }

    static isSymbolic(c: char): boolean {
        return symbolicCharacters.has(c);
    }

    static isWhitespace(c: char): boolean {
        return c === ' ' || c === '\t' || c === '\n' || c === '\f';
    }

    static isNumber(c: char, hexadecimal: boolean): boolean {
        return (c >= '0' && c <= '9') || (hexadecimal && ((c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')));
    }

    constructor(input: string) {
        this.input = input;
        this.skipWhitespaceAndComments();
    }

    consumeChar(): char {
        if (this.position >= this.input.length) {
            // TOOD: should throw an IncompleteError, not a LexerError
            throw new LexerError('unexpected end of input', this.position);
        }
        ++this.position;
        return this.input.charAt(this.position - 1);
    }

    getChar(offset: number = 0): char {
        if (this.position + offset >= this.input.length) {
            // This must be any character that has no syntactic meaning in SML. It may not be counted as whitespace.
            return '\x04'; // End of Transmission character
        } else {
            return this.input.charAt(this.position + offset);
        }
    }

    skipWhitespace(): void {
        while (Lexer.isWhitespace(this.getChar())) {
            ++this.position;
        }
    }

    skipWhitespaceAndComments(): void {
        let oldPosition: number;
        do {
            oldPosition = this.position;

            this.skipWhitespace();

            while (this.position + 1 < this.input.length && this.input.substr(this.position, 2) === '(*') {
                let commentStart = this.position;
                this.position += 2;
                let openComments: number = 1;

                while (openComments > 0) {
                    if (this.position > this.input.length - 2) {
                        // TOOD: should be IncompleteError, not LexerError
                        throw new LexerError('unclosed comment', commentStart);
                    }

                    let s: string = this.input.substr(this.position, 2);
                    if (s === '(*') {
                        ++openComments;
                        ++this.position;
                    } else if (s === '*)') {
                        --openComments;
                        ++this.position;
                    }

                    ++this.position;
                }
            }
        } while (this.position !== oldPosition);
        this.tokenStart = this.position;
    }

    /* Reads a sequence of digits. Sign, exponent etc. are handled by lexNumber. Accepts leading zeros.
     */
    readNumeric(hexadecimal: boolean, maxLength: number = -1): string {
        let result: string = '';
        while (Lexer.isNumber(this.getChar(), hexadecimal) && result.length !== maxLength) {
            result += this.consumeChar();
        }
        if (result === '') {
            throw new InternalCompilerError(this.position);
        }
        return result;
    }

    makeNumberToken(value: string, startPosition: number, real: boolean = false, word: boolean = false,
                    hexadecimal: boolean = false): Token {
        if (real && word) {
            throw new InternalCompilerError(this.position);
        }
        let token: string = this.input.substring(startPosition, this.position);
        if (real) {
            return new RealConstantToken(token, parseFloat(value));
        }
        let v: int = parseInt(value, hexadecimal ? 16 : 10);
        if (word) {
            return new WordConstantToken(token, v);
        } else {
            let firstChar = token.charAt(0);
            if (Lexer.isNumber(firstChar, false) && firstChar !== '0') {
                return new NumericToken(token, v);
            } else {
                return new IntegerConstantToken(token, v);
            }
        }
    }

    lexNumber(): Token {
        // TODO: an Integer constant could also be a record label
        let startPosition: number = this.position;
        let value: string = '';
        let hexadecimal: boolean = false;
        let word: boolean = false;
        let real: boolean = false;
        let negative: boolean = false;

        if (this.getChar() === '~') {
            ++this.position;
            negative = true;
            value += '-';
        }

        if (this.getChar() === '0' && (this.getChar(1) === 'w' || this.getChar(1) === 'x')) {
            ++this.position;
            if (this.getChar() === 'w') {
                word = true;
            }
            if (this.getChar(word ? 1 : 0) === 'x') {
                hexadecimal = true;
            }
            let nextDigitOffset = (word && hexadecimal) ? 2 : 1;
            if ((negative && word) || !Lexer.isNumber(this.getChar(nextDigitOffset), hexadecimal)) {
                // The 'w' or 'x' is not part of the number
                value += '0';
                return this.makeNumberToken(value, startPosition, false,  false, false);
            }
            this.position += nextDigitOffset;
        }

        value += this.readNumeric(hexadecimal);
        if (hexadecimal || word) {
            return this.makeNumberToken(value, startPosition, false, word, hexadecimal);
        }

        if (this.getChar() === '.') {
            if (Lexer.isNumber(this.getChar(1), false)) {
                value += this.consumeChar();
                value += this.readNumeric(false);
            } else {
                return this.makeNumberToken(value, startPosition);
            }
            real = true;
        }

        if (this.getChar() === 'e' || this.getChar() === 'E') {
            if (Lexer.isNumber(this.getChar(1), false)) {
                value += 'e';
                ++this.position;
                value += this.readNumeric(false);
            } else if (this.getChar(1) === '~' && Lexer.isNumber(this.getChar(2), false)) {
                value += 'e-';
                this.position += 2;
                value += this.readNumeric(false);
            } else {
                return this.makeNumberToken(value, startPosition);
            }
            real = true;
        }

        return this.makeNumberToken(value, startPosition, real);
    }

    lexString(): StringConstantToken {
        let startPosition: number = this.position;
        if (this.consumeChar() !== '"') {
            throw new InternalCompilerError(this.position);
        }
        let value: string = '';

        while (this.getChar() !== '"') {
            if (this.getChar() === '\\') {
                ++this.position;
                if (Lexer.isWhitespace(this.getChar())) {
                   this.skipWhitespace();
                   if (this.consumeChar() !== '\\') {
                       throw new LexerError('only whitespace is allowed in whitespace escape sequence',
                           this.position - 1);
                   }
                } else {
                    let c: char = this.consumeChar();
                    switch (c) {
                        case 'a': value += '\a'; break;
                        case 'b': value += '\b'; break;
                        case 't': value += '\t'; break;
                        case 'n': value += '\n'; break;
                        case 'v': value += '\v'; break;
                        case 'f': value += '\f'; break;
                        case 'r': value += '\r'; break;
                        case '"': value += '"'; break;
                        case '\\': value += '\\'; break;
                        case '^': {
                            let cc: number = this.consumeChar().charCodeAt(0);
                            if (cc < 64 || cc > 95) {
                                throw new LexerError('"' + String.fromCharCode(cc) +
                                    '" does not represent a valid control character', this.position - 1);
                            }
                            value += String.fromCharCode(cc - 64);
                            break;
                        }
                        case 'u': {
                            let s: string = this.readNumeric(false, 4);
                            if (s.length !== 4) {
                                throw new LexerError('unicode escape sequence must have four digits',
                                    this.position - s.length - 1);
                            }
                            let v: number = parseInt(s, 16);
                            if (v >= 256) {
                                throw new LexerError('character code ' + s + ' is too large, only 00 to ff is allowed',
                                    this.position - s.length - 1);
                            } // TODO: remove?
                            value += String.fromCharCode(v);
                            break;
                        }
                        default: {
                            let s: string = this.readNumeric(false, 3);
                            if (s.length !== 3) {
                                if (s.length === 0) {
                                    throw new LexerError('invalid escape sequence', this.position - 1);
                                } else {
                                    throw new LexerError('numeric escape sequence must have three digits',
                                        this.position - s.length - 1);
                                }
                            }
                            let v: number = parseInt(s, 10);
                            if (v >= 256) {
                                throw new LexerError('character code ' + s +
                                    ' is too large, only 000 to 255 is allowed', this.position - s.length - 1);
                            } // TODO: remove?
                            value += String.fromCharCode(v);
                            break;
                        }
                    }
                }

            } else {
                let c: number = this.consumeChar().charCodeAt(0);
                // Only printable characters (33 to 126) and spaces are allowed (SML definition, chapter 2.2)
                // We however also allow all non-ASCII characters (>128), since MosML and SML/NJ seem to do so as well.
                if ((c < 33 || c > 126) && c !== 32 /*space*/ && c < 128) {
                    // invalid characters are not printable, so we should print its code rather than the character
                    throw new LexerError('invalid character with code ' + c + ' in string', this.position - 1);
                }
                value += String.fromCharCode(c);
            }
        }

        if (this.consumeChar() !== '"') {
            throw new LexerError('unterminated string', this.tokenStart);
        }
        return new StringConstantToken(this.input.substring(startPosition, this.position), value);
    }

    lexCharacter(): CharacterConstantToken {
        if (this.consumeChar() !== '#') {
            throw new InternalCompilerError(this.position);
        }
        let t: StringConstantToken = this.lexString();
        if (t.value.length !== 1) {
            throw new LexerError('character constant must have length 1, not ' + t.value.length, this.tokenStart);
        }
        return new CharacterConstantToken(t.text, t.value);
    }

    lexIdentifierOrKeyword(): Token {
        // Both identifiers and keywords can be either symbolic (consisting only of the characters
        // ! % & $ # + - / : < = > ? @ \ ~ ‘ ^ | *
        // or alphanumeric (consisting only of letters, digits, ' or _).
        // We first need to figure out which of these types the token belongs to, then find the longest possible token
        // of that type at this position and lastly check whether it is a reserved word.

        let token: string = '';

        let charChecker: (c: char) => boolean;
        let c: char = this.getChar();
        if (Lexer.isSymbolic(c)) {
            charChecker = Lexer.isSymbolic;
        } else if (Lexer.isAlphanumeric(c)) {
            charChecker = Lexer.isAlphanumeric;
        } else if (reservedWords.has(c)) {
            return new KeywordToken(this.consumeChar());
        } else if (c === '.' && this.getChar(1) === '.' && this.getChar(2) === '.') {
            this.position += 3;
            return new KeywordToken('...');
        } else {
            if (c.charCodeAt(0) < 32) {
                throw new LexerError('invalid character with ascii code ' + c.charCodeAt(0), this.position);
            } else {
                throw new LexerError('invalid token: ' + c, this.position);
            }
        }

        while (true) {
            do {
                c = this.consumeChar();
                token += c;
            } while (charChecker(this.getChar()));

            if (this.getChar() === '.') {
                token += this.consumeChar();
            } else {
                break;
            }
        }

        if (token === '*') {
            return new StarToken();
        } else if (token === '=') {
            return new EqualsToken();
        } else if (reservedWords.has(token)) {
            return new KeywordToken(token);
        } else {
            return new IdentifierToken(token);
        }
    }

    nextToken(): Token {
        let token: Token;
        this.tokenStart = this.position;
        if (Lexer.isNumber(this.getChar(), false)
            || (this.getChar() === '~' && Lexer.isNumber(this.getChar(1), false))) {
            token = this.lexNumber();
        } else if (this.getChar() === '"') {
            token = this.lexString();
        } else if (this.getChar() === '#' && this.getChar(1) === '"') {
            token = this.lexCharacter();
        } else {
            token = this.lexIdentifierOrKeyword();
        }
        this.skipWhitespaceAndComments();
        return token;
    }

    finished(): boolean {
        return this.position >= this.input.length;
    }
}

export function lex(s: string): Token[] {
    let l: Lexer = new Lexer(s);
    let result: Token[] = [];
    while (!l.finished()) {
        result.push(l.nextToken());
    }
    return result;
}
