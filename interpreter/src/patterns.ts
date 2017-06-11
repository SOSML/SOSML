import { Type } from './types';

// interfaces

export interface Pattern {
}

export interface PatternRow {
}

// Atomic patterns
export interface AtomicPattern extends Pattern {
}

// Classes
// Subclasses of PatternRow
export class RowWildcard implements PatternRow {
// ... (It is literally 3 dots)
}

export class PatternRowPart implements PatternRow {
// lab = pat or lab = pat, patrow
    lab: any;
    pat: Pattern;
    patrow: PatternRow | undefined;
}

export class LabelAsVariable implements PatternRow {
// vid<:ty> <as pat> <,patrow>
    vid: any;
    ty: Type | undefined;
    pat: Pattern | undefined;
    patrow: PatternRow | undefined;
}

// Subclasses of AtomicPattern
export class AtomicWildcard implements AtomicPattern {
// _
}

export class SpecialConstant implements AtomicPattern {
    scon: any;
}

export class ValueIdentifier implements AtomicPattern {
// op longvid or longvid
    op: 'op' | undefined;
    longvid: any;
}

export class Record implements AtomicPattern {
// { patrow } or { }
    patrow: PatternRow | undefined;
}

export class Tuple implements AtomicPattern {
// (pat1, ..., patn), n != 1
    pat: Pattern[];
}

export class List implements AtomicPattern {
// [pat1, ..., patn]
    pat: Pattern[];
}

// Subclasses of Pattern
export class ConstructedValue implements Pattern {
// <op> longvid atpat
    op: 'op' | undefined;
    longvid: any;
    atpat: AtomicPattern;
}

export class ConstructedValueInfix implements Pattern {
// pat1 vid pat2
    pat1: Pattern;
    vid: any;
    pat2: Pattern;
}

export class TypedPattern implements Pattern {
// pat: ty
    pat: Pattern;
    ty: Type;
}

export class LayeredPattern implements Pattern {
// <op> vid <:ty> as pat
    op: 'op' | undefined;
    vid: any;
    ty: Type | undefined;
    pat: Pattern;
}
