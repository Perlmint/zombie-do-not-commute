import { ReactStaticConfig } from "react-static";

// tslint:disable:object-literal-sort-keys

export default {
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
    }],
    plugins: [
        "react-static-plugin-sass",
        ["react-static-plugin-typescript", { typeCheck: false }],
    ],
} as ReactStaticConfig;
