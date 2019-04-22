import { TypeStrings } from "./Enums";
export declare enum Levels {
    error = 0,
    warn = 1,
    log = 2,
    debug = 3
}
export declare class LoggerFactory {
    type: TypeStrings;
    builtinEnabled: boolean;
    private _level;
    private _connector;
    private loggers;
    private logger;
    constructor();
    level: Levels;
    connector: ((level: string, category: string, label: string | undefined, content: any) => void) | undefined;
    getLogger(category: string, label?: string): Logger;
    genericLog(levelToLog: Levels, category: string, label: string | undefined, content: any): void;
    private print;
}
export declare class Logger {
    type: TypeStrings;
    private logger;
    private category;
    private label;
    constructor(logger: LoggerFactory, category: string, label?: string);
    error(content: string): void;
    warn(content: string): void;
    log(content: string): void;
    debug(content: string): void;
    private genericLog;
}
