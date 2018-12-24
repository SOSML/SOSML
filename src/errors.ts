export interface InterpreterMessage {
    message: string;
    position: number;
}

// A general compiler error. Different translation phases may derive their own, more specialized error classes.
export class InterpreterError extends Error implements InterpreterMessage {
    constructor(public position: number, public message: string, public name: string) {
        super(message);
        Object.setPrototypeOf(this, InterpreterError.prototype);
    }

    toString(): string {
        return this.name + ': ' + this.message;
    }
}

// Used for errors that Never Happen™. Any InternalInterpreterError occurring is a bug in the interpreter, regardless
// of how absurd the input is.
export class InternalInterpreterError extends InterpreterError {
    constructor(position: number, message: string = 'internal compiler error') {
        super(position, message, 'You triggered Third Impact');
        Object.setPrototypeOf(this, InternalInterpreterError.prototype);
    }
}

// Used if the code may be valid SML, but uses a feature that this interpreter does not implement, e.g. references.
export class FeatureNotImplementedError extends InterpreterError {
    constructor(position: number, message: string) {
        super(position, message, 'Feature Not Implemented');
        Object.setPrototypeOf(this, FeatureNotImplementedError.prototype);
    }
}

// Used if the code may be valid SML, but uses a feature that is currently disabled in the interpreter settings.
export class FeatureDisabledError extends InterpreterError {
    constructor(position: number, message: string) {
        super(position, message, 'Have you ever tried using something you were not supposed to? '
        + 'Basically that');
        Object.setPrototypeOf(this, FeatureDisabledError.prototype);
    }
}

// Used if the input is incomplete, but may be a prefix of valid SML code.
export class IncompleteError extends InterpreterError {
    constructor(position: number, message: string = 'unexpected end of input') {
        super(position, message, 'Input Incomplete');
        Object.setPrototypeOf(this, IncompleteError.prototype);
    }
}


export class LexerError extends InterpreterError {
    constructor(position: number, message: string) {
        super(position, message, 'Lexing failed');
        Object.setPrototypeOf(this, LexerError.prototype);
    }
}

export class ParserError extends InterpreterError {
    constructor(message: string, position: number) {
        super(position, message, 'Parsing failed');
        Object.setPrototypeOf(this, ParserError.prototype);
    }
}

export class ElaborationError extends InterpreterError {
    static getUnguarded(position: number, tyvars: string[]) {
        let res = '';
        if (tyvars.length > 1) {
            res += 's';
        }
        res += ' ';
        for (let i = 0; i < tyvars.length; ++i) {
            if (i > 0) {
                res += ', ';
            }
            res += '"' + tyvars[i] + '"';
        }
        return new ElaborationError(position,
            'Unguarded type variable' + res + '.');
    }
    constructor(position: number, message: string) {
        super(position, message, 'Elaboration failed');
        Object.setPrototypeOf(this, ElaborationError.prototype);
    }
}

export class EvaluationError extends InterpreterError {
    constructor(position: number, message: string) {
        super(position, message, 'Evaluation failed');
        Object.setPrototypeOf(this, EvaluationError.prototype);
    }
}

export class Warning extends InterpreterError {
    constructor(position: number, message: string) {
        super(position, message, 'Warning');
        Object.setPrototypeOf(this, Warning.prototype);
    }
}
