/*
 * TODO: Documentation for the lexer
 */

// SML uses these types and we may have to emulate them more closely, in particular int
export type char = string;
export type int = number;

export class KeywordToken { constructor(public text: string) {} }
export class IdentifierToken { constructor(public text: string) {} }
export class IntegerConstantToken { constructor(public text: string, public value: int) {} }
export class RealConstantToken { constructor(public text: string, public value: number) {} }
export class WordConstantToken { constructor(public text: string, public value: int) {} }
export class CharacterConstantToken { constructor(public text: string, public value: char) {} }
export class StringConstantToken { constructor(public text: string, public value: string) {} }
export class ErrorToken { constructor(public text: string = "") {} }

export type Token = KeywordToken | IdentifierToken | IntegerConstantToken | RealConstantToken | WordConstantToken |
    CharacterConstantToken | StringConstantToken | ErrorToken;


// TODO: potentially move this somewhere else, derive it from some general CompilerError class and give it an error message.
class LexerError extends Error {
    constructor() {
        super("Lexer error");
    }
}

// TODO: maybe these should be static class members
let reservedWords: Set<string> = new Set<string>([
    "abstype", "and", "andalso", "as", "case", "datatype", "do", "else", "end", "exception", "fn", "fun", "handle",
    "if", "in", "infix", "infixr", "let", "local", "nonfix", "of", "op", "open", "orelse", "raise", "rec", "then",
    "type", "val", "with", "withtype", "while",
    "(", ")", "[", "]", "{", "}", ",", ":", ";", "...", "_", "|", "=", "=>", "->", "#"
]);
let symbolicCharacters: Set<string> = new Set<string>([
    '!', '%', '&', '$', '#', '+', '-', '/', ':', '<', '=', '>', '?', '@', '\'', '~', '`', '^', '|', '*'
]);

class Lexer {
    constructor(input: string) {
        this.input = input;
        this.skipWhitespaceAndComments();
    }

    position: number = 0;
    input: string;

    consumeChar(): char {
        if (this.position >= this.input.length) throw new LexerError();
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

    isAlphanumeric(c: char): boolean {
        if (c >= 'a' && c <= 'z') return true;
        if (c >= 'A' && c <= 'Z') return true;
        if (c >= '0' && c <= '9') return true;
        return c == '\'' || c == '_';
    }

    isSymbolic(c: char): boolean {
        return symbolicCharacters.has(c);
    }

    isWhitespace(c: char): boolean {
        return c == ' ' || c == '\t' || c == '\n' || c == '\f';
    }

    skipWhitespace(): void {
        while (this.isWhitespace(this.getChar())) ++this.position;
    }

    skipWhitespaceAndComments(): void {
        let oldPosition: number;
        do {
            oldPosition = this.position;

            this.skipWhitespace();

            while (this.position + 1 < this.input.length && this.input.substr(this.position, 2) === '(*') {
                this.position += 2;
                let openComments: number = 1;

                while (openComments > 0) {
                    if (this.position > this.input.length - 2) throw new LexerError();

                    let s: string = this.input.substr(this.position, 2);
                    if (s == '(*') {
                        ++openComments;
                        ++this.position;
                    } else if (s == '*)') {
                        --openComments;
                        ++this.position;
                    }

                    ++this.position;
                }
            }
        } while (this.position != oldPosition)
    }

    isNumber(c: char, hexadecimal: boolean): boolean {
        if (c >= '0' && c <= '9') return true;
        else return hexadecimal && ((c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F'));
    }

    /* Reads a sequence of digits. Sign, exponent etc. are handled by lexNumber.
     */
    readNumeric(hexadecimal: boolean, maxLength: number = -1): string {
        let result: string = "";
        while (this.isNumber(this.getChar(), hexadecimal) && result.length != -1) {
            result += this.consumeChar();
        }
        if (result == "") {
            // TODO: maybe this is an internal compiler error
            throw new LexerError();
        }
        return result;
    }

    makeNumberToken(value: string, startPosition: number, real: boolean = false, word: boolean = false, hexadecimal: boolean = false): Token {
        if (real && word) throw  new LexerError();
        let token: string = this.input.substring(startPosition, this.position);
        if (real) return new RealConstantToken(token, parseFloat(value));
        let v: int = parseInt(value, hexadecimal ? 16 : 10);
        if (word) return new WordConstantToken(token, v);
        else return new IntegerConstantToken(token, v);
    }

    lexNumber(): Token {
        // TODO: an Integer constant could also be a record label
        let startPosition: number = this.position;
        let value: string = "";
        let hexadecimal: boolean = false;
        let word: boolean = false;
        let real: boolean = false;

        if (this.getChar() == '~') {
            ++this.position;
            value += "-";
        }

        if (this.getChar() == '0' && (this.getChar() == 'w' || this.getChar() == 'x')) {
            ++this.position;
            if (this.getChar() == 'w') {
                word = true;
                ++this.position;
            }
            if (this.getChar() == 'x') {
                hexadecimal = true;
                ++this.position;
            }
        }

        value += this.readNumeric(hexadecimal);
        if (hexadecimal || word) return this.makeNumberToken(value, startPosition, false, word, hexadecimal);

        if (this.getChar() == '.') {
            if (this.isNumber(this.getChar(1), false)) {
                value += this.consumeChar();
                value += this.readNumeric(false);
            } else {
                return this.makeNumberToken(value, startPosition);
            }
            real = true;
        }

        if (this.getChar() == 'e' || this.getChar() == 'E') {
            if (this.isNumber(this.getChar(1), false)) {
                value += 'e';
                ++this.position;
                value += this.readNumeric(false);
            } else if (this.getChar(1) == '~' && this.isNumber(this.getChar(2), false)) {
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
        if (this.consumeChar() != '"') throw new LexerError(); // TODO: internal compiler error?
        let startPosition: number = this.position;
        let value: string = "";

        while (this.getChar() != '"') {
            if (this.getChar() == '\\') {
                ++this.position;
                if (this.isWhitespace(this.getChar())) {
                   this.skipWhitespace();
                   if (this.consumeChar() != '\\') throw new LexerError();
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
                            if (cc < 64 || cc > 95) throw new LexerError();
                            value += String.fromCharCode(cc - 64);
                            break;
                        }
                        case 'u': {
                            let s: string = this.readNumeric(false, 4);
                            if (s.length != 4) throw new LexerError();
                            let v: number = parseInt(s, 16);
                            if (v >= 256) throw new LexerError(); // TODO: remove?
                            value += String.fromCharCode(v);
                            break;
                        }
                        default: {
                            let s: string = this.readNumeric(false, 3);
                            if (s.length != 3) throw new LexerError();
                            let v: number = parseInt(s, 10);
                            if (v >= 256) throw new LexerError(); // TODO: remove?
                            value += String.fromCharCode(v);
                            break;
                        }
                    }
                }

            } else {
                let c: number = this.consumeChar().charCodeAt(0);
                // Only printable characters (33 to 126) and spaces are allowed according to the SML definition, chapter 2.2
                // We however also allow all non-ASCII characters (>128), since MosML and SML/NJ seem to do so as well.
                if ((c < 33 || c > 126) && c != 32 /*space*/ && c < 128) throw new LexerError();
                value += String.fromCharCode(c);
            }
        }

        if (this.consumeChar() != '"') throw new LexerError();
        return new StringConstantToken(this.input.substring(startPosition, this.position), value);
    }

    lexCharacter(): CharacterConstantToken {
        if (this.consumeChar() != '#') throw new LexerError(); // TODO: internal compiler error?
        let t: StringConstantToken = this.lexString();
        if (t.value.length != 1) throw new LexerError();
        return new CharacterConstantToken(t.text, t.value);
    }

    lexIdentifierOrKeyword(): Token {
        // Both identifiers and keywords can be either symbolic (consisting only of the characters
        // ! % & $ # + - / : < = > ? @ \ ~ ‘ ^ | *
        // or alphanumeric (consisting only of letters, digits, ' or _).
        // We first need to figure out which of these types the token belongs to, then find the longest possible token
        // of that type at this position and lastly check whether it is a reserved word.

        let token: string = "";

        let charChecker: (c: char) => boolean;
        let c: char = this.getChar();
        if (this.isSymbolic(c)) charChecker = this.isSymbolic;
        else if (this.isAlphanumeric(c)) charChecker = this.isAlphanumeric;
        else if (reservedWords.has(c)) return new KeywordToken(this.consumeChar());
        else throw new LexerError();

        while (true) {
            do {
                c = this.getChar();
                token += c;
                ++this.position;
            } while (charChecker(this.getChar()))

            if (this.getChar() == '.') token += this.consumeChar();
            else break;
        }

        // TODO:
        // "The only exception to this rule is that the symbol = , which is a reserved word, is also allowed as an identifier to
        // stand for the equality predicate. The identifier = may not be re-bound; this precludes any syntactic ambiguity." (Definition of SML, page 5)
        // TODO: "* is excluded from TyCon"
        if (reservedWords.has(token)) return new KeywordToken(token);
        else return new IdentifierToken(token);
    }

    nextToken(): Token {
        let token: Token;
        if (this.isNumber(this.getChar(), false) || (this.getChar() == '~' && this.isNumber(this.getChar(1), false))) {
            token = this.lexNumber();
        } else if (this.getChar() == "\"") {
            token = this.lexString();
        } else if (this.getChar() == "#" && this.getChar(1) == "\"") {
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
