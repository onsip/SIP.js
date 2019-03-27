import { TypeStrings } from "./Enums";

export enum Levels {
  error,
  warn,
  log,
  debug
}

export class LoggerFactory {
  public type: TypeStrings;
  public builtinEnabled: boolean = true;

  // tslint:disable-next-line:variable-name
  private _level: Levels = Levels.log;
  // tslint:disable-next-line:variable-name
  private _connector: ((level: string, category: string, label: string | undefined, content: any) => void) | undefined;

  private loggers: any = {};
  private logger: Logger;

  constructor() {
    this.type = TypeStrings.LoggerFactory;
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
        this.print(console[Levels[levelToLog]], category, label, content);
      }
    }

    if (this.connector) {
      this.connector(Levels[levelToLog], category, label, content);
    }
  }

  private  print(target: ((content: string) => void), category: string, label: string | undefined, content: any): void {
    if (typeof content === "string") {
      const prefix: Array<any> = [new Date(), category];
      if (label) {
        prefix.push(label);
      }
      content = prefix.concat(content).join(" | ");
    }
    target.call(console, content);
  }
}

// tslint:disable-next-line:max-classes-per-file
export class Logger {
  public type: TypeStrings;

  private logger: LoggerFactory;
  private category: string;
  private label: string | undefined;
  constructor(logger: LoggerFactory, category: string, label?: string) {
    this.type = TypeStrings.Logger;
    this.logger = logger;
    this.category = category;
    this.label = label;
  }

  public error(content: string): void { this.genericLog(Levels.error, content); }
  public warn(content: string): void { this.genericLog(Levels.warn, content); }
  public log(content: string): void { this.genericLog(Levels.log, content); }
  public debug(content: string): void { this.genericLog(Levels.debug, content); }

  private genericLog(level: Levels, content: string): void {
    this.logger.genericLog(level, this.category, this.label, content);
  }
}
