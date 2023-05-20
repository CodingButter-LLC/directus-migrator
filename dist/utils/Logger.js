"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogConfig = exports.levels = void 0;
const winston_1 = require("winston");
const os_1 = require("os");
const child_process_1 = __importDefault(require("child_process"));
const { printf, combine, timestamp, label, colorize } = winston_1.format;
let deviceLabel = process.env.DEVICE_LABEL || process.env.NODE_ENV;
try {
    const ghEmail = (_b = (_a = child_process_1.default
        .execSync("git config --global user.email")) === null || _a === void 0 ? void 0 : _a.toString()) === null || _b === void 0 ? void 0 : _b.trim();
    const ghUser = (_d = (_c = child_process_1.default
        .execSync("git config --global user.name")) === null || _c === void 0 ? void 0 : _c.toString()) === null || _d === void 0 ? void 0 : _d.trim();
    deviceLabel = (ghEmail === null || ghEmail === void 0 ? void 0 : ghEmail.includes("@"))
        ? `git:${ghEmail}`
        : ghUser.length
            ? `git:${ghUser}`
            : (0, os_1.hostname)() || deviceLabel;
}
catch (e) {
    // do nothing
}
exports.levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
};
const timestampOptions = process.env.NODE_ENV === "development"
    ? { format: "YYYY-MM-DD HH:mm:ss" }
    : { format: "YYYY-MM-DD" };
const myFormat = printf(({ level, message, label, timestamp }) => `${timestamp} [${label}] ${level}: ${message}`);
class LogConfig {
    constructor() {
        this._format = printf;
        this.errorLogFile = process.env.ERROR_LOG_FILE;
        this.infoLogFile = process.env.INFO_LOG_FILE;
        this._label = deviceLabel || "unknown";
        this.logger = this.createLogger();
    }
    setLogger(_logger) {
        this.logger = _logger;
    }
    createLogger() {
        const loggerTransports = [
            new winston_1.transports.Console({ level: process.env.LOG_LEVEL || "info" }),
        ];
        if (this.errorLogFile) {
            loggerTransports.push(new winston_1.transports.File({ filename: "error.log", level: "error" }));
        }
        if (this.infoLogFile) {
            loggerTransports.push(new winston_1.transports.File({ filename: "info.log", level: "info" }));
        }
        return (0, winston_1.createLogger)({
            levels: exports.levels,
            format: combine(colorize(), label({ label: this.label }), timestamp(timestampOptions), myFormat),
            transports: loggerTransports,
        });
    }
    set format(fm) {
        this._format = fm;
        this.logger = this.createLogger();
    }
    get format() {
        return this._format;
    }
    get label() {
        return this._label;
    }
    set label(deviceLabel) {
        this._label = deviceLabel;
        this.logger = this.createLogger();
    }
}
exports.LogConfig = LogConfig;
const logger = new LogConfig().logger;
exports.default = logger;
//# sourceMappingURL=Logger.js.map