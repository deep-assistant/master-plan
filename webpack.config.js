/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

/**@type {import('webpack').Configuration}*/
const baseConfig = {
  mode: 'none',
  devtool: 'nosources-source-map',
  externals: {
    vscode: 'commonjs vscode',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
          },
        ],
      },
    ],
  },
};

/** @type {import('webpack').Configuration} */
const desktopConfig = {
  ...baseConfig,
  name: 'desktop',
  target: 'node',
  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
  },
};

/** @type {import('webpack').Configuration} */
const webConfig = {
  ...baseConfig,
  name: 'web',
  target: 'webworker',
  entry: './src/web/extension.ts',
  output: {
    path: path.resolve(__dirname, 'dist', 'web'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
  },
};

module.exports = [desktopConfig, webConfig];
