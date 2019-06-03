import { Levels } from "./levels";
import { Logger } from "./logger";

/**
 * Logger.
 * @public
 */
export class LoggerFactory {
  public builtinEnabled: boolean = true;

  private _level: Levels = Levels.log;
  private _connector: ((level: string, category: string, label: string | undefined, content: any) => void) | undefined;

  private loggers: any = {};
  private logger: Logger;

  constructor() {
    this.logger = this.getLogger("sip:loggerfactory");
  }

  get level(): Levels { return this._level; }
  set level(newLevel: Levels) {
    if (newLevel >= 0 && newLevel <= 3) {
      this._level = newLevel;
    } else if (newLevel > 3) {
      this._level = 3;
    } else if (Levels.hasOwnProperty(newLevel)) {
      this._level = newLevel;
    } else {
      this.logger.error("invalid 'level' parameter value: " + JSON.stringify(newLevel));
    }
  }

  get connector(): ((level: string, category: string, label: string | undefined, content: any) => void) | undefined {
    return this._connector;
  }
  set connector(value: (
    (level: string, category: string, label: string | undefined, content: any) => void
  ) | undefined) {
    if (!value) {
      this._connector = undefined;
    } else if (typeof value === "function") {
      this._connector = value;
    } else {
      this.logger.error("invalid 'connector' parameter value: " + JSON.stringify(value));
    }
  }

  public getLogger(category: string, label?: string): Logger {
    if (label && this.level === 3) {
      return new Logger(this, category, label);
    } else if (this.loggers[category]) {
      return this.loggers[category];
    } else {
      const logger = new Logger(this, category);
      this.loggers[category] = logger;
      return logger;
    }
  }

  public genericLog(levelToLog: Levels, category: string, label: string | undefined, content: any): void {
    if (this.level >= levelToLog) {
      if (this.builtinEnabled) {
        this.print(levelToLog, category, label, content);
      }
    }

    if (this.connector) {
      this.connector(Levels[levelToLog], category, label, content);
    }
  }

  private print(levelToLog: Levels, category: string, label: string | undefined, content: any): void {
    if (typeof content === "string") {
      const prefix: Array<any> = [new Date(), category];
      if (label) {
        prefix.push(label);
      }
      content = prefix.concat(content).join(" | ");
    }
    switch (levelToLog) {
      case Levels.error:
        // tslint:disable-next-line:no-console
        console.error(content);
        break;
      case Levels.warn:
        // tslint:disable-next-line:no-console
        console.warn(content);
        break;
      case Levels.log:
        // tslint:disable-next-line:no-console
        console.log(content);
        break;
      case Levels.debug:
        // tslint:disable-next-line:no-console
        console.debug(content);
        break;
      default:
        break;
    }
  }
}
