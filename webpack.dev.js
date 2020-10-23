var path = require('path');

module.exports = {
    entry: './src/main.ts',
    output: {
        filename: 'interpreter.js',
        path: path.join(process.cwd(), 'build'),
        library: 'Interpreter',
        libraryTarget : "umd",
        globalObject: 'this'
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                exclude: /node_modules|test/,
            }
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"]
    }
};
