const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require('path');

module.exports = {
  // entrypoint with async loader
  entry: "./bootstrap.ts",
  // destination direcrory
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bootstrap.js", // filename referenced in index.html
  },
  // enable typescript
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      }
    ],
  },
  resolve: {
    extensions: ['.ts', '.js', '.wasm'],
  },
  // external libraries - exclude these from bundling
  externals: {
    'pixi.js': 'PIXI'
  },
  // set to production some day
  mode: "development",

  plugins: [
    // copy some files verbatim
    new CopyWebpackPlugin({
      patterns: [{
        context: path.resolve(__dirname),
        from: 'index.html',
      }]
    })
  ],
  // wasm is async, but we have some import resolution conflicts, so staying sync for now
  experiments: {
    syncWebAssembly: true
  },
  // make bundles readable by disabling some dev tool
  devtool: false
};
