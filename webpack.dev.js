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
                { from: 'css/*.css', to: '[name][ext]' }, // Kopiert alle CSS-Dateien aus public in dist
                { from: 'public/*.png', to: '[name][ext]' }, // Kopiert alle {NG-Dateien aus public in dist
                { from: 'public/*.html', to: '[name][ext]' }, // Kopiert alle HTML-Dateien aus public in dist
                { from: 'dev-helpers/*.*', to: '[name][ext]' }, // Kopiert alle HTML-Dateien aus public in dist
            ],
        }),
    ],
    devServer: {
        static: './dist',
        port: 3000, // oder ein beliebiger Port für die Entwicklungsumgebung
        open: true, // Öffnet den Browser automatisch
    },
});
