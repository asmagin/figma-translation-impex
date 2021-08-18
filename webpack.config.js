const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

module.exports = (env, argv) => ({
  mode: argv.mode === 'production' ? 'production' : 'development',

  // This is necessary because Figma's 'eval' works differently than normal eval
  devtool: argv.mode === 'production' ? false : 'inline-source-map',

  devServer: {
    writeToDisk: true,
  },

  entry: {
    ui: './src/ui/index.ts', // The entry point for your UI code
    code: './src/plugin/index.ts', // The entry point for your plugin code
  },

  module: {
    rules: [
      // { test: /\.(js)x?$/, use: ["babel-loader"], exclude: /node_modules/, },

      { test: /\.(ts)x?$/, use: ["ts-loader"], exclude: /node_modules/, },

      // Enables including CSS by doing "import './file.css'" in your TypeScript code
      { test: /\.css$/, use: ['style-loader', { loader: 'css-loader' }] },

      // Allows you to use "<%= require('./file.svg') %>" in your HTML code to get a data URI
      { test: /\.(png|jpg|gif|webp|svg)$/, loader: 'url-loader' },
    ],
  },

  // Webpack tries these extensions for you if you omit the extension like "import './file'"
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    fallback: {
      // tls: false,
      // fs: false,
      // net: false,
      // "buffer": require.resolve("buffer/"),
      // "http": require.resolve("stream-http"),
      // "https": require.resolve("https-browserify"),
      // "stream": require.resolve("stream-browserify"),
      // "url": require.resolve("url/"),
      // "util": require.resolve("util/"),
    }
  },

  optimization: {
    minimize: argv.mode === 'production' ? true : false,
  },

  target: 'web',

  output: {
    publicPath: '/',
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'), // Compile into a folder called "dist"
  },

  // Tells Webpack to generate "index.html" and to inline "index.ts" into it
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/ui/index.html',
      filename: 'index.html',
      inlineSource: '.(js)$',
      inject: 'body',
      chunks: ['ui'],
    }),
    new HtmlWebpackInlineSourcePlugin(HtmlWebpackPlugin),
  ],
})