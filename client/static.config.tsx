import React from "react";
import { ReactStaticConfig } from "react-static";

// tslint:disable:object-literal-sort-keys

const config: ReactStaticConfig<SiteData> = {
    entry: "index.tsx",
    paths: {
        root: process.cwd(),
        src: "src",
    },
    getSiteData: () => ({
        SERVER_URL: process.env.SERVER_URL,
    }),
    getRoutes: async () => [{
        path: "/",
        template: "src/chat",
        children: [{
            path: "faq",
            template: "src/faq",
        }],
    }],
    plugins: [
        "react-static-plugin-sass",
        ["react-static-plugin-typescript", { typeCheck: false }],
    ],
    Document({Html, Head, Body, children}) {
        return <Html>
            <Head>
                <meta name="twitter:card" content="app" />
                <meta name="twitter:creator" content="@Perlmint_" />
                <meta name="twitter:title" content="Zombie do not commute" />
                <meta name="twitter:description" content="Zombie do not commute. but you do" />
            </Head>
            <Body>
                { children }
            </Body>
        </Html>;
    },
};
export default config;
