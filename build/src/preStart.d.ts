export interface preStart {
    printCopyright(): void;
    initWinston(logFile: string, configFile: string): void;
    registerNconf(configFile: string): void;
    load(params?: loadParams): void;
}
export interface loadParams {
    configFile?: string;
    logFile?: string;
}
export declare class preStart implements preStart {
    static registerNconf(configFile: string): void;
    static initWinston(logFile: string, configFile: string): void;
    static printCopyright(): void;
    static load(config?: loadParams): void;
}
