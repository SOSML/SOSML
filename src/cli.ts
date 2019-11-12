// A proof-of-concept CLI for SOSML
// Build with `npm run cli`
// Run with `node sosml_cli.js`

import { getFirstState, interpret } from './main';
import { IncompleteError } from './errors';
import { Type, CustomType, FunctionType } from './types';
import { Value, ValueConstructor, ExceptionConstructor } from './values';
import { State, DynamicBasis, StaticBasis, IdentifierStatus } from './state';

import * as readline from 'readline';

function printBasis( state: State, dynamicBasis: DynamicBasis | undefined, staticBasis: StaticBasis | undefined, indent: number = 0 ): string {
    let istr = '';
    for( let i = 0; i < indent; ++i ) {
        istr += '  ';
    }
    let out = '';
    let fullst = 'ＳＯＳ＞　　';
    let emptyst = '　　　＞　　';
    let stsym = indent === 0 ? fullst : emptyst;

    if( dynamicBasis === undefined && staticBasis !== undefined ) {
        for( let i in staticBasis.valueEnvironment ) {
            if( staticBasis.valueEnvironment.hasOwnProperty( i ) ) {
                out += stsym + ' ' + istr + printBinding( state,
                    [ i, undefined,
                        staticBasis.getValue( i ) ] ) + '\n';
            }
        }

        for( let i in staticBasis.typeEnvironment ) {
            if( staticBasis.typeEnvironment.hasOwnProperty( i ) ) {
                let sbtp = staticBasis.getType( i );
                if( sbtp !== undefined ) {
                    if( sbtp.type instanceof CustomType ) {
                        out += stsym + ' ' + istr + 'datatype \x1b[1m' + sbtp.type
                            + '\x1b[0m : {\n'
                        for( let j of sbtp.constructors ) {
                            out += emptyst + '   ' + istr + printBinding( state,
                                [ j, undefined, staticBasis.getValue( j ) ] ) + '\n';
                        }
                        out += emptyst + ' ' + istr + '};\n';
                    }
                }
            }
        }

        for( let i in staticBasis.typeEnvironment ) {
            if( staticBasis.typeEnvironment.hasOwnProperty( i ) ) {
                let sbtp = staticBasis.getType( i );
                if( sbtp !== undefined ) {
                    if( sbtp.type instanceof FunctionType ) {
                        out += stsym + ' ' + istr + 'type \x1b[1m'
                            + sbtp.type.parameterType + ' = '
                            + sbtp.type.returnType + '\x1b[0m;\n';
                    }
                }
            }
        }

        for( let i in staticBasis.structureEnvironment ) {
            if( staticBasis.structureEnvironment.hasOwnProperty( i ) ) {
                out += stsym + ' ' + istr + 'structure \x1b[1m' + i + '\x1b[0m: sig\n';
                if( staticBasis ) {
                    out += printBasis( state, undefined,
                        staticBasis.getStructure( i ), indent + 1 );
                } else {
                    out += printBasis( state, undefined,
                        undefined, indent + 1 );
                }
                out += emptyst + ' ' + istr + 'end;\n';
            }
        }

    } else if ( staticBasis !== undefined && dynamicBasis !== undefined ) {
        for( let i in dynamicBasis.valueEnvironment ) {
            if( dynamicBasis.valueEnvironment.hasOwnProperty( i ) ) {
                if( staticBasis ) {
                    out += stsym + ' ' + istr + printBinding( state,
                        [ i, dynamicBasis.valueEnvironment[ i ],
                            staticBasis.getValue( i ) ], false ) + '\n';
                } else {
                    out += stsym + ' ' + istr + printBinding( state,
                        [ i, dynamicBasis.valueEnvironment[ i ], undefined ], false ) + '\n';
                }
            }
        }

        for( let i in dynamicBasis.typeEnvironment ) {
            if( dynamicBasis.typeEnvironment.hasOwnProperty( i ) ) {
                if( staticBasis.typeEnvironment.hasOwnProperty( i ) ) {
                    let sbtp = staticBasis.getType( i );
                    if( sbtp !== undefined && sbtp.type instanceof CustomType ) {
                        out += stsym + ' ' + istr + 'datatype \x1b[1m' + sbtp.type
                            + '\x1b[0m = {\n'
                        for( let j of sbtp.constructors ) {
                            out += emptyst + '   ' + istr + printBinding( state,
                                [ j, dynamicBasis.valueEnvironment[ j ],
                                    staticBasis.getValue( j ) ] ) + '\n';
                        }
                        out += emptyst + ' ' + istr + '};\n';
                    }
                }
            }
        }

        for( let i in dynamicBasis.typeEnvironment ) {
            if( dynamicBasis.typeEnvironment.hasOwnProperty( i ) ) {
                if( staticBasis.typeEnvironment.hasOwnProperty( i ) ) {
                    let sbtp = staticBasis.getType( i );
                    if( sbtp !== undefined && sbtp.type instanceof FunctionType ) {
                        out += stsym + ' ' + istr + 'type \x1b[1m'
                            + sbtp.type.parameterType + ' = '
                            + sbtp.type.returnType + '\x1b[0m;\n';
                    }
                }
            }
        }

        for( let i in dynamicBasis.structureEnvironment ) {
            if( dynamicBasis.structureEnvironment.hasOwnProperty( i ) ) {
                out += stsym + ' ' + istr + 'structure \x1b[1m' + i + '\x1b[0m = struct\n';
                if( staticBasis ) {
                    out += printBasis( state, dynamicBasis.getStructure( i ),
                        staticBasis.getStructure( i ), indent + 1 );
                } else {
                    out += printBasis( state, dynamicBasis.getStructure( i ),
                        undefined, indent + 1 );
                }
                out += emptyst + ' ' + istr + 'end;\n';
            }
        }
    }
    return out;
}

function printBinding( state: State, bnd: [string, [Value, IdentifierStatus] | undefined, [Type, IdentifierStatus] | undefined], acon: boolean =  true): string {
    let res = '';

    let value: Value | undefined;
    let bnd1 = bnd[1];
    if ( bnd1 !== undefined ) {
        value = bnd1[0];
    }
    let type: Type | undefined;
    let bnd2 = bnd[2];
    if ( bnd2 !== undefined ) {
        type = bnd2[0];
    }

    if ( ( value instanceof ValueConstructor || type instanceof ValueConstructor ) && acon ) {
        res += 'con';
    } else if ( value instanceof ExceptionConstructor || type instanceof ExceptionConstructor ) {
        res += 'exn';
    } else {
        res += 'val';
    }

    if (value) {
        if (type && type.isOpaque()) {
            res += ' \x1b[1m' + bnd[0] + ' = <' + type.getOpaqueName() + '>\x1b[0m';
        } else {
                res += ' \x1b[1m' + bnd[0] + ' = ' + value.toString(state) + '\x1b[0m';
            }
    } else {
        res += ' \x1b[1m' + bnd[0] + '\x1b[0m;';
    }

    if (type) {
        return res + ': \x1b[3m' + type.toString() + '\x1b[0m;';
    } else {
        return res + ': \x1b[3mundefined\x1b[0m;';
    }

}


let opts = {
    'allowUnicodeInStrings': false,
    'allowSuccessorML': true,
    'allowVector': true,
    'disableElaboration': false,
    'disableEvaluation': false,
    'allowLongFunctionNames': false,
    'strictMode': false
};

let state = getFirstState( );
let st = getFirstState( ).id + 1;

console.log('ＳＯＳ＞　　ごきげんよう御主人様、御命令をお願いいたしませんか。\n');
let tmp = '';

let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '御主人様＞　'
});
rl.prompt( );


rl.on( 'line', ( line: string ) => {
    try {
        tmp = tmp + line;
        let out = '';
        let res = interpret( tmp, state, opts );

        if( res.evaluationErrored ) {
            out += 'ＳＯＳ＞　　申し訳ございませんが、御問題がございました：\n'
                +  '　　　＞　　\x1b[31;40;1m' + res.error + '\x1b[39;49;0m\n';
            tmp = '';
        } else {
            out += printBasis( res.state,
                res.state.getDynamicChanges( st - 1 ),
                res.state.getStaticChanges( st - 1 ) );
            st = res.state.id + 1;
            state = res.state;
            tmp = '';
        }
        if( res.warnings !== undefined ) {
            for( let i = 0; i < res.warnings.length; ++i ) {
                if( res.warnings[ i ].type >= -1 ) {
                    out += 'お気を付けてくださいませ：' + res.warnings[ i ].message;
                } else {
                    out += '御通知がございます：　' + res.warnings[ i ].message;
                }
            }
        }
        console.log( out );
    } catch (e) {
        if( !( e instanceof IncompleteError ) ) {
            console.log( 'ＳＯＳ＞　　申し訳ございませんが、御問題がごさいました：\n'
                + '　　　＞　　\x1b[31;40;1m' + e + '\x1b[39;49;0m\n' );
            tmp = '';
        }
    }
    rl.prompt( );
}).on('close', () => {
    console.log( '\nＳＯＳ＞　　毎度どうもありがとうございます。お元気で御機嫌よう。' );
    process.exit( 0 );
});
