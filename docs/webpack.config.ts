import * as Webpack from 'webpack';
import * as Path from 'path';
import * as HtmlWebpackPlugin from 'html-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

// const packageJson = require('../package.json');

module.exports = (env: any = {}) => {
    const PORT = env['port'] || 18001;
    const IS_PROD = env['production'];
    const CHUNK_TYPE = IS_PROD ? 'chunkhash' : 'hash';

    return {
        devtool: 'source-map',
        context: __dirname + '',
        performance: {
            hints: false
        },
        entry: {
            'main': Path.resolve(__dirname, './src/index.tsx')
        },
        output: {
            path: Path.resolve(__dirname, './build'),
            filename: `content/[name].[${CHUNK_TYPE}].js`
        },
        resolve: {
            extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js', '.scss', '.css'],
            alias: {
                'react-bolivianite-grid': Path.resolve(__dirname, '../src')
            },
            modules: [
                'node_modules',
                Path.resolve(__dirname, './node_modules')
            ]
        },
        plugins: [
            IS_PROD && new UglifyJsPlugin({
                parallel: true,
                sourceMap: true
            }),
            IS_PROD && new BundleAnalyzerPlugin({
                analyzerMode: 'static'
            }),
            IS_PROD && new Webpack.optimize.CommonsChunkPlugin({
                name: 'vendor',
                minChunks: module => module.context && module.context.includes('node_modules')
            }),
            IS_PROD && new Webpack.optimize.CommonsChunkPlugin({
                name: 'runtime',
                minChunks: Infinity
            }),
            new Webpack.DefinePlugin({
                'process.env': {
                    'ENV': JSON.stringify(IS_PROD ? 'production' : 'development'),
                    'NODE_ENV': JSON.stringify(IS_PROD ? 'production' : 'development')
                }
            }),
            new Webpack.LoaderOptionsPlugin({
                options: {
                    tslint: {
                        emitErrors: false,
                        failOnHint: false
                    },
                    context: '/'
                }
            }),
            new HtmlWebpackPlugin({
                template: Path.resolve(__dirname, './src/index.html'),
                inject: 'body',
                baseUrl: '/'
            })
        ].filter(v => !!v),
        module: {
            rules: [
                {
                    enforce: 'pre',
                    test: /\.tsx?$/,
                    loader: 'tslint-loader'
                },
                {
                    enforce: 'pre',
                    test: /\.jsx?$/,
                    loader: 'source-map-loader'
                },
                {
                    test: /\.tsx?$/,
                    loader: 'ts-loader'
                },
                {
                    test: /\.json$/,
                    loader: 'json-loader'
                },
                {
                    test: /(\.css$|\.scss$)/,
                    include: [
                        Path.resolve(__dirname, './src')
                    ],
                    loader: ExtractTextPlugin.extract({
                        fallback: 'style-loader',
                        use: [
                            {
                                loader: 'css-loader',
                                query: {
                                    modules: true,
                                    minimize: false,
                                    sourceMap: true,
                                    localIdentName: '[name]__[local]___[hash:base64:5]'
                                }
                            },
                            {
                                loader: 'postcss-loader',
                                options: {
                                    sourceMap: true
                                }
                            },
                            { loader: 'resolve-url-loader' },
                            {
                                loader: 'sass-loader',
                                query: {
                                    sourceMap: true
                                }
                            }
                        ]
                    })
                },
                {
                    test: /\.(png|jpg|gif|svg|ttf|eot|woff|woff2)$/,
                    loader: 'url-loader',
                    query: {
                        limit: 65536
                    }
                }
            ]
        },
        devServer: {
            port: PORT,
            historyApiFallback: true
        }
    } as Webpack.Configuration;
};