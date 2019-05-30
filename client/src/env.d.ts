declare interface NodeModule {
    hot?: {
        accept(path: string, cb: () => void): void;
    };
}
declare interface SiteData {
    SERVER_URL?: string;
}
