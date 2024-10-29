// webpack.config.js
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    mode: 'development',
    devtool: 'inline-source-map',
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: 'css/*.css', to: '[name][ext]' }, // Kopiert alle CSS-Dateien aus css in dist
                { from: 'dev-helpers/*.*', to: '[name][ext]' }, // Kopiert alle HTML-Dateien Bild-Dateien, Testdaten aus dev-helpers in dist
            ],
        }),
    ],
    devServer: {
        static: './dist',
        port: 3000,
        open: true, // Öffnet den Browser automatisch
    },
});
