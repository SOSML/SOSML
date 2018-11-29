import { getFirstState, interpret } from './main';
import { IncompleteError } from './errors';
import { CustomType, FunctionType } from './types';
import { ValueConstructor, ExceptionConstructor } from './values';

import * as readline from 'readline';

function printBasis( state: any, dynamicBasis: any, staticBasis: any, indent: number = 0 ): string {
    let istr = '';
    for( let i = 0; i < indent; ++i ) {
        istr += '  ';
    }
    let out = '';
    let fullst = 'ＳＯＳさん＞　';
    let emptyst = '　　　　　＞　';
    let stsym = indent === 0 ? fullst : emptyst;

    if( dynamicBasis === undefined ) {
        for( let i in staticBasis.valueEnvironment ) {
            if( staticBasis.valueEnvironment.hasOwnProperty( i ) ) {
                out += stsym + ' ' + istr + printBinding( state,
                    [ i, undefined,
                        staticBasis.getValue( i ) ] ) + '\n';
            }
        }

        for( let i in staticBasis.typeEnvironment ) {
            if( staticBasis.typeEnvironment.hasOwnProperty( i ) ) {
                if( staticBasis.typeEnvironment.hasOwnProperty( i ) ) {
                    if( staticBasis.getType( i ).type instanceof CustomType ) {
                        out += stsym + ' ' + istr + 'datatype \x1b[1m' + staticBasis.getType(i).type
                            + '\x1b[0m : {\n'
                        for( let j of staticBasis.getType(i).constructors ) {
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
                if( staticBasis.typeEnvironment.hasOwnProperty( i ) ) {
                    if( staticBasis.getType(i).type instanceof FunctionType ) {
                        out += stsym + ' ' + istr + 'type \x1b[1m'
                            + staticBasis.getType(i).type.parameterType + ' = '
                            + staticBasis.getType(i).type.returnType + '\x1b[0m;\n';
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

    } else {
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
                    if( staticBasis.getType( i ).type instanceof CustomType ) {
                        out += stsym + ' ' + istr + 'datatype \x1b[1m' + staticBasis.getType(i).type
                            + '\x1b[0m = {\n'
                        for( let j of staticBasis.getType(i).constructors ) {
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
                    if( staticBasis.getType(i).type instanceof FunctionType ) {
                        out += stsym + ' ' + istr + 'type \x1b[1m'
                            + staticBasis.getType(i).type.parameterType + ' = '
                            + staticBasis.getType(i).type.returnType + '\x1b[0m;\n';
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

function printBinding( state: any, bnd: [any, any[] | undefined, any[] | undefined], acon: boolean =  true): string {
    let res = '';

    let value: any = bnd[1];
    if (value) {
        value = value[0];
    }
    let type: any = bnd[2];
    if (type) {
        type = type[0];
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
        return res + ': \x1b[3m' + type.toString(state) + '\x1b[0m;';
    } else {
        return res + ': \x1b[3mundefined\x1b[0m;';
    }

}


let opts = {
    'allowUnicodeInStrings': false,
    'allowSuccessorML': false,
    'disableElaboration': false,
    'allowLongFunctionNames': false,
    'strictMode': false
};

let state = getFirstState( );
let st = getFirstState( ).id + 1;

console.log('ＳＯＳさん＞　ごきげんよう御主人様、御命令をお願いいたしませんか。\n');
let tmp = '';

let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '御主人様＞　　'
});
rl.prompt( );


rl.on( 'line', ( line: string ) => {
    try {
        tmp = tmp + line;
        let out = '';
        let res = interpret( tmp, state, opts );

        if( res.evaluationErrored ) {
            out += 'ＳＯＳさん＞　申し訳ございませんが、御問題がありました：\n'
                +  '　　　　　＞　\x1b[31;40;1m' + res.error + '\x1b[39;49;0m\n';
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
                if( res.warnings[ i ].position >= -1 ) {
                    out += '気を付けてください：' + res.warnings[ i ].message;
                } else {
                    out += '御通知があります：　' + res.warnings[ i ].message;
                }
            }
        }
        console.log( out );
    } catch (e) {
        if( !( e instanceof IncompleteError ) ) {
            console.log( 'ＳＯＳさん＞　申し訳ございませんが、御問題がありました：\n'
                + '　　　　　＞　\x1b[31;40;1m' + e + '\x1b[39;49;0m\n' );
            tmp = '';
        }
    }
    rl.prompt( );
}).on('close', () => {
    console.log( '\nＳＯＳさん＞　毎度どうもありがとうございます。お元気で御機嫌よう。' );
    process.exit( 0 );
});
