import { TypeVariable } from './types';

// currently this is the index of a character in the input string
// TODO: maybe change this to line and column number
export type Position = number;

export interface InterpreterMessage {
    message: string;
    position: Position;
}

// A general compiler error. Different translation phases may derive their own, more specialized error classes.
export class InterpreterError extends Error implements InterpreterMessage {
    constructor(public position: Position, message: string) {
        super(message);
        Object.setPrototypeOf(this, InterpreterError.prototype);
    }
}

// Used for errors that Never Happen™. Any InternalInterpreterError occurring is a bug in the interpreter, regardless
// of how absurd the input is.
export class InternalInterpreterError extends InterpreterError {
    constructor(position: Position, message: string = 'internal compiler error') {
        super(position, message);
        Object.setPrototypeOf(this, InternalInterpreterError.prototype);
    }
}

// Used if the code may be valid SML, but uses a feature that this interpreter does not implement, e.g. references.
export class FeatureNotImplementedError extends InterpreterError {
    constructor(position: Position, message: string) {
        super(position, message);
        Object.setPrototypeOf(this, FeatureNotImplementedError.prototype);
    }
}

// Used if the code may be valid SML, but uses a feature that is currently disabled in the interpreter settings.
export class FeatureDisabledError extends InterpreterError {
    constructor(position: Position, message: string) {
        super(position, message);
        Object.setPrototypeOf(this, FeatureDisabledError.prototype);
    }
}

// Used if the input is incomplete, but may be a prefix of valid SML code.
export class IncompleteError extends InterpreterError {
    constructor(position: Position, message: string = 'unexpected end of input') {
        super(position, message);
        Object.setPrototypeOf(this, IncompleteError.prototype);
    }
}


export class LexerError extends InterpreterError {
    constructor(position: Position, message: string) {
        super(position, message);
        Object.setPrototypeOf(this, LexerError.prototype);
    }
}

export class ElaborationError extends InterpreterError {
    static getUnguarded(position: Position, tyvars: TypeVariable[]) {
        let res = '';
        if (tyvars.length > 1) {
            res += 's';
        }
        res += ' ';
        for (let i = 0; i < tyvars.length; ++i) {
            if (i > 0) {
                res += ', ';
            }
            res += '"' + tyvars[i].name + '"';
        }
        return new ElaborationError(position,
            'Unguarded type variable' + res + '.');
    }
    constructor(position: Position, message: string) {
        super(position, message);
        Object.setPrototypeOf(this, ElaborationError.prototype);
    }
}

export class EvaluationError extends InterpreterError {
    constructor(position: Position, message: string) {
        super(position, message);
        Object.setPrototypeOf(this, EvaluationError.prototype);
    }
}
