var path = require('path');

const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

var webpackConfig = {
  mode: 'production',
  entry: {
    sankey: './src/sankey.ts',
  },
  output: {
    filename: 'bundle.js',
    path: path.join(path.resolve(__dirname), '/dist'),
    library: '[name]',
    libraryTarget: 'umd',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  plugins: [new UglifyJSPlugin()],
  module: {
    rules: [
      {test: /\.js$/, loader: 'babel-loader'},
      {test: /\.ts$/, loader: 'ts-loader'},
    ],
  },
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
};

module.exports = webpackConfig;
