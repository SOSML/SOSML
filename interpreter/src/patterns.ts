import { Type } from './types';
import { Token, LongIdentifierToken, IdentifierToken } from './lexer';

// interfaces

export interface Pattern {
}

// Atomic patterns
export interface AtomicPattern extends Pattern {
}

// Classes
// PatternRow
export class RowWildcard {
// ... (It is literally 3 dots)
}

export class PatternRowPart implements PatternRow {
// label = pattern
    label: Token;
    pattern: Pattern;
}

export class LabelAsVariable implements PatternRow {
// identifier<:type> <as patttern>
    identifier: IdentifierToken;
    type: Type | undefined;
    pattern: Pattern | undefined;
}

// Subclasses of AtomicPattern
export class AtomicWildcard implements AtomicPattern {
// _
}

export class Constant implements AtomicPattern {
    token: Token;
}

export class ValueIdentifier implements AtomicPattern {
// op longvid or longvid
    opPrefixed: boolean;
    identifier: LongIdentifierToken;
}

export class Record implements AtomicPattern {
// { patrow } or { }
    patternRow: (RowWildcard | PatternRowPart | LabelAsVariable)[];
}

export class Tuple implements AtomicPattern {
// (pat1, ..., patn), n != 1
    patterns: Pattern[];
}

export class List implements AtomicPattern {
// [pat1, ..., patn]
    patterns: Pattern[];
}

// Subclasses of Pattern
export class ConstructedValue implements Pattern {
// <op> identifier atomic
    opPrefixed: boolean;
    identifier: LongIdentifierToken;
    atomic: AtomicPattern;
}

export class ConstructedValueInfix implements Pattern {
// leftOperand operator rightOperand
    leftOperand: Pattern;
    operator: IdentifierToken;
    rightOperand: Pattern;
}

export class TypedPattern implements Pattern {
// pattern: type
    pattern: Pattern;
    type: Type;
}

export class LayeredPattern implements Pattern {
// <op> identifier <:type> as pattern
    opPrefixed: boolean;
    identifier: IdentifierToken;
    type: Type | undefined;
    pattern: Pattern;
}
