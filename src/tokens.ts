// SML uses these types and we may have to emulate them more closely, in particular int
export type char = string;
export type int = number;

export interface Token {
    text: string;
    typeName(): string;

    getText(): string;
    isValidRecordLabel(): boolean;
    isVid(): boolean;
}

export class KeywordToken implements Token {
    constructor(public text: string) {}
    typeName() { return 'KeywordToken'; }

    getText(): string {
        return this.text;
    }
    isValidRecordLabel(): boolean { return false; }
    isVid() { return false; }
}

export abstract class ConstantToken implements Token {
    typeName() { return 'ConstantToken'; }
    text: string;

    abstract getText(): string;
    abstract isValidRecordLabel(): boolean;
    isVid() { return false; }
}
export class IntegerConstantToken extends ConstantToken {
    typeName() { return 'IntegerConstantToken'; }
    constructor(public text: string, public value: int) {
        super();
    }

    getText(): string {
        return '' + this.value;
    }
    isValidRecordLabel(): boolean { return false; }
}
export class RealConstantToken extends ConstantToken {
    typeName() { return 'RealConstantToken'; }
    constructor(public text: string, public value: number) {
        super();
    }

    getText(): string {
        return this.text;
    }
    isValidRecordLabel(): boolean { return false; }
}
export class WordConstantToken extends ConstantToken {
    typeName() { return 'WordConstantToken'; }
    constructor(public text: string, public value: int) {
        super();
    }
    getText(): string {
        return '' + this.value;
    }
    isValidRecordLabel(): boolean { return false; }
}
export class CharacterConstantToken extends ConstantToken {
    typeName() { return 'CharacterConstantToken'; }
    constructor(public text: string, public value: char) {
        super();
    }
    getText(): string {
        return '' + this.text;
    }
    isValidRecordLabel(): boolean { return false; }
}
export class StringConstantToken extends ConstantToken {
    typeName() { return 'StringConstantToken'; }
    constructor(public text: string, public value: string) {
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
    typeName() { return 'IdentifierToken'; }
    opPrefixed: boolean = false;
    constructor(public text: string) {}
    getText(): string {
        return this.text;
    }
    isValidRecordLabel(): boolean { return true; }
    isVid() { return true; }
}

// Alphanumeric identifiers not starting with a prime may represent structure identifiers, signature identifiers
// and functor identifiers
export class AlphanumericIdentifierToken extends IdentifierToken {
    typeName() { return 'AlphanumericIdentifierToken'; }
    constructor(text: string) { super(text); }
    getText(): string {
        return this.text;
    }
    isValidRecordLabel(): boolean { return true; }
}

// An alphanumeric identifier that starts with a prime
export class TypeVariableToken implements Token {
    typeName() { return 'TypeVariableToken'; }
    constructor(public text: string) {}
    getText(): string {
        return this.text;
    }
    isValidRecordLabel(): boolean { return false; }
    isVid() { return false; }
}

// An alphanumeric identifier that starts with two primes
export class EqualityTypeVariableToken extends TypeVariableToken {
    typeName() { return 'EqualityTypeVariableToken'; }
    constructor(text: string) { super(text); }
    getText(): string {
        return this.text;
    }
    isValidRecordLabel(): boolean { return false; }
    isVid() { return false; }
}

// A star (*) can be used as value identifier or record label, but not as a type constructor and thus must be separated.
// See SML definition, chapter 2.4 Identifiers
export class StarToken extends KeywordToken {
    typeName() { return 'StarToken'; }
    opPrefixed: boolean = false;
    constructor() {
        super('*');
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
    typeName() { return 'EqualsToken'; }
    constructor() {
        super('=');
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
    typeName() { return 'NumericToken'; }
    constructor(text: string, value: int) { super(text, value); }
    getText(): string {
        return this.text;
    }
    isValidRecordLabel(): boolean { return true; }
    isVid() { return false; }
}

// A long identifier is a sequence str_1.str_2. … .str_n.id of n > 0 structure identifiers and one Identifier
// separated by '.'s. The identifier may a value identifier, type constructor or structure identifier
export class LongIdentifierToken implements Token {
    typeName() { return 'LongIdentifierToken'; }
    opPrefixed: boolean = false;
    constructor(public text: string, public qualifiers: AlphanumericIdentifierToken[],
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
