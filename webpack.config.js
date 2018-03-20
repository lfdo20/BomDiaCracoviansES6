const path = require('path');
const webpack = require('webpack');

module.exports = {
  devtool: 'none',
  entry: './web/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'web')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      }
    ]
  },
  plugins: [
  ],
  resolve: {
    extensions: ['.js', '.jsx']
  },
};
