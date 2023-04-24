import { createLogger, format, transports, Logger, transport } from "winston";
import { TimestampOptions } from "logform";
import { hostname } from "os";
import exec from "child_process";

const { printf, combine, timestamp, label, colorize } = format;

let deviceLabel: string | undefined =
  process.env.DEVICE_LABEL || process.env.NODE_ENV;

try {
  const ghEmail: string | undefined = exec
    .execSync("git config --global user.email")
    ?.toString()
    ?.trim();
  const ghUser: string | undefined = exec
    .execSync("git config --global user.name")
    ?.toString()
    ?.trim();
  deviceLabel = ghEmail?.includes("@")
    ? `git:${ghEmail}`
    : ghUser.length
    ? `git:${ghUser}`
    : hostname() || deviceLabel;
} catch (e) {
  // do nothing
}

export const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
};

const timestampOptions: TimestampOptions =
  process.env.NODE_ENV === "development"
    ? { format: "YYYY-MM-DD HH:mm:ss" }
    : { format: "YYYY-MM-DD" };

const myFormat = printf(
  ({ level, message, label, timestamp }) =>
    `${timestamp} [${label}] ${level}: ${message}`
);

export class LogConfig {
  private _label: string;
  public logger: Logger;
  private _format: typeof printf = printf;
  public errorLogFile: string | undefined = process.env.ERROR_LOG_FILE;
  public infoLogFile: string | undefined = process.env.INFO_LOG_FILE;
  constructor() {
    this._label = deviceLabel || "unknown";
    this.logger = this.createLogger();
  }
  setLogger(_logger: Logger) {
    this.logger = _logger;
  }
  createLogger() {
    const loggerTransports: transport[] = [
      new transports.Console({ level: process.env.LOG_LEVEL || "debug" }),
    ];

    if (this.errorLogFile) {
      loggerTransports.push(
        new transports.File({ filename: "error.log", level: "error" })
      );
    }
    if (this.infoLogFile) {
      loggerTransports.push(
        new transports.File({ filename: "info.log", level: "info" })
      );
    }

    return createLogger({
      levels,
      level: process.env.LOG_LEVEL || "error",
      format: combine(
        colorize(),
        label({ label: this.label }),
        timestamp(timestampOptions),
        myFormat
      ),
      transports: loggerTransports,
    });
  }

  set format(fm: typeof printf) {
    this._format = fm;
    this.logger = this.createLogger();
  }

  get format(): typeof printf {
    return this._format;
  }

  get label() {
    return this._label;
  }
  set label(deviceLabel: string) {
    this._label = deviceLabel;
    this.logger = this.createLogger();
  }
}

const logger = new LogConfig().logger;

export default logger;
