/* TODO: tests
*/

const Lexer = require("../src/lexer");
const Parser = require("../src/parser");
const Value = require("../src/values");
const Errors = require("../src/errors");
const State = require("../src/state");
const InitialState = require("../src/initialState");
const API = require("../src/main");

const diff = require('jest-diff');
const chalk = require('chalk');

function printBasis( state: any, dynamicBasis: any, staticBasis: any, indent: number = 0 ): string {
    let istr = '';
    for( let i = 0; i < indent; ++i ) {
        istr += '  ';
    }
    let out = '';
    let stsym = '>';
    for( let i in dynamicBasis.valueEnvironment ) {
        if( dynamicBasis.valueEnvironment.hasOwnProperty( i ) ) {
            if( staticBasis ) {
                out += stsym + ' ' + istr + printBinding( state,
                    [ i, dynamicBasis.valueEnvironment[ i ],
                        staticBasis.getValue( i ) ] ) + '\n';
            } else {
                out += stsym + ' ' + istr + printBinding( state,
                    [ i, dynamicBasis.valueEnvironment[ i ], undefined ] ) + '\n';
            }
        }
    }

    for( let i in dynamicBasis.structureEnvironment ) {
        if( dynamicBasis.structureEnvironment.hasOwnProperty( i ) ) {
            out += stsym + ' ' + istr + 'structure ' + i + ' = {\n';
            if( staticBasis ) {
                out += printBasis( state, dynamicBasis.getStructure( i ),
                    staticBasis.getStructure( i ), indent + 1 );
            } else {
                out += printBasis( state, dynamicBasis.getStructure( i ),
                    undefined, indent + 1 );
            }
            out += stsym + ' ' + istr + '}\n';
        }
    }
    return out;
}

function printBinding( state: any, bnd: [ string, [any, any], [any, any] ] ): string {
    let res = '';

    if( bnd[ 1 ][ 0 ] instanceof Value.ValueConstructor ) {
        res += 'con';
    } else if( bnd[ 1 ][ 0 ] instanceof Value.ExceptionConstructor ) {
        res += 'exn';
    } else {
        res += 'val';
    }

    if( bnd[ 1 ] ) {
        if( bnd[ 2 ] && bnd[ 2 ][ 0 ].isOpaque( ) ) {
            res += ' ' + bnd[ 0 ] + ' = <' + bnd[ 2 ][ 0 ].getOpaqueName( ) + '>';
        } else {
            res += ' ' + bnd[ 0 ] + ' = ' + bnd[ 1 ][ 0 ].toString( state );
        }
    } else {
        return res + ' ' + bnd[ 0 ] + ' = undefined;';
    }

    if( bnd[ 2 ] ) {
        return res + ': ' + bnd[ 2 ][ 0 ].toString( state ) + ';';
    } else {
        return res + ': undefined;';
    }
}

function run( stuff: string, moreStuff: string[ ] = [ ], evaluate: boolean = true ) {
    it( stuff, ( ) => {
        //let tokens = Lexer.lex( stuff );
        //let ast = Parser.parse( tokens, InitialState.getInitialState( ) );
        //console.log(ast);
        //console.log(ast.simplify().toString());
        //return;
        // if( evaluate ) {
        //    let res = ast.simplify( ).evaluate( InitialState.getInitialState( ) );
        //}
        let out = stuff + '\n'; // + '\n ~> ' + ast.simplify().toString();
        try {

            let opts = {
                'allowUnicodeInStrings': false,
                'allowSuccessorML': false,
                'disableElaboration': false,
                'allowLongFunctionNames': false,
                'strictMode': false
            };

            if( evaluate ) {
                let usestdlib = true;
                let res = API.interpret( stuff, API.getFirstState( ), opts );
                let i = 0;
                let st = API.getFirstState( ).id + 1;
                do {
                    if( res.evaluationErrored ) {
                        out += '\x1b[30;47;1mUncaught exception: '
                            + res.error + '\x1b[39;49;0m';
                        break;
                    } else {
                        out += printBasis( res.state,
                            res.state.getDynamicChanges( st - 1 ),
                            res.state.getStaticChanges( st - 1 ) );
                    }
                    if( res.warnings !== undefined ) {
                        for( let i = 0; i < res.warnings.length; ++i ) {
                            if( res.warnings[ i ].position >= -1 ) {
                                out += 'WARN: ' + res.warnings[ i ].message;
                            } else {
                                out += 'Printed: ' + res.warnings[ i ].message;
                            }
                        }
                    }
                    if( i < moreStuff.length ) {
                        st = res.state.id + 1;
                        out += '\n' + moreStuff[ i ] + '\n';
                        res = API.interpret( moreStuff[ i ], res.state, opts );
                    } else {
                        break;
                    }
                    // res[0].getDefinedIdentifiers().forEach((val: string) => {
                    //     out += val + ' ';
                    // });
                    // out += '\n';
                    ++i;
                } while( true );
            }
        } catch (e) {
            out += '\x1b[31;40;1m' + e + '\x1b[39;49;0m\n';
            console.log( out );
            throw e;
        }
        console.log( out );
    });
}

run(';');

