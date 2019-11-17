var path = require('path');

module.exports = {
    entry: './src/main.ts',
    output: {
        filename: 'interpreter.js',
        path: path.resolve(__dirname, 'build'),
        library: "Interpreter",
        libraryTarget : "commonjs2"
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
