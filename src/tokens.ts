// SML uses these types and we may have to emulate them more closely, in particular int
export type char = string;
export type int = number;

export interface Token {
    text: string;
    position: number;

    getText(): string;
    isValidRecordLabel(): boolean;
    isVid(): boolean;
}

export class KeywordToken implements Token {
    constructor(public text: string, public position: number) {}

    getText(): string {
        return this.text;
    }
    isValidRecordLabel(): boolean { return false; }
    isVid() { return false; }
}

export abstract class ConstantToken implements Token {
    text: string;
    position: number;

    abstract getText(): string;
    abstract isValidRecordLabel(): boolean;
    isVid() { return false; }
}
export class IntegerConstantToken extends ConstantToken {
    constructor(public text: string, public position: number, public value: int) {
        super();
    }

    getText(): string {
        return '' + this.value;
    }
    isValidRecordLabel(): boolean { return false; }
}
export class RealConstantToken extends ConstantToken {
    constructor(public text: string, public position: number, public value: number) {
        super();
    }

    getText(): string {
        return '' + this.value;
    }
    isValidRecordLabel(): boolean { return false; }
}
export class WordConstantToken extends ConstantToken {
    constructor(public text: string, public position: number, public value: int) {
        super();
    }
    getText(): string {
        return '' + this.value;
    }
    isValidRecordLabel(): boolean { return false; }
}
export class CharacterConstantToken extends ConstantToken {
    constructor(public text: string, public position: number, public value: char) {
        super();
    }
    getText(): string {
        return '' + this.text;
    }
    isValidRecordLabel(): boolean { return false; }
}
export class StringConstantToken extends ConstantToken {
    constructor(public text: string, public position: number, public value: string) {
        super();
    }
    getText(): string {
        return '' + this.text;
    }
    isValidRecordLabel(): boolean { return false; }
}

// Any identifier not starting with a prime (')
// May represent value identifiers, type constructors and record labels
export class IdentifierToken implements Token {
    opPrefixed: boolean = false;
    constructor(public text: string, public position: number) {}
    getText(): string {
        return this.text;
    }
    isValidRecordLabel(): boolean { return true; }
    isVid() { return true; }
}

// Alphanumeric identifiers not starting with a prime may represent structure identifiers, signature identifiers
// and functor identifiers
export class AlphanumericIdentifierToken extends IdentifierToken {
    constructor(text: string, position: number) { super(text, position); }
    getText(): string {
        return this.text;
    }
    isValidRecordLabel(): boolean { return true; }
}

// An alphanumeric identifier that starts with a prime
export class TypeVariableToken implements Token {
    constructor(public text: string, public position: number) {}
    getText(): string {
        return this.text;
    }
    isValidRecordLabel(): boolean { return false; }
    isVid() { return false; }
}

// An alphanumeric identifier that starts with two primes
export class EqualityTypeVariableToken extends TypeVariableToken {
    constructor(text: string, position: number) { super(text, position); }
    getText(): string {
        return this.text;
    }
    isValidRecordLabel(): boolean { return false; }
    isVid() { return false; }
}

// A star (*) can be used as value identifier or record label, but not as a type constructor and thus must be separated.
// See SML definition, chapter 2.4 Identifiers
export class StarToken extends KeywordToken {
    opPrefixed: boolean = false;
    constructor(public position: number) {
        super('*', position);
    }
    getText(): string {
        return this.text;
    }
    isValidRecordLabel(): boolean { return true; }
    isVid() { return true; }
}

// Reserved words are generally not allowed as identifiers. "The only exception to this rule is that the symbol = ,
// which is a reserved word, is also allowed as an identifier to stand for the equality predicate.
// The identifier = may not be re-bound; this precludes any syntactic ambiguity." (Definition of SML, page 5)
export class EqualsToken extends KeywordToken {
    constructor(public position: number) {
        super('=', position);
    }
    getText(): string {
        return this.text;
    }
    isValidRecordLabel(): boolean { return false; }
    isVid() { return true; }
}

// A numeric token (a positive, decimal integer not starting with '0') can be used either as an integer constant or as
// a record label.
export class NumericToken extends IntegerConstantToken {
    constructor(text: string, position: number, value: int) { super(text, position, value); }
    getText(): string {
        return this.text;
    }
    isValidRecordLabel(): boolean { return true; }
    isVid() { return false; }
}

// A long identifier is a sequence str_1.str_2. … .str_n.id of n > 0 structure identifiers and one Identifier
// separated by '.'s. The identifier may a value identifier, type constructor or structure identifier
export class LongIdentifierToken implements Token {
    opPrefixed: boolean = false;
    constructor(public text: string, public position: number, public qualifiers: AlphanumericIdentifierToken[],
                public id: IdentifierToken) {}
    getText(): string {
        let res: string = '';
        for (let i = 0; i < this.qualifiers.length; ++i) {
            if (i > 0) {
                res += '.';
            }
            res += this.qualifiers[i].getText();
        }
        return res + '.' + this.id.getText();
    }
    isValidRecordLabel(): boolean { return false; }
    isVid() { return false; }
}
