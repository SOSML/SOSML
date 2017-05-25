var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: './src/main.ts',
  output: {
    filename: 'interpreter.min.js',
    path: path.resolve(__dirname, 'build'),
    library: "Interpreter",
    libraryTarget : "var"
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
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      beautify: false,
      mangle: {
        screw_ie8: true,
        keep_fnames: true,
        except: ['$super', '$', 'exports', 'require']
    },
      compress: {
        screw_ie8: true
      },
      comments: false
    })
  ]

};
