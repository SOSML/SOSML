// TODO This is still far from unfinished
// TODO Add method for working properly with environments
// TODO Add types
//
// TODO Remove stuff not needed for our subset of SML

export class Environment {
    stringEnvironment:  any;
    typeEnvironmet:     any;
    valueEnvironment:   any; // maps value identifiers to (type scheme, identifier status)
};

export class State {
    T: any;         // Type names
    F: any;         // Functor environment
    G: any;         // Signature environment
    E: Environment;
};
