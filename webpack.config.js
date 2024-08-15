var path = require('path');

const TerserPlugin = require('terser-webpack-plugin');

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
  plugins: [new TerserPlugin()],
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
