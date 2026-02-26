/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = async (env, options) => {
    const isDev = options.mode !== "production";
    const urlBase = isDev
        ? "https://localhost:3000"
        : "https://vskeide.github.io/monte-carlo-anitgravity";

    return {
        entry: {
            taskpane: "./src/taskpane/index.tsx",
            functions: "./src/functions/functions.ts",
            commands: "./src/commands/commands.ts",
        },
        output: {
            path: path.resolve(__dirname, "dist"),
            filename: "[name].[contenthash].js",
            clean: true,
            publicPath: isDev ? "/" : "./",
        },
        resolve: {
            extensions: [".ts", ".tsx", ".js", ".jsx"],
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: "ts-loader",
                    exclude: /node_modules/,
                },
                {
                    test: /\.css$/,
                    use: ["style-loader", "css-loader"],
                },
                {
                    test: /\.(png|svg|jpg|jpeg|gif)$/i,
                    type: "asset/resource",
                },
            ],
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: "./src/taskpane/index.html",
                filename: "taskpane.html",
                chunks: ["taskpane"],
            }),
            new HtmlWebpackPlugin({
                template: "./src/functions/functions.html",
                filename: "functions.html",
                chunks: ["functions"],
            }),
            new HtmlWebpackPlugin({
                template: "./src/commands/commands.html",
                filename: "commands.html",
                chunks: ["commands"],
            }),
            new CopyWebpackPlugin({
                patterns: [
                    { from: "assets", to: "assets", noErrorOnMissing: true },
                    { from: "manifest.xml", to: "manifest.xml" },
                    { from: "src/functions/functions.json", to: "functions.json" },
                ],
            }),
        ],
        devServer: {
            port: 3000,
            server: {
                type: "https",
                options:
                    env.WEBPACK_BUILD || options.https !== undefined
                        ? options.https
                        : await getHttpsOptions(),
            },
            headers: { "Access-Control-Allow-Origin": "*" },
            client: { overlay: false },
        },
        devtool: isDev ? "source-map" : false,
    };
};

async function getHttpsOptions() {
    const devCerts = require("office-addin-dev-certs");
    const options = await devCerts.getHttpsServerOptions();
    return options;
}
