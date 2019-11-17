var path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: './src/cli.ts',
    output: {
        filename: 'sosml_cli.js',
        path: path.resolve(__dirname, 'build'),
        pathinfo: true,
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                exclude: /node_modules|test/,
            }
        ],
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    target: "node",
    plugins: [
        new webpack.BannerPlugin({ banner: "#!/usr/bin/env node", raw: true }),
    ]
};
