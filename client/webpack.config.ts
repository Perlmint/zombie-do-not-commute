import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import path from "path";

export default {
    devServer: {
        host: "0.0.0.0",
    },
    devtool: "source-map",
    entry: "./src/index.tsx",
    module: {
        rules: [
            {
                exclude: /node_modules/,
                test: /\.tsx?$/,
                use: {
                    loader: "ts-loader",
                },
            },
            {
                test: /\.less$/,
                use: [
                    process.env.NODE_ENV === "development" ? {
                        loader: "style-loader",
                    } : {
                            loader: MiniCssExtractPlugin.loader,
                        },
                    {
                        loader: "css-loader",
                    },
                    {
                        loader: "less-loader",
                    },
                ],
            },
        ],
    },
    output: {
        filename: "client.js",
        path: path.resolve(__dirname, "./dist"),
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "src/index.html"),
        }),
        new MiniCssExtractPlugin({
            chunkFilename: "[id].css",
            filename: "[name].css",
        }),
    ],
    resolve: {
        extensions: [
            ".ts",
            ".tsx",
            ".js",
            ".json",
        ],
    },
};
