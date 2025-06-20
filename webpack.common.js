// webpack.config.js
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
    entry: {
        'ig': './src/main.js',
        'ig.capability.doc': './src/capabilitydoc.js',
        'ig.apidoc': './src/apidoc.js',
        'ig.req': './src/req.js',
        'ig.openapi': './src/openapi.js',
        'ig.epa': './src/epa.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].gematik.min.js',
        library: 'FHIRIGDOC',
        libraryTarget: 'umd',
        umdNamedDefine: true,
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                    },
                },
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            }
        ],
    },
    resolve: {
        alias: {
            'js-yaml': path.resolve(__dirname, 'node_modules/js-yaml/dist/js-yaml.min.js')
        }
    }
};
