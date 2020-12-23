import { Levels } from "./levels";
import { LoggerFactory } from "./logger-factory";
/**
 * Logger.
 * @public
 */
export declare class Logger {
    private logger;
    private category;
    private label;
    constructor(logger: LoggerFactory, category: string, label?: string);
    error(content: string): void;
    warn(content: string): void;
    log(content: string): void;
    debug(content: string): void;
    private genericLog;
    get level(): Levels;
    set level(newLevel: Levels);
}
//# sourceMappingURL=logger.d.ts.map