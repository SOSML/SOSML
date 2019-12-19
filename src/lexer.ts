import { LexerError, InternalInterpreterError, IncompleteError } from './errors';
import { int, char, Token, KeywordToken, WordConstantToken, CharacterConstantToken,
         StringConstantToken, IdentifierToken, AlphanumericIdentifierToken, TypeVariableToken,
         EqualityTypeVariableToken, StarToken, EqualsToken, NumericToken, LongIdentifierToken,
         RealConstantToken, IntegerConstantToken, CommentToken } from './tokens';
import { MAXINT, MININT } from './values';
import { InterpreterOptions } from './main';

let reservedWords: Set<string> = new Set<string>([
    'abstype', 'and', 'andalso', 'as', 'case', 'datatype', 'do', 'else', 'end', 'exception', 'fn',
    'fun', 'handle', 'if', 'in', 'infix', 'infixr', 'let', 'local', 'nonfix', 'of', 'op', 'open',
    'orelse', 'raise', 'rec', 'then', 'type', 'val', 'with', 'withtype', 'while',
    '(', ')', '[', ']', '{', '}', ',', ':', ';', '...', '_', '|', '=', '=>', '->', '#',
    'eqtype', 'functor', 'signature', 'struct', 'include', 'sharing', 'structure', 'where',
    'sig', ':>'
]);
let symbolicCharacters: Set<string> = new Set<string>([
    '!', '%', '&', '$', '#', '+', '-', '/', ':', '<',
    '=', '>', '?', '@', '\\', '~', '`', '^', '|', '*'
]);

let unicodeKeywords: Map<string, string> = new Map<string, string>([
    ['→', '->'], ['Λ', 'fn']
]);

let unicodeTyVarNames: Map<string, string> = new Map<string, string>([
    ['α', '\'a'], ['β', '\'b'], ['γ', '\'c'], ['δ', '\'d'], ['ε', '\'e'], ['ζ', '\'f'],
    ['η', '\'g'], ['θ', '\'h'], ['ι', '\'i'], ['κ', '\'k'], ['λ', '\'l'], ['μ', '\'m'],
    ['ν', '\'n'], ['ξ', '\'j'], ['ο', '\'o'], ['π', '\'p'], ['ρ', '\'r'], ['σ', '\'s'],
    ['τ', '\'t'], ['υ', '\'u'], ['φ', '\'v'], ['χ', '\'x'], ['ψ', '\'q'], ['ω', '\'w']
]);

export type LexerStream = {
    'next': () => string, // gets and consumes the next char of the stream
    'peek': (offset?: number) => string | undefined,
        // looks at the specified character w/o removing it; undefined if eos
    'eos': () => boolean, // Returns true if the stream has no more characters
};

export function resolveUnicodeKeyword(c: char | undefined): string | undefined {
    if (c !== undefined && unicodeKeywords.has(c)) {
        return unicodeKeywords.get(c);
    }
    return c;
}

export function resolveUnicodeTypeVariable(c: char | undefined): string | undefined {
    if (c !== undefined && unicodeTyVarNames.has(c)) {
        return unicodeTyVarNames.get(c);
    }
    return c;
}

// TODO proper support for >= 256 chars
export function isAlphanumeric(c: char | undefined, options: InterpreterOptions = {}): boolean {
    if (c === undefined) {
        return false;
    }
    if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c === '\'' || c === '_') {
        return true;
    }
    if (options.allowUnicode === true) {
        if (symbolicCharacters.has(c) || reservedWords.has(c) || c === '.') {
            return false;
        }
        if (options.allowUnicodeTypeVariables !== true || resolveUnicodeTypeVariable(c) === c) {
            // Allow only sensible characters
            // Thanks to firefox, we need a not-so-good filter
            // return /^[^\p{Cc}\p{Cf}\p{Zl}\p{Zp}\p{Zs}\p{Ps}\p{Pe}]*$/u.test(c);
            return /^[\S]$/u.test(c);
        }
    }
    return false;
}

export function isSymbolic(c: char | undefined, options: InterpreterOptions = {}): boolean {
    if (c === undefined) {
        return false;
    }
    return symbolicCharacters.has(<char> c);
}

export function isWhitespace(c: char | undefined, options: InterpreterOptions = {}): boolean {
    if (c === undefined) {
        return false;
    }
    return c === ' ' || c === '\t' || c === '\n' || c === '\f';
}

export function isNumber(c: char | undefined, hexadecimal: boolean, options: InterpreterOptions = {}): boolean {
    if (c === undefined) {
        return false;
    }
    return (c >= '0' && c <= '9') || (hexadecimal && ((c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')));
}

function skipWhitespace(stream: LexerStream): string {
    let result = '';
    while (isWhitespace(stream.peek())) {
        result += stream.next();
    }
    return result;
}

// Reads and munches a single comment and everything that is inside
export function lexComment(stream: LexerStream, options: InterpreterOptions = {}): CommentToken {
    let comment = '';
    if (stream.peek() === '(' && stream.peek(1) === '*') {
        comment += stream.next() + stream.next();
        let openComments: number = 1;
        while (openComments > 0) {
            let s: string = '' + stream.peek() + stream.peek(1);
            if (stream.peek() === undefined || stream.peek(1) === undefined) {
                throw new IncompleteError('And it\'s just not enough.');
            }
            if (s === '(*') {
                ++openComments;
                comment += stream.next();
            } else if (s === '*)') {
                --openComments;
                comment += stream.next();
            }
            comment += stream.next();
        }
        return new CommentToken(comment);
    }
    throw new InternalInterpreterError('That was a bad comment...');
}

//Reads a sequence of digits. Sign, exponent etc. are handled by lexNumber. Accepts leading zeros.
function readNumeric(stream: LexerStream, hexadecimal: boolean, maxLength: number = -1): string {
    let result: string = '';
    while (isNumber(stream.peek(), hexadecimal) && result.length !== maxLength) {
        result += stream.next();
    }
    return result;
}

function makeNumberToken(token: string, value: string, real: boolean = false, word: boolean = false, hexadecimal: boolean = false): Token {
    if (real && word) {
        throw new InternalInterpreterError('There is no such thing as a real word.');
    }
    if (real) {
        return new RealConstantToken(token, parseFloat(value));
    }
    let v: int = parseInt(value, hexadecimal ? 16 : 10);
    if (v > MAXINT) {
        throw new LexerError('"' + v + '", whoa, it\'s over "' + MAXINT + '".');
    } else if (v < MININT) {
        throw new LexerError('"' + v + '", whoa, it\'s under "' + MININT + '".');
    }
    if (word) {
        return new WordConstantToken(token, v);
    } else {
        let firstChar = token.charAt(0);
        if (isNumber(firstChar, false) && firstChar !== '0') {
            // firstChar !== 0 also implies that the number is not hexadecimal
            return new NumericToken(token, v);
        } else {
            return new IntegerConstantToken(token, v);
        }
    }
}

export function lexNumber(stream: LexerStream, options: InterpreterOptions = {}): Token {
    let token: string = '';
    let value: string = '';
    let hexadecimal: boolean = false;
    let word: boolean = false;
    let real: boolean = false;
    let negative: boolean = false;

    if (stream.peek() === '~') {
        token += stream.next();
        negative = true;
        value += '-';
    }

    if (stream.peek() === '0' && (stream.peek(1) === 'w' || stream.peek(1) === 'x')) {
        token += stream.next();
        if (stream.peek() === 'w') {
            word = true;
        }
        if (stream.peek(word ? 1 : 0) === 'x') {
            hexadecimal = true;
        }
        let nextDigitOffset = (word && hexadecimal) ? 2 : 1;
        if ((negative && word) || !isNumber(stream.peek(nextDigitOffset), hexadecimal)) {
            // The 'w' or 'x' is not part of the number
            value += '0';
            return makeNumberToken(token, value, false,  false, false);
        }
        for (let i = 0; i < nextDigitOffset; ++i) {
            token += stream.next();
        }
    }

    let num = readNumeric(stream, hexadecimal);
    value += num;
    token += num;
    if (hexadecimal || word) {
        return makeNumberToken(token, value, false, word, hexadecimal);
    }

    if (stream.peek() === '.') {
        if (isNumber(stream.peek(1), false)) {
            token += stream.peek();
            value += stream.next();
            num = readNumeric(stream, false);
            token += num;
            value += num;
        } else {
            return makeNumberToken(token, value);
        }
        real = true;
    }

    if (stream.peek() === 'e' || stream.peek() === 'E') {
        if (isNumber(stream.peek(1), false)) {
            token += stream.next();
            value += 'e';
            num = readNumeric(stream, false);
            token += num;
            value += num;
        } else if (stream.peek(1) === '~' && isNumber(stream.peek(2), false)) {
            value += 'e-';
            token += stream.next() + stream.next();
            num = readNumeric(stream, false);
            token += num;
            value += num;
        } else {
            return makeNumberToken(token, value, real);
        }
        real = true;
    }
    return makeNumberToken(token, value, real);
}

export function lexString(stream: LexerStream, options: InterpreterOptions = {}): StringConstantToken {
    if (stream.next() !== '"') {
        throw new InternalInterpreterError('That was not a string.');
    }
    let token = '"';
    let value: string = '';

    while (stream.peek() !== '"') {
        if (stream.peek() === '\\') {
            token += stream.next();
            if (isWhitespace(stream.peek())) {
                token += skipWhitespace(stream);
                if (stream.peek() !== '\\') {
                    let offending = stream.next();
                    throw new LexerError('Found non-whitespace character "'
                        + offending + '" in whitespace escape sequence.');
                }
                token += stream.next();
            } else {
                let c = stream.peek();
                switch (c) {
                    case 'a': {
                        token += stream.next();
                        value += '\x07';
                        break;
                    }
                    case 'b': {
                        token += stream.next();
                        value += '\b';
                        break;
                    }
                    case 't': {
                        token += stream.next();
                        value += '\t';
                        break;
                    }
                    case 'n': {
                        token += stream.next();
                        value += '\n';
                        break;
                    }
                    case 'v': {
                        token += stream.next();
                        value += '\v';
                        break;
                    }
                    case 'f': {
                        token += stream.next();
                        value += '\f';
                        break;
                    }
                    case 'r': {
                        token += stream.next();
                        value += '\r';
                        break;
                    }
                    case '"': {
                        token += stream.next();
                        value += '"';
                        break;
                    }
                    case '\\': {
                        token += stream.next();
                        value += '\\';
                        break;
                    }
                    case '^': {
                        token += stream.next();
                        let nc = stream.next();
                        let cc: number = nc.charCodeAt(0);
                        if (cc < 64 || cc > 95) {
                            throw new LexerError('"' + String.fromCharCode(cc) +
                                                 '" does not represent a valid control character.');
                        }
                        token += nc;
                        value += String.fromCharCode(cc - 64);
                        break;
                    }
                    case 'u': {
                        token += stream.next();
                        let s: string = readNumeric(stream, true, 4);
                        if (s.length !== 4) {
                            throw new LexerError(
                                'A Unicode escape sequence must consist of four digits.');
                        }
                        let v: number = parseInt(s, 16);
                        token += s;
                        value += String.fromCharCode(v);
                        break;
                    }
                    default: {
                        if (!isNumber(c, false)) {
                            c = stream.next();
                            throw new LexerError('Invalid escape sequence "\\' + c + '".');
                        }
                        let s: string = readNumeric(stream, false, 3);
                        if (s.length !== 3) {
                            throw new LexerError(
                                'A numeric escape sequence must consist of three digits.');
                        }
                        let v: number = parseInt(s, 10);
                        token += s;
                        value += String.fromCharCode(v);
                        break;
                    }
                }
            }
        } else {
            let nc = stream.next();
            let c: number = nc.charCodeAt(0);
            token += nc;
            // Only printable characters (33 to 126) and spaces are allowed (SML definition, chapter 2.2)
            // We however also allow all non-ASCII characters (>128), since MosML and SML/NJ seem to do so as well.
            if ((c < 33 || c > 126) && c !== 32 /*space*/ && c < 128) {
                // invalid characters are not printable, so we should print its code
                // rather than the character
                let info = '';
                if (c === 9) {
                    info = ' (tab)';
                }
                if (c === 10) {
                    info = ' (newline)';
                }
                if (c === 13) {
                    info = ' (carriage return)';
                }
                throw new LexerError(
                    'A string may not contain the character "' + c + '"' + info + '.');
            }
            value += String.fromCharCode(c);
        }
    }

    if (stream.next() !== '"') {
        throw new InternalInterpreterError('This string will never end.');
    }
    return new StringConstantToken(token + '"', value);
}

export function lexCharacter(stream: LexerStream, options: InterpreterOptions = {}): CharacterConstantToken {
    if (stream.next() !== '#') {
        throw new InternalInterpreterError('That was not a character.');
    }
    let t: StringConstantToken = lexString(stream);
    if (t.value.length !== 1) {
        throw new LexerError('"' + t.value + '" is not a valid character constant, '
            + 'as its length ' + t.value.length + ' is larger than the expected length 1.');
    }
    return new CharacterConstantToken('#' + t.text, t.value);
}

export function lexIdentifierOrKeyword(stream: LexerStream, options: InterpreterOptions = {}): Token {
    // Both identifiers and keywords can be either symbolic (consisting only of the characters
    // ! % & $ # + - / : < = > ? @ \ ~ ‘ ^ | *
    // or alphanumeric (consisting only of letters, digits, ' or _).
    // We first need to figure out which of these types the token belongs to, then find the longest possible token
    // of that type at this position and lastly check whether it is a reserved word.

    let token: string = '';

    let charChecker: any;
    let firstChar = stream.peek();

    if (options.allowUnicodeTypeVariables === true
        && resolveUnicodeTypeVariable(firstChar) !== firstChar) {
        stream.next();
        return new TypeVariableToken(<string> resolveUnicodeTypeVariable(firstChar));
    } else if (options.allowUnicode === true && resolveUnicodeKeyword(firstChar) !== firstChar) {
        stream.next();
        return new KeywordToken(<string> resolveUnicodeKeyword(firstChar));
    } else if (isSymbolic(firstChar, options)) {
        charChecker = isSymbolic;
    } else if (isAlphanumeric(firstChar, options) && !isNumber(firstChar, false, options)
               && firstChar !== '_') {
        // alphanumeric identifiers may not start with a number
        charChecker = isAlphanumeric;
    } else if (firstChar !== undefined && reservedWords.has(<char> firstChar)) {
        return new KeywordToken(stream.next());
    } else if (firstChar === '.' && stream.peek(1) === '.' && stream.peek(2) === '.') {
        stream.next(); stream.next(); stream.next();
        return new KeywordToken('...');
    } else {
        firstChar = stream.next();
        throw new LexerError('Invalid token "' + firstChar + '" (\\u'
                             + firstChar.charCodeAt(0).toString(16).toUpperCase() + ').');
    }

    do {
        token += stream.next();
    } while (charChecker(stream.peek(), options));

//    console.log(token);

    if (token === '*') {
        return new StarToken();
    } else if (token === '=') {
        return new EqualsToken();
    } else if (reservedWords.has(token)) {
        return new KeywordToken(token);
    } else if (firstChar === '\'') {
        if (token.charAt(1) === '\'' ) {
            if (token.length === 2) {
                throw new LexerError('Invalid type variable "' + token + '". Delete Her.');
            } else {
                return new EqualityTypeVariableToken(token);
            }
        } else {
            if (token.length >= 2) {
                return new TypeVariableToken(token);
            } else {
                if (options.allowUnicodeTypeVariables === true
                    && resolveUnicodeTypeVariable(stream.peek()) !== stream.peek()) {
                        return new EqualityTypeVariableToken('\''
                            + resolveUnicodeTypeVariable(stream.next()));
                }
                throw new LexerError('The noise, it won\'t STOP: Invalid type variable "'
                                     + token + '".');
            }
        }
    } else if (isAlphanumeric(firstChar, options)) {
        return new AlphanumericIdentifierToken(token);
    } else {
        return new IdentifierToken(token);
    }
}

export function lexLongIdentifierOrKeyword(stream: LexerStream, options: InterpreterOptions = {}): Token {
    let t: Token = lexIdentifierOrKeyword(stream, options);
    let token = t.text;

    if (stream.peek() === '.') {
        // Check for "..."
        if (stream.peek(1) === '.' && stream.peek(2) === '.') {
            return t;
        }
    }
    if (stream.peek() !== '.') {
        return t;
    }

    let qualifiers: AlphanumericIdentifierToken[] = [];
    do {
        if (!(t instanceof AlphanumericIdentifierToken)) {
            throw new LexerError('Expected a structure name before "." (got "'
                + t.typeName() + '".');
        }
        if (stream.peek() === '.') {
            // Check for "...", only possible from the second iteration
            if (stream.peek(1) === '.' && stream.peek(2) === '.') {
                return new LongIdentifierToken(token, qualifiers, t);
            }
        }

        token += stream.next();
        qualifiers.push(t);
        t = lexIdentifierOrKeyword(stream, options);
        token += t.text;
    } while (stream.peek() === '.');

    // Only value identifiers, type constructors and structure identifiers are allowed here.
    // EqualsToken is not allowed because it cannot be re-bound.
    if ((!(t instanceof IdentifierToken || t instanceof StarToken))
        || t instanceof TypeVariableToken) {
        throw new LexerError('"' + t.text + '" is not allowed in a long identifier.');
    }
    return new LongIdentifierToken(token, qualifiers, t);
}

export function nextToken(stream: LexerStream, options: InterpreterOptions = {}): Token | undefined {
    skipWhitespace(stream);
    if (stream.eos()) {
        return undefined;
    }

    let token: Token;
    if (isNumber(stream.peek(), false)
        || (stream.peek() === '~' && isNumber(stream.peek(1), false))) {
        token = lexNumber(stream, options);
    } else if (stream.peek() === '"') {
        token = lexString(stream, options);
    } else if (stream.peek() === '#' && stream.peek(1) === '"') {
        token = lexCharacter(stream, options);
    } else if (stream.peek() === '(' && stream.peek(1) === '*') {
        token = lexComment(stream, options);
    } else {
        token = lexLongIdentifierOrKeyword(stream, options);
    }
    return token;
}

export function lexStream(stream: LexerStream, options: InterpreterOptions = {}): Token[] {
    let result: Token[] = [];
    while (!stream.eos()) {
        let current = nextToken(stream, options);
        if (current === undefined) {
            break;
        }
        if (options.allowCommentToken !== true && current instanceof CommentToken) {
            continue;
        }

        result.push(current);
    }
    return result;
}

export function lex(s: string, options: InterpreterOptions = {}): Token[] {
    let position = 0;
    let stream: LexerStream = {
        'peek': (offset: number = 0) => {
            if (position + offset >= s.length) {
                return undefined;
            }
            return s.charAt(position + offset);
        },
        'next': () => {
            if (position >= s.length) {
                throw new IncompleteError('♪ Da~ango, dango, dango, dango, da~ango daikazoku~ ♪');
            }
            position++;
            return s.charAt(position - 1);
        },
        'eos': () => {
            return position >= s.length;
        }
    };
    return lexStream(stream, options);
}
