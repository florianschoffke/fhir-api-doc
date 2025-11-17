// webpack.config.js
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require("path");

module.exports = merge(common, {
    mode: 'production',
    devtool: 'source-map',
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { 
                  from: 'css/*.css',
                  to: '[name][ext]', // Kopiert alle CSS-Dateien aus css in dist
                  globOptions: {
                    ignore: ['**/ig.apidoc.gematik.css'],
                  },
                },
                { 
                  from: path.resolve(__dirname, "node_modules/swagger-ui-dist/LICENSE"),
                  to: "swagger-ui-es-bundle.LICENSE.txt"
                }, // Kopiert LICENSE in dist
            ],
        }),
    ],
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin(), 
            new CssMinimizerPlugin(),
        ],
    },
});
